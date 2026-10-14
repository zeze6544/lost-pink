import { NextRequest, NextResponse } from "next/server";
import { requireOwnedPage } from "@/lib/mailbox-auth";
import { provisionProgress } from "@/lib/mailbox-lifecycle";
import { getMailboxByPageId, toOwnerMailboxView } from "@/lib/mailbox-store";
import { publicMailboxLabel } from "@/lib/mailbox-status";

export async function GET(request: NextRequest) {
  const pageId = request.nextUrl.searchParams.get("pageId")?.trim();
  if (!pageId) {
    return NextResponse.json({ error: "Missing page." }, { status: 400 });
  }

  const owned = await requireOwnedPage(pageId);
  if ("error" in owned) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
  }

  const mailbox = await getMailboxByPageId(pageId);
  return NextResponse.json({
    label: publicMailboxLabel(owned.page.email_local, mailbox?.status),
    mailbox: mailbox ? toOwnerMailboxView(mailbox) : null,
    progress: mailbox
      ? provisionProgress(mailbox.status, mailbox.provision_step)
      : null,
  });
}
