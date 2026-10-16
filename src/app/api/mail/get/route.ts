import { NextResponse } from "next/server";
import { requireLiveMailbox } from "@/lib/mail-access";
import { signAttachmentToken } from "@/lib/mail-attachment-token";
import { classifyMailError } from "@/lib/mail-errors";
import { sanitizeMailHtml } from "@/lib/mail-html";
import { getMail, type MailFolder } from "@/lib/mail-imap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

function folderOf(raw: string | null): MailFolder {
  if (raw === "sent" || raw === "trash") return raw;
  return "inbox";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId")?.trim();
  const uid = Number(searchParams.get("uid"));
  const images = searchParams.get("images") === "1";
  const folder = folderOf(searchParams.get("folder"));
  if (!pageId || !Number.isSafeInteger(uid) || uid <= 0) {
    return NextResponse.json(
      { error: "missing letter.", retryable: false },
      { status: 400, headers: NO_STORE },
    );
  }
  const owned = await requireLiveMailbox(pageId);
  if ("error" in owned) {
    return NextResponse.json(
      {
        error: owned.error,
        retryable:
          owned.status === 409 && owned.error.includes("still arriving"),
      },
      {
        status: owned.status,
        headers: NO_STORE,
      },
    );
  }
  try {
    const letter = await getMail(owned.mailbox, folder, uid);
    if (!letter) {
      return NextResponse.json(
        { error: "gone.", retryable: false },
        {
          status: 404,
          headers: NO_STORE,
        },
      );
    }
    return NextResponse.json(
      {
        ...letter,
        html: letter.html ? sanitizeMailHtml(letter.html, images) : null,
        attachments: letter.attachments.map((attachment) => ({
          ...attachment,
          url: `/api/mail/download?token=${encodeURIComponent(
            signAttachmentToken({
              pageId,
              folder,
              uid,
              partId: attachment.partId,
            }),
          )}`,
        })),
      },
      { headers: NO_STORE },
    );
  } catch (err) {
    console.error("mail get", err);
    const mapped = classifyMailError(err);
    return NextResponse.json(
      { error: mapped.error, retryable: mapped.retryable },
      {
        status: mapped.status,
        headers: NO_STORE,
      },
    );
  }
}
