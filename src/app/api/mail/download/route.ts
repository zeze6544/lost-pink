import { NextResponse } from "next/server";
import { requireLiveMailbox } from "@/lib/mail-access";
import { verifyAttachmentToken } from "@/lib/mail-attachment-token";
import { safeAttachName } from "@/lib/mail-attach";
import { classifyMailError } from "@/lib/mail-errors";
import { getMailAttachment } from "@/lib/mail-imap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SAFE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const binding = verifyAttachmentToken(searchParams.get("token") ?? "");
  if (!binding) {
    return NextResponse.json(
      { error: "that download link expired.", retryable: false },
      { status: 401, headers: SAFE_HEADERS },
    );
  }

  const owned = await requireLiveMailbox(binding.pageId);
  if ("error" in owned) {
    return NextResponse.json(
      {
        error: owned.error,
        retryable:
          owned.status === 409 && owned.error.includes("still arriving"),
      },
      { status: owned.status, headers: SAFE_HEADERS },
    );
  }

  try {
    const attachment = await getMailAttachment(
      owned.mailbox,
      binding.folder,
      binding.uid,
      binding.partId,
    );
    if (!attachment) {
      return NextResponse.json(
        { error: "that attachment isn't available.", retryable: false },
        { status: 404, headers: SAFE_HEADERS },
      );
    }

    const name = safeAttachName(attachment.meta.name);
    return new Response(new Uint8Array(attachment.content), {
      status: 200,
      headers: {
        ...SAFE_HEADERS,
        "Content-Disposition": `attachment; filename="${name}"`,
        "Content-Length": String(attachment.content.length),
        "Content-Type": attachment.meta.type,
      },
    });
  } catch (error) {
    console.error("mail attachment download", error);
    const mapped = classifyMailError(error);
    return NextResponse.json(
      { error: mapped.error, retryable: mapped.retryable },
      {
        status: mapped.status,
        headers: SAFE_HEADERS,
      },
    );
  }
}
