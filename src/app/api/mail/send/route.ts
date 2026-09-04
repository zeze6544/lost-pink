import { NextResponse } from "next/server";
import { requireLiveMailbox } from "@/lib/mail-access";
import { appendSent, mailboxPass, mailboxUser, rfc822Letter } from "@/lib/mail-imap";
import { sendUserMail } from "@/lib/mailer";

export const runtime = "nodejs";
export const maxDuration = 30;

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

export async function POST(request: Request) {
  let body: {
    pageId?: string;
    to?: string;
    cc?: string;
    subject?: string;
    text?: string;
    inReplyTo?: string;
    references?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!body.pageId) {
    return NextResponse.json({ error: "Missing page." }, { status: 400 });
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
  const sent = await sendUserMail({
    user: mailboxUser(owned.mailbox),
    pass,
    fromName: owned.mailbox.display_name || owned.page.word,
    to,
    cc: body.cc?.trim() || undefined,
    subject: (body.subject ?? "").trim() || "(no subject)",
    text: (body.text ?? "").slice(0, 100_000),
    inReplyTo: body.inReplyTo,
    references: body.references,
  });
  if (!sent.ok) {
    return NextResponse.json({ error: sent.error }, { status: 502 });
  }
  const from = `"${(owned.mailbox.display_name || owned.page.word).replace(/"/g, "")}" <${mailboxUser(owned.mailbox)}>`;
  try {
    await appendSent(
      owned.mailbox,
      rfc822Letter({
        from,
        to,
        cc: body.cc?.trim() || undefined,
        subject: (body.subject ?? "").trim() || "(no subject)",
        text: (body.text ?? "").slice(0, 100_000),
        inReplyTo: body.inReplyTo,
        references: body.references,
      }),
    );
  } catch (err) {
    console.error("mail sent-copy", err);
  }
  return NextResponse.json({ ok: true });
}
