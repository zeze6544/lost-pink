import { NextResponse } from "next/server";
import { requireLiveMailbox } from "@/lib/mail-access";
import { mailboxPass, mailboxUser } from "@/lib/mail-imap";
import { MIGADU_IMAP, MIGADU_SMTP } from "@/lib/mailbox-settings";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId")?.trim();
  if (!pageId) {
    return NextResponse.json({ error: "missing page." }, { status: 400 });
  }
  const owned = await requireLiveMailbox(pageId);
  if ("error" in owned) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
  }
  const pass = mailboxPass(owned.mailbox);
  if (!pass) {
    return NextResponse.json({ error: "the inbox isn't ready yet." }, { status: 409 });
  }
  return NextResponse.json({
    user: mailboxUser(owned.mailbox),
    password: pass,
    imap: MIGADU_IMAP,
    smtp: MIGADU_SMTP,
  });
}
