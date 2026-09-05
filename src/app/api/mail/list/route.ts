import { NextResponse } from "next/server";
import { requireLiveMailbox } from "@/lib/mail-access";
import { classifyMailError } from "@/lib/mail-errors";
import { listMail, type MailFolder } from "@/lib/mail-imap";

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
  if (!pageId) {
    return NextResponse.json(
      { error: "missing page.", retryable: false },
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
    const result = await listMail(
      owned.mailbox,
      folderOf(searchParams.get("folder")),
    );
    return NextResponse.json(
      result,
      { headers: NO_STORE },
    );
  } catch (err) {
    console.error("mail list", err);
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
