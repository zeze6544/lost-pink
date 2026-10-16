import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/route";

const OTP_TYPES = new Set([
  "recovery",
  "email",
  "magiclink",
  "signup",
  "invite",
  "email_change",
]);

export async function POST(request: Request) {
  let body: { token_hash?: unknown; type?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON." }, { status: 400 });
  }

  const token_hash =
    typeof body.token_hash === "string" ? body.token_hash.trim() : "";
  const rawType = typeof body.type === "string" ? body.type.trim() : "recovery";
  const type = OTP_TYPES.has(rawType) ? rawType : "recovery";
  if (!token_hash) {
    return NextResponse.json({ error: "this link expired." }, { status: 400 });
  }

  const route = await createRouteSupabase();
  if (!route) {
    return NextResponse.json({ error: "not yet." }, { status: 503 });
  }

  const { error } = await route.supabase.auth.verifyOtp({
    type: type as "recovery",
    token_hash,
  });
  if (error) {
    return NextResponse.json(
      { error: "this link expired. ask for another from log in." },
      { status: 400 },
    );
  }

  return route.applyCookies(NextResponse.json({ ok: true }));
}
