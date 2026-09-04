import { NextResponse } from "next/server";
import { ensureJoinPaid, mailboxFromJoinQuery } from "@/lib/join-paid";
import { readJoinPhoneProof, setJoinPhoneProof } from "@/lib/join-session";
import { normalizePhone } from "@/lib/phone";
import { checkPhoneCode } from "@/lib/twilio";

export async function POST(request: Request) {
  let body: {
    mailbox?: string;
    checkout_id?: string;
    phone?: string;
    code?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const mailbox = await mailboxFromJoinQuery({
    mailboxId: body.mailbox,
    checkoutId: body.checkout_id,
  });
  if (!mailbox) {
    return NextResponse.json({ error: "that payment isn’t here." }, { status: 404 });
  }
  const paid = await ensureJoinPaid(mailbox, body.checkout_id);
  if (!paid) {
    return NextResponse.json({ error: "that payment isn’t here." }, { status: 402 });
  }
  const phone = normalizePhone(body.phone ?? "") ?? (await readJoinPhoneProof(paid.id));
  if (!phone) {
    return NextResponse.json(
      { error: "that doesn’t look like a phone." },
      { status: 400 },
    );
  }
  const checked = await checkPhoneCode(phone, body.code ?? "");
  if (!checked.ok) {
    return NextResponse.json({ error: checked.error }, { status: 400 });
  }
  await setJoinPhoneProof(paid.id, phone);
  return NextResponse.json({ ok: true });
}
