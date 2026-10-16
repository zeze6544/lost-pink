import { NextResponse } from "next/server";
import { syncOwnedMailboxPassword } from "@/lib/mailbox-password";
import { displayLostEmail } from "@/lib/slug";
import { createRouteSupabase } from "@/lib/supabase/route";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON." }, { status: 400 });
  }
  const raw = (body.email ?? "").trim().toLowerCase();
  const local = raw.includes("@") ? raw : `${raw}@lost.pink`;
  const email = local.endsWith("@lost.pink")
    ? local
    : displayLostEmail(raw.split("@")[0] ?? "");
  const password = body.password ?? "";
  if (!password) {
    return NextResponse.json({ error: "the password is missing." }, { status: 400 });
  }
  const route = await createRouteSupabase();
  if (!route) {
    return NextResponse.json({ error: "not yet." }, { status: 503 });
  }
  const { error } = await route.supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return NextResponse.json({ error: "that didn't open." }, { status: 400 });
  }
  return route.applyCookies(NextResponse.json({ ok: true }));
}

export async function PATCH(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON." }, { status: 400 });
  }
  const password = body.password ?? "";
  if (password.length < 8) {
    return NextResponse.json(
      { error: "make the password at least 8 characters." },
      { status: 400 },
    );
  }
  const route = await createRouteSupabase();
  if (!route) {
    return NextResponse.json({ error: "not yet." }, { status: 503 });
  }
  const { data } = await route.supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "sign in first." }, { status: 401 });
  }
  const { error } = await route.supabase.auth.updateUser({ password });
  if (error) {
    return NextResponse.json(
      { error: "couldn't update the password." },
      { status: 400 },
    );
  }
  await syncOwnedMailboxPassword(data.user.id, password);
  return route.applyCookies(NextResponse.json({ ok: true }));
}
