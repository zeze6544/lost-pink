import { NextResponse } from "next/server";
import { requireOwnedPage } from "@/lib/mailbox-auth";
import { sendSetupHelp } from "@/lib/mailbox";
import { canSendSetupHelp, getMailboxByPageId } from "@/lib/mailbox-store";

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
  if (!mailbox) {
    return NextResponse.json({ error: "no inbox to help with." }, { status: 404 });
  }
  if (!(await canSendSetupHelp(mailbox.id))) {
    return NextResponse.json(
      { error: "wait a little, then ask again." },
      { status: 429 },
    );
  }

  const sent = await sendSetupHelp(pageId);
  if (!sent.ok) {
    return NextResponse.json({ error: sent.error }, { status: sent.status });
  }
  return NextResponse.json({ ok: true });
}
