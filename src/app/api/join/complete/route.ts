import { NextResponse } from "next/server";
import { ensureJoinPaid, mailboxFromJoinQuery } from "@/lib/join-paid";
import { readJoinPhoneProof } from "@/lib/join-session";
import { skipPhoneVerification } from "@/lib/twilio";
import { provisionMailbox } from "@/lib/mailbox";
import { encryptSecret } from "@/lib/mailbox-secret";
import { attachMailboxAccount } from "@/lib/mailbox-store";
import { setPageOwner } from "@/lib/pages";
import { displayLostEmail } from "@/lib/slug";
import { supabaseAdminAuth } from "@/lib/supabase/admin";
import { createRouteSupabase } from "@/lib/supabase/route";

function validRecovery(email: string): boolean {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  return !email.toLowerCase().endsWith("@lost.pink");
}

export async function POST(request: Request) {
  let body: {
    mailbox?: string;
    checkout_id?: string;
    name?: string;
    recovery?: string;
    password?: string;
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
  if (paid.owner_id && paid.status === "live") {
    return NextResponse.json({ slug: paid.email_local });
  }

  let phone = await readJoinPhoneProof(paid.id);
  if (!phone && skipPhoneVerification()) {
    phone = "skipped";
  }
  if (!phone) {
    return NextResponse.json({ error: "check your phone first." }, { status: 400 });
  }

  const name = (body.name ?? "").trim().slice(0, 80);
  if (name.length < 2) {
    return NextResponse.json({ error: "we need a name." }, { status: 400 });
  }
  const recovery = (body.recovery ?? "").trim().toLowerCase();
  if (!validRecovery(recovery)) {
    return NextResponse.json(
      { error: "use a recovery email that isn’t @lost.pink." },
      { status: 400 },
    );
  }
  const password = body.password ?? "";
  if (password.length < 8) {
    return NextResponse.json(
      { error: "make the password at least 8 characters." },
      { status: 400 },
    );
  }

  const admin = supabaseAdminAuth();
  const route = await createRouteSupabase();
  if (!admin || !route) {
    return NextResponse.json({ error: "not yet." }, { status: 503 });
  }
  const { supabase, applyCookies } = route;

  const inboxEmail = displayLostEmail(paid.email_local);
  const created = await admin.auth.admin.createUser({
    email: inboxEmail,
    password,
    email_confirm: true,
    user_metadata: { display_name: name },
  });
  let ownerId: string | null = created.data.user?.id ?? null;
  if (created.error || !ownerId) {
    if (!created.error?.message?.toLowerCase().includes("already")) {
      console.error("join create user", created.error);
      return NextResponse.json({ error: "couldn't open the account." }, { status: 400 });
    }
    // Resume a half-finished join: same password must unlock the existing auth user.
    const resumed = await supabase.auth.signInWithPassword({
      email: inboxEmail,
      password,
    });
    if (resumed.error || !resumed.data.user) {
      return NextResponse.json(
        { error: "that inbox already has a sign-in. come back." },
        { status: 409 },
      );
    }
    ownerId = resumed.data.user.id;
  }

  await setPageOwner(paid.page_id, ownerId);
  await attachMailboxAccount({
    mailboxId: paid.id,
    ownerId,
    displayName: name,
    recoveryEmail: recovery,
    phone,
    passwordSecret: encryptSecret(password),
  });
  const provisioned = await provisionMailbox(paid.id);

  if (!created.data.user) {
    // Already signed in during resume.
  } else {
    const signed = await supabase.auth.signInWithPassword({
      email: inboxEmail,
      password,
    });
    if (signed.error) {
      console.error("join sign-in", signed.error);
      return NextResponse.json(
        { error: "the inbox is open. come back with that password." },
        { status: 409 },
      );
    }
  }

  if (!provisioned || provisioned.status !== "live") {
    return applyCookies(
      NextResponse.json({
        slug: paid.email_local,
        pending: true,
        error: "account is ready. the inbox is still catching up — open it and try again.",
      }),
    );
  }

  return applyCookies(NextResponse.json({ slug: paid.email_local }));
}
