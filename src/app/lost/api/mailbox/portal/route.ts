import { NextRequest, NextResponse } from "next/server";
import { requireOwnedPage } from "@/lib/mailbox-auth";
import { getMailboxByPageId } from "@/lib/mailbox-store";
import { createCustomerPortalUrl } from "@/lib/polar";

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
  if (!mailbox?.polar_customer_id) {
    return NextResponse.json(
      { error: "no receipts yet." },
      { status: 404 },
    );
  }

  try {
    const url = await createCustomerPortalUrl(mailbox.polar_customer_id);
    if (!url) {
      return NextResponse.json(
        { error: "portal isn't ready." },
        { status: 503 },
      );
    }
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("polar portal failed", err);
    return NextResponse.json(
      { error: "couldn't open receipts." },
      { status: 502 },
    );
  }
}
