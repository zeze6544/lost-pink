import { NextResponse } from "next/server";
import { requireLiveMailbox } from "@/lib/mail-access";
import { listMail, type MailFolder } from "@/lib/mail-imap";

export const runtime = "nodejs";
export const maxDuration = 30;

function folderOf(raw: string | null): MailFolder {
  if (raw === "sent" || raw === "trash") return raw;
  return "inbox";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId")?.trim();
  if (!pageId) {
    return NextResponse.json({ error: "Missing page." }, { status: 400 });
  }
  const owned = await requireLiveMailbox(pageId);
  if ("error" in owned) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
  }
  try {
    const items = await listMail(owned.mailbox, folderOf(searchParams.get("folder")));
    return NextResponse.json({ items });
  } catch (err) {
    console.error("mail list", err);
    return NextResponse.json({ error: "couldn't look." }, { status: 502 });
  }
}
