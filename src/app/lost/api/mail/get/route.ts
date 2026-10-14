import { NextResponse } from "next/server";
import { requireLiveMailbox } from "@/lib/mail-access";
import { sanitizeMailHtml } from "@/lib/mail-html";
import { getMail, type MailFolder } from "@/lib/mail-imap";

export const runtime = "nodejs";
export const maxDuration = 30;

function folderOf(raw: string | null): MailFolder {
  if (raw === "sent" || raw === "trash") return raw;
  return "inbox";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId")?.trim();
  const uid = Number(searchParams.get("uid"));
  const images = searchParams.get("images") === "1";
  if (!pageId || !Number.isFinite(uid)) {
    return NextResponse.json({ error: "Missing letter." }, { status: 400 });
  }
  const owned = await requireLiveMailbox(pageId);
  if ("error" in owned) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
  }
  try {
    const letter = await getMail(
      owned.mailbox,
      folderOf(searchParams.get("folder")),
      uid,
    );
    if (!letter) {
      return NextResponse.json({ error: "gone." }, { status: 404 });
    }
    return NextResponse.json({
      ...letter,
      html: letter.html ? sanitizeMailHtml(letter.html, images) : null,
    });
  } catch (err) {
    console.error("mail get", err);
    return NextResponse.json({ error: "couldn't look." }, { status: 502 });
  }
}
