import { NextResponse } from "next/server";
import { sendLifecycleMail } from "@/lib/mailer";
import { getMailboxByEmailLocal } from "@/lib/mailbox-store";
import { normalizeWord } from "@/lib/slug";
import { siteUrl } from "@/lib/site";
import { supabaseAdminAuth } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const raw = (body.email ?? "").trim().toLowerCase();
  const local = normalizeWord(raw.split("@")[0] ?? "");
  const mailbox = await getMailboxByEmailLocal(local);
  if (!mailbox?.recovery_email) {
    return NextResponse.json({ ok: true });
  }
  const admin = supabaseAdminAuth();
  if (!admin) {
    return NextResponse.json({ error: "not yet." }, { status: 503 });
  }
  const inbox = `${local}@lost.pink`;
  const link = await admin.auth.admin.generateLink({
    type: "recovery",
    email: inbox,
    options: { redirectTo: `${siteUrl()}/auth/callback?next=/${local}` },
  });
  const action =
    link.data?.properties?.action_link ??
    (link.data as { action_link?: string } | undefined)?.action_link;
  if (!action) {
    return NextResponse.json({ ok: true });
  }
  await sendLifecycleMail({
    to: mailbox.recovery_email,
    subject: "open lost.pink again",
    text: `a quiet link, so you can set a new password:\n\n${action}\n`,
  });
  return NextResponse.json({ ok: true });
}
