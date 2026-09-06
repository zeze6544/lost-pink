import { NextResponse } from "next/server";
import {
  darkenExpiredMailboxes,
  retryDueProvisioning,
  sendDueReminders,
  sweepAbandonedCheckouts,
} from "@/lib/mailbox";
import { expireFreePages } from "@/lib/pages";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const removed = await expireFreePages();
  const abandoned = await sweepAbandonedCheckouts();
  const retried = await retryDueProvisioning();
  const reminded = await sendDueReminders();
  const darkened = await darkenExpiredMailboxes();
  return NextResponse.json({ removed, abandoned, retried, reminded, darkened });
}
