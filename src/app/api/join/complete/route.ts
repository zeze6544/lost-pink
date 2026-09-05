import { NextResponse } from "next/server";
import { ensureJoinPaid, mailboxFromJoinQuery } from "@/lib/join-paid";
import { provisionMailbox } from "@/lib/mailbox";
import { encryptSecret } from "@/lib/mailbox-secret";
import { attachMailboxAccount } from "@/lib/mailbox-store";
import { setPageOwner } from "@/lib/pages";
import { displayLostEmail, validRecoveryEmail } from "@/lib/slug";
import { supabaseAdminAuth } from "@/lib/supabase/admin";
import { createRouteSupabase } from "@/lib/supabase/route";

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
    return NextResponse.json({ error: "invalid JSON." }, { status: 400 });
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
    return NextResponse.json(
      { error: "that inbox already has a sign-in. log in.", slug: paid.email_local },
      { status: 409 },
    );
  }

  const name = (body.name ?? "").trim().slice(0, 80);
  if (name.length < 2) {
    return NextResponse.json({ error: "we need a name." }, { status: 400 });
  }
  const recovery = (body.recovery ?? "").trim().toLowerCase();
  if (!validRecoveryEmail(recovery)) {
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
  if (created.error || !created.data.user) {
    if (created.error?.message?.toLowerCase().includes("already")) {
      return NextResponse.json(
        { error: "that inbox already has a sign-in. log in." },
        { status: 409 },
      );
    }
    console.error("join create user", created.error);
    return NextResponse.json({ error: "couldn't open the account." }, { status: 400 });
  }

  const ownerId = created.data.user.id;
  await setPageOwner(paid.page_id, ownerId);
  await attachMailboxAccount({
    mailboxId: paid.id,
    ownerId,
    displayName: name,
    recoveryEmail: recovery,
    passwordSecret: encryptSecret(password),
  });
  const provisioned = await provisionMailbox(paid.id);
  if (!provisioned || provisioned.status !== "live") {
    return NextResponse.json(
      { error: "couldn't open the inbox. try again in a moment." },
      { status: 502 },
    );
  }

  const signed = await supabase.auth.signInWithPassword({
    email: inboxEmail,
    password,
  });
  if (signed.error) {
    console.error("join sign-in", signed.error);
    return NextResponse.json(
      { error: "that inbox already exists. sign in with that password." },
      { status: 409 },
    );
  }

  return applyCookies(NextResponse.json({ slug: paid.email_local }));
}
