import {
  ATTACH_MAX_BYTES,
  ATTACH_MAX_FILES,
  attachKind,
  safeAttachName,
} from "./mail-attach";
import type { MailAttachmentMeta } from "./mail-types";

type Part = {
  partId: string;
  mediaType: string;
  disposition: string;
  filename: string;
  encoding: string;
  charset: string;
  body: string;
};

type ExtractedAttachment = {
  meta: MailAttachmentMeta;
  content: Buffer;
};

export type ParsedMailSource = {
  text: string;
  html: string | null;
  attachments: MailAttachmentMeta[];
  skippedAttachments: number;
};

function parseHeaders(raw: string): Record<string, string> {
  const unfolded = raw.replace(/\r?\n[ \t]/g, " ");
  const headers: Record<string, string> = {};
  for (const line of unfolded.split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim().toLowerCase();
    const val = line.slice(i + 1).trim();
    headers[key] = headers[key] ? `${headers[key]} ${val}` : val;
  }
  return headers;
}

function headerParam(value: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(
    `(?:^|;\\s*)${escaped}\\s*=\\s*("([^"]*)"|'([^']*)'|([^;]+))`,
    "i",
  ).exec(value);
  return (match?.[2] ?? match?.[3] ?? match?.[4] ?? "").trim();
}

