import { NextResponse } from "next/server";
import { sendLifecycleMail } from "@/lib/mailer";
import { getMailboxByEmailLocal } from "@/lib/mailbox-store";
import { SITE_RESET_PATH } from "@/lib/mailbox-settings";
import { normalizeWord, validRecoveryEmail } from "@/lib/slug";
import { siteUrl } from "@/lib/site";
import { supabaseAdminAuth } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON." }, { status: 400 });
  }
  const raw = (body.email ?? "").trim().toLowerCase();
  const local = normalizeWord(raw.split("@")[0] ?? "");
  const mailbox = await getMailboxByEmailLocal(local);
  if (!mailbox?.recovery_email || !validRecoveryEmail(mailbox.recovery_email)) {
    return NextResponse.json({ ok: true });
  }
  const admin = supabaseAdminAuth();
  if (!admin) {
    return NextResponse.json({ error: "not yet." }, { status: 503 });
  }
  const inbox = `${local}@lost.pink`;
  const redirectTo = `${siteUrl()}/auth/callback?next=${encodeURIComponent(SITE_RESET_PATH)}`;
  const link = await admin.auth.admin.generateLink({
    type: "recovery",
    email: inbox,
    options: { redirectTo },
  });
  if (link.error) {
    console.error("recovery link failed", link.error.message);
    return NextResponse.json({ ok: true });
  }
  const props = link.data?.properties as
    | { hashed_token?: string; action_link?: string }
    | undefined;
  const hashed =
    props?.hashed_token?.trim() ||
    (typeof (props as { hashedToken?: string } | undefined)?.hashedToken ===
    "string"
      ? (props as { hashedToken?: string }).hashedToken?.trim()
      : "");
  const action = props?.action_link?.trim();
  const url = hashed
    ? `${siteUrl()}/auth/callback?token_hash=${encodeURIComponent(hashed)}&type=recovery&next=${encodeURIComponent(SITE_RESET_PATH)}`
    : action;
  if (!url) {
    return NextResponse.json({ ok: true });
  }
  await sendLifecycleMail({
    to: mailbox.recovery_email,
    subject: "open lost.pink again",
    text: [
      "use this link to set a new password for your lost.pink inbox.",
      "the password form opens on lost.pink.",
      "",
      url,
      "",
    ].join("\n"),
  });
  return NextResponse.json({ ok: true });
}
