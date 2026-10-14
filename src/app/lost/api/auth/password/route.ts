import { NextResponse } from "next/server";
import { displayLostEmail } from "@/lib/slug";
import { createRouteSupabase } from "@/lib/supabase/route";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
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
    return NextResponse.json({ error: "that didn’t open." }, { status: 400 });
  }
  return route.applyCookies(NextResponse.json({ ok: true }));
}
