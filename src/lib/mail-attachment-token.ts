import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import type { MailFolder } from "./mail-types";

const TOKEN_VERSION = 1;
const TOKEN_TTL_SECONDS = 5 * 60;
let cachedMaterial = "";
let cachedKey: Buffer | null = null;

export type AttachmentTokenBinding = {
  pageId: string;
  folder: MailFolder;
  uid: number;
  partId: string;
};

type AttachmentTokenPayload = AttachmentTokenBinding & {
  v: number;
  iat: number;
  exp: number;
};

function tokenKey(): Buffer {
  const material =
    process.env.MAILBOX_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "dev-mailbox-secret";
  if (!cachedKey || cachedMaterial !== material) {
    cachedMaterial = material;
    cachedKey = scryptSync(material, "lost.pink.mailbox", 32);
  }
  return cachedKey;
}

function signature(payload: string): Buffer {
  return createHmac("sha256", tokenKey())
    .update("lost.pink.mail-attachment.v1\0")
    .update(payload)
    .digest();
}

function validBinding(value: unknown): value is AttachmentTokenBinding {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.pageId === "string" &&
    row.pageId.length > 0 &&
    (row.folder === "inbox" ||
      row.folder === "sent" ||
      row.folder === "trash") &&
    typeof row.uid === "number" &&
    Number.isSafeInteger(row.uid) &&
    row.uid > 0 &&
    typeof row.partId === "string" &&
    /^[1-9]\d*(?:\.[1-9]\d*)*$/.test(row.partId)
  );
}

export function signAttachmentToken(
  binding: AttachmentTokenBinding,
  nowMs = Date.now(),
): string {
  if (!validBinding(binding)) throw new Error("Invalid attachment binding.");
  const iat = Math.floor(nowMs / 1000);
  const payload: AttachmentTokenPayload = {
    v: TOKEN_VERSION,
    ...binding,
    iat,
    exp: iat + TOKEN_TTL_SECONDS,
  };
  const packed = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${packed}.${signature(packed).toString("base64url")}`;
}

export function verifyAttachmentToken(
  token: string,
  expected?: AttachmentTokenBinding,
  nowMs = Date.now(),
): AttachmentTokenBinding | null {
  const [packed, signed, extra] = token.split(".");
  if (!packed || !signed || extra) return null;

  let supplied: Buffer;
  try {
    supplied = Buffer.from(signed, "base64url");
  } catch {
    return null;
  }
  const wanted = signature(packed);
  if (
    supplied.length !== wanted.length ||
    !timingSafeEqual(supplied, wanted)
  ) {
    return null;
  }

  let payload: AttachmentTokenPayload;
  try {
    payload = JSON.parse(
      Buffer.from(packed, "base64url").toString("utf8"),
    ) as AttachmentTokenPayload;
  } catch {
    return null;
  }
  const now = Math.floor(nowMs / 1000);
  if (
    !validBinding(payload) ||
    payload.v !== TOKEN_VERSION ||
    !Number.isSafeInteger(payload.iat) ||
    !Number.isSafeInteger(payload.exp) ||
    payload.exp - payload.iat !== TOKEN_TTL_SECONDS ||
    payload.iat > now + 30 ||
    payload.exp <= now
  ) {
    return null;
  }

  const binding: AttachmentTokenBinding = {
    pageId: payload.pageId,
    folder: payload.folder,
    uid: payload.uid,
    partId: payload.partId,
  };
  if (
    expected &&
    (binding.pageId !== expected.pageId ||
      binding.folder !== expected.folder ||
      binding.uid !== expected.uid ||
      binding.partId !== expected.partId)
  ) {
    return null;
  }
  return binding;
}
