import { NextRequest, NextResponse } from "next/server";
import { CLAIM_COOKIE, parseClaimCookie } from "@/lib/claim";
import { claimPage } from "@/lib/pages";
import { lostBaseFromHeader, withBase } from "@/lib/hosts";
import { safeNextPath } from "@/lib/site";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const base = lostBaseFromHeader(request.headers.get("x-lost-base"));
  const next = safeNextPath(requestUrl.searchParams.get("next"), "/you");
  const supabase = await createServerSupabase();

  if (code && supabase) {
    await supabase.auth.exchangeCodeForSession(code);
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
            new URL(withBase(base, `/${claimed.slug}`), requestUrl.origin),
          );
          toShrine.cookies.set(CLAIM_COOKIE, "", { path: "/", maxAge: 0 });
          return toShrine;
        }
      } catch {
        // Fall through to next.
      }
    }
  }

  return NextResponse.redirect(new URL(withBase(base, next), requestUrl.origin));
}
