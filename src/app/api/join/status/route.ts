import { NextResponse } from "next/server";
import { ensureJoinPaid, mailboxFromJoinQuery } from "@/lib/join-paid";
import { displayLostEmail } from "@/lib/slug";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mailboxId = searchParams.get("mailbox");
  const checkoutId = searchParams.get("checkout_id") ?? searchParams.get("checkout");
  const mailbox = await mailboxFromJoinQuery({ mailboxId, checkoutId });
  if (!mailbox) {
    return NextResponse.json({ error: "that payment isn’t here." }, { status: 404 });
  }
  const paid = await ensureJoinPaid(mailbox, checkoutId);
  if (!paid) {
    return NextResponse.json({ paid: false, error: "that payment isn’t here." });
  }
  return NextResponse.json({
    paid: true,
    mailboxId: paid.id,
    local: paid.email_local,
    email: displayLostEmail(paid.email_local),
    ready: paid.status === "live",
    awaiting: paid.status === "awaiting_account",
  });
}
