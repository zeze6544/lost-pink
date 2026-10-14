import { NextResponse } from "next/server";
import { lostBaseFromHeader, withBase } from "@/lib/hosts";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }
  const base = lostBaseFromHeader(request.headers.get("x-lost-base"));
  return NextResponse.redirect(new URL(withBase(base, "/"), request.url), {
    status: 303,
  });
}
