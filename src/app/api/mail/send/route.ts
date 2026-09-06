import { NextResponse } from "next/server";
import {
  ATTACH_MAX_FILES,
  attachKind,
  attachProblem,
  safeAttachName,
} from "@/lib/mail-attach";
import { requireLiveMailbox } from "@/lib/mail-access";
import { appendSent, mailboxPass, mailboxUser, rfc822Letter } from "@/lib/mail-imap";
import { sendUserMail, type MailAttachment } from "@/lib/mailer";

export const runtime = "nodejs";
export const maxDuration = 60;

const sentAt = new Map<string, number[]>();
const HOUR = 60 * 60 * 1000;

function allowSend(id: string): boolean {
  const now = Date.now();
  const prev = (sentAt.get(id) ?? []).filter((t) => now - t < HOUR);
  if (prev.length >= 30) return false;
  prev.push(now);
  sentAt.set(id, prev);
  return true;
}

type LetterBody = {
  pageId?: string;
  to?: string;
  cc?: string;
  subject?: string;
  text?: string;
  inReplyTo?: string;
  references?: string;
};

async function readLetter(request: Request): Promise<
  | { ok: true; body: LetterBody; attachments: MailAttachment[] }
  | { ok: false; error: string; status: number }
> {
  const ctype = request.headers.get("content-type") ?? "";
  if (ctype.includes("multipart/form-data")) {
    const form = await request.formData();
    const files: MailAttachment[] = [];
    const incoming = form.getAll("files");
    if (incoming.length > ATTACH_MAX_FILES) {
      return { ok: false, error: "four files is enough for one letter.", status: 400 };
    }
    for (const item of incoming) {
      if (!(item instanceof File)) continue;
      const problem = attachProblem(
        item,
        files.map((file) => ({ size: file.content.length })),
      );
      if (problem) return { ok: false, error: problem, status: 400 };
      const kind = attachKind(item);
      if (!kind) continue;
      files.push({
        filename: safeAttachName(item.name),
        content: Buffer.from(await item.arrayBuffer()),
        contentType: kind,
      });
    }
    return {
      ok: true,
      body: {
        pageId: String(form.get("pageId") ?? ""),
        to: String(form.get("to") ?? ""),
        cc: String(form.get("cc") ?? ""),
        subject: String(form.get("subject") ?? ""),
        text: String(form.get("text") ?? ""),
        inReplyTo: String(form.get("inReplyTo") ?? ""),
        references: String(form.get("references") ?? ""),
      },
      attachments: files,
    };
  }

  try {
    const body = (await request.json()) as LetterBody;
    return { ok: true, body, attachments: [] };
  } catch {
    return { ok: false, error: "invalid JSON.", status: 400 };
  }
}

export async function POST(request: Request) {
  const parsed = await readLetter(request);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  const { body, attachments } = parsed;
  if (!body.pageId) {
    return NextResponse.json({ error: "missing page." }, { status: 400 });
  }
  const to = (body.to ?? "").trim();
  if (!to || !to.includes("@")) {
    return NextResponse.json({ error: "who is it for?" }, { status: 400 });
  }
  const owned = await requireLiveMailbox(body.pageId);
  if ("error" in owned) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
  }
  if (!allowSend(owned.mailbox.id)) {
    return NextResponse.json(
      { error: "that's enough letters for now." },
      { status: 429 },
    );
  }
  const pass = mailboxPass(owned.mailbox);
  if (!pass) {
    return NextResponse.json({ error: "the inbox isn't ready yet." }, { status: 409 });
  }
  const text =
    (body.text ?? "").slice(0, 100_000) ||
    (attachments.length ? " " : "");
  const cc = body.cc?.trim() || undefined;
  const subject = (body.subject ?? "").trim() || "(no subject)";
  const inReplyTo = body.inReplyTo?.trim() || undefined;
  const references = body.references?.trim() || undefined;
  const sent = await sendUserMail({
    user: mailboxUser(owned.mailbox),
    pass,
    fromName: owned.mailbox.display_name || owned.page.word,
    to,
    cc,
    subject,
    text,
    inReplyTo,
    references,
    attachments,
  });
  if (!sent.ok) {
    return NextResponse.json({ error: sent.error }, { status: 502 });
  }
  try {
    await appendSent(
      owned.mailbox,
      sent.raw.length
        ? sent.raw
        : rfc822Letter({
            from: `"${(owned.mailbox.display_name || owned.page.word).replace(/"/g, "")}" <${mailboxUser(owned.mailbox)}>`,
            to,
            cc,
            subject,
            text,
            inReplyTo,
            references,
          }),
    );
  } catch (err) {
    console.error("mail sent-copy", err);
  }
  return NextResponse.json({ ok: true });
}
