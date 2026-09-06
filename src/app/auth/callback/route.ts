import { NextRequest, NextResponse } from "next/server";
import { CLAIM_COOKIE, parseClaimCookie } from "@/lib/claim";
import { claimPage } from "@/lib/pages";
import { safeNextPath } from "@/lib/site";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"), "/you");
  const supabase = await createServerSupabase();

  let authError: string | null = null;
  const oauthError = requestUrl.searchParams.get("error");
  if (oauthError) {
    authError = oauthError;
  } else if (code && supabase) {
    const exchanged = await supabase.auth.exchangeCodeForSession(code);
    if (exchanged.error) authError = exchanged.error.message;
  } else if (code && !supabase) {
    authError = "auth is not configured.";
  }

  if (authError) {
    const fail = new URL("/come", requestUrl.origin);
    fail.searchParams.set("error", "link");
    fail.searchParams.set("next", next);
    return NextResponse.redirect(fail);
  }

  const { data } = supabase
    ? await supabase.auth.getClaims()
    : { data: null };
  const userId =
    typeof data?.claims?.sub === "string" ? data.claims.sub : null;

  if (userId) {
    const parsed = parseClaimCookie(request.cookies.get(CLAIM_COOKIE)?.value);
    if (parsed) {
      try {
        const claimed = await claimPage(parsed.pageId, userId, parsed.token);
        if (claimed) {
          const toShrine = NextResponse.redirect(
            new URL(`/${claimed.slug}`, requestUrl.origin),
          );
          toShrine.cookies.set(CLAIM_COOKIE, "", { path: "/", maxAge: 0 });
          return toShrine;
        }
      } catch {
        // Fall through to next.
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
