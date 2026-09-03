import { NextResponse } from "next/server";
import { isAuthConfigured, safeNextPath, siteUrl } from "@/lib/site";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ error: "not yet." }, { status: 503 });
  }

  let body: { email?: unknown; next?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "that doesn’t look like an email." }, { status: 400 });
  }

  const next = safeNextPath(body.next, "/you");
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "not yet." }, { status: 503 });
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return NextResponse.json(
      { error: "couldn’t send that. try again in a moment." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
