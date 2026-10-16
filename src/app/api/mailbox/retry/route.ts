import { NextResponse } from "next/server";
import { requireOwnedPage } from "@/lib/mailbox-auth";
import { provisionMailbox } from "@/lib/mailbox";
import { getMailboxByPageId, queueMailboxRetry } from "@/lib/mailbox-store";

export async function POST(request: Request) {
  let body: { pageId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON." }, { status: 400 });
  }

  const pageId = body.pageId?.trim();
  if (!pageId) {
    return NextResponse.json({ error: "missing page." }, { status: 400 });
  }

  const owned = await requireOwnedPage(pageId);
  if ("error" in owned) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
  }

  const mailbox = await getMailboxByPageId(pageId);
  if (!mailbox || mailbox.status !== "failed") {
    return NextResponse.json(
      { error: "nothing to retry." },
      { status: 409 },
    );
  }

  await queueMailboxRetry(mailbox.id);
  await provisionMailbox(mailbox.id);
  return NextResponse.json({ ok: true });
}
