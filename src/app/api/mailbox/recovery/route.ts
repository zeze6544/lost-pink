import { NextResponse } from "next/server";
import { setMailboxRecoveryEmail } from "@/lib/migadu";
import {
  getMailboxById,
  updateMailboxRecoveryEmail,
} from "@/lib/mailbox-store";
import { validRecoveryEmail } from "@/lib/slug";
import { getAuthUserId } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "sign in first." }, { status: 401 });
  }

  let body: { mailboxId?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON." }, { status: 400 });
  }

  const mailboxId = typeof body.mailboxId === "string" ? body.mailboxId : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!mailboxId) {
    return NextResponse.json({ error: "missing inbox." }, { status: 400 });
  }
  if (!validRecoveryEmail(email)) {
    return NextResponse.json(
      { error: "use a recovery email that isn't @lost.pink." },
      { status: 400 },
    );
  }

  const mailbox = await getMailboxById(mailboxId);
  if (!mailbox || mailbox.owner_id !== userId) {
    return NextResponse.json({ error: "not this inbox." }, { status: 404 });
  }

  const remote = await setMailboxRecoveryEmail(mailbox.email_local, email);
  if (!remote.ok) {
    return NextResponse.json({ error: remote.error }, { status: 502 });
  }
  await updateMailboxRecoveryEmail(mailbox.id, email);
  return NextResponse.json({ ok: true, recoveryEmail: email });
}
