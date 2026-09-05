import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/route";

export async function POST(request: Request) {
  const route = await createRouteSupabase();
  if (route) {
    await route.supabase.auth.signOut();
  }
  const redirect = NextResponse.redirect(new URL("/", request.url), {
    status: 303,
  });
  return route ? route.applyCookies(redirect) : redirect;
}
