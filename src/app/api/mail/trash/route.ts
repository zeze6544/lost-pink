import { NextResponse } from "next/server";
import { requireLiveMailbox } from "@/lib/mail-access";
import { trashMail, type MailFolder } from "@/lib/mail-imap";

export const runtime = "nodejs";
export const maxDuration = 30;

function folderOf(raw: string | null): MailFolder {
  if (raw === "sent" || raw === "trash") return raw;
  return "inbox";
}

export async function POST(request: Request) {
  let body: { pageId?: string; folder?: string; uid?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!body.pageId || !body.uid) {
    return NextResponse.json({ error: "Missing letter." }, { status: 400 });
  }
  const owned = await requireLiveMailbox(body.pageId);
  if ("error" in owned) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
  }
  try {
    await trashMail(
      owned.mailbox,
      folderOf(body.folder ?? null),
      Number(body.uid),
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("mail trash", err);
    return NextResponse.json({ error: "couldn't move that." }, { status: 502 });
  }
}