function decodeQuotedPrintable(input: string): Buffer {
  const unfolded = input.replace(/=\r?\n/g, "");
  const out: number[] = [];
  for (let i = 0; i < unfolded.length; i++) {
    if (
      unfolded[i] === "=" &&
      /^[0-9A-Fa-f]{2}/.test(unfolded.slice(i + 1, i + 3))
    ) {
      out.push(parseInt(unfolded.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      out.push(unfolded.charCodeAt(i) & 0xff);
    }
  }
  return Buffer.from(out);
}

function decodeTransferBody(body: string, encoding: string): Buffer | null {
  const enc = encoding.toLowerCase();
  if (enc === "base64") {
    const compact = body.replace(/\s+/g, "");
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) return null;
    return Buffer.from(compact, "base64");
  }
  if (enc === "quoted-printable") return decodeQuotedPrintable(body);
  return Buffer.from(body, "latin1");
}

function decodeBuffer(buf: Buffer, charset: string): string {
  const cs = charset.toLowerCase().replace(/['"]/g, "") || "utf-8";
  try {
    return new TextDecoder(
      cs === "iso-8859-1" || cs === "latin1" ? "latin1" : "utf-8",
    ).decode(buf);
  } catch {
    return buf.toString("utf8");
  }
}

function decodeBody(body: string, encoding: string, charset: string): string {
  const buf = decodeTransferBody(body, encoding);
  return buf ? decodeBuffer(buf, charset) : "";
}

function decodeHeaderWords(value: string): string {
  return value.replace(
    /=\?([^?]+)\?([bq])\?([^?]*)\?=/gi,
    (_all, charset: string, encoding: string, body: string) => {
      const buf =
        encoding.toLowerCase() === "b"
          ? Buffer.from(body, "base64")
          : decodeQuotedPrintable(body.replace(/_/g, " "));
      return decodeBuffer(buf, charset);
    },
  );
}

function decodeFilename(value: string): string {
  const rfc2231 = /^([^']*)'[^']*'(.*)$/.exec(value);
  if (rfc2231) {
    try {
      return decodeURIComponent(rfc2231[2]);
    } catch {
      return rfc2231[2].replace(/%([0-9a-f]{2})/gi, (_, hex: string) =>
        String.fromCharCode(parseInt(hex, 16)),
      );
    }
  }
  return decodeHeaderWords(value);
}

function splitEntity(raw: string): { headers: Record<string, string>; body: string } {
  const cut = raw.search(/\r?\n\r?\n/);
  if (cut === -1) return { headers: parseHeaders(raw), body: "" };
  return {
    headers: parseHeaders(raw.slice(0, cut)),
    body: raw.slice(cut).replace(/^\r?\n\r?\n/, "").replace(/^\r?\n/, ""),
  };
}

function collectParts(raw: string, parts: Part[], partId = ""): void {
  const { headers, body } = splitEntity(raw);
  const contentType = headers["content-type"] ?? "text/plain";
  const mediaType = contentType.split(";")[0].trim().toLowerCase();
  const encoding = headers["content-transfer-encoding"] ?? "7bit";
  const charset = headerParam(contentType, "charset") || "utf-8";
  const boundary = headerParam(contentType, "boundary");

  if (mediaType.startsWith("multipart/") && boundary) {
    const token = `--${boundary}`;
    const chunks = body.split(token).slice(1);
    let child = 0;
    for (const chunk of chunks) {
      if (chunk.startsWith("--")) break;
      child += 1;
      collectParts(
        chunk.replace(/^\r?\n/, "").replace(/\r?\n$/, ""),
        parts,
        partId ? `${partId}.${child}` : String(child),
      );
    }
    return;
  }

  const contentDisposition = headers["content-disposition"] ?? "";
  const disposition = contentDisposition.split(";")[0].trim().toLowerCase();
  const rawFilename =
    headerParam(contentDisposition, "filename*") ||
    headerParam(contentDisposition, "filename") ||
    headerParam(contentType, "name*") ||
    headerParam(contentType, "name");

  parts.push({
    partId: partId || "1",
    mediaType,
    disposition,
    filename: rawFilename ? decodeFilename(rawFilename) : "",
    encoding,
    charset,
    body,
  });
}

function isAttachmentPart(part: Part): boolean {
  return (
    part.disposition === "attachment" ||
    (part.disposition === "inline" && Boolean(part.filename))
  );
}

function collectAttachments(parts: Part[]): {
  attachments: ExtractedAttachment[];
  skipped: number;
} {
  const attachments: ExtractedAttachment[] = [];
  let skipped = 0;
  let total = 0;

  for (const part of parts) {
    if (!isAttachmentPart(part)) continue;
    if (attachments.length >= ATTACH_MAX_FILES) {
      skipped += 1;
      continue;
    }

    const name = safeAttachName(part.filename || "attachment");
    const type = attachKind({ name: part.filename, type: part.mediaType });
    if (!type) {
      skipped += 1;
      continue;
    }

    const compactLength =
      part.encoding.toLowerCase() === "base64"
        ? part.body.replace(/\s+/g, "").length
        : part.body.length;
    if (compactLength > ATTACH_MAX_BYTES * 4 + 16) {
      skipped += 1;
      continue;
    }

    const content = decodeTransferBody(part.body, part.encoding);
    if (
      !content ||
      content.length <= 0 ||
      content.length > ATTACH_MAX_BYTES ||
      total + content.length > ATTACH_MAX_BYTES
    ) {
      skipped += 1;
      continue;
    }

    total += content.length;
    attachments.push({
      meta: {
        partId: part.partId,
        name,
        type,
        size: content.length,
      },
      content,
    });
  }

  return { attachments, skipped };
}

export function parseMailSource(raw: string): ParsedMailSource {
  const parts: Part[] = [];
  collectParts(raw, parts);
  const bodyParts = parts.filter((part) => !isAttachmentPart(part));
  const textPart = bodyParts.find((part) => part.mediaType === "text/plain");
  const htmlPart = bodyParts.find((part) => part.mediaType === "text/html");
  const text = textPart
    ? decodeBody(textPart.body, textPart.encoding, textPart.charset)
        .replace(/\s+\n/g, "\n")
        .trim()
        .slice(0, 20_000)
    : "";
  const html = htmlPart
    ? decodeBody(htmlPart.body, htmlPart.encoding, htmlPart.charset).trim()
    : null;
  const received = collectAttachments(parts);
  if (text || html) {
    return {
      text,
      html,
      attachments: received.attachments.map((item) => item.meta),
      skippedAttachments: received.skipped,
    };
  }

  const { headers, body } = splitEntity(raw);
  const encoding = headers["content-transfer-encoding"] ?? "7bit";
  const charset = headerParam(headers["content-type"] ?? "", "charset") || "utf-8";
  const rootType = (headers["content-type"] ?? "text/plain")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const decoded = rootType.startsWith("text/") && !parts[0]?.disposition
    ? decodeBody(body, encoding, charset)
        .replace(/\s+\n/g, "\n")
        .trim()
        .slice(0, 20_000)
    : "";
  return {
    text: decoded,
    html: null,
    attachments: received.attachments.map((item) => item.meta),
    skippedAttachments: received.skipped,
  };
}

export function extractMailAttachment(
  raw: string,
  partId: string,
): ExtractedAttachment | null {
  const parts: Part[] = [];
  collectParts(raw, parts);
  const received = collectAttachments(parts);
  return received.attachments.find((item) => item.meta.partId === partId) ?? null;
}
