import { NextRequest, NextResponse } from "next/server";
import {
  CLAIM_COOKIE,
  clearClaimCookies,
  parseClaimCookie,
} from "@/lib/claim";
import { claimPage } from "@/lib/pages";
import { SITE_RESET_PATH } from "@/lib/mailbox-settings";
import { safeNextPath } from "@/lib/site";
import { createRouteSupabase } from "@/lib/supabase/route";

const OTP_TYPES = new Set([
  "recovery",
  "email",
  "magiclink",
  "signup",
  "invite",
  "email_change",
]);

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const rawType = requestUrl.searchParams.get("type") ?? "";
  const type = OTP_TYPES.has(rawType) ? rawType : token_hash ? "recovery" : "";
  const next = safeNextPath(
    type === "recovery" ? SITE_RESET_PATH : requestUrl.searchParams.get("next"),
    type === "recovery" ? SITE_RESET_PATH : "/settings",
  );
  const route = await createRouteSupabase();
  const supabase = route?.supabase ?? null;

  let authError: string | null = null;
  if (supabase && token_hash) {
    const verified = await supabase.auth.verifyOtp({
      type: type as "recovery",
      token_hash,
    });
    if (verified.error) authError = verified.error.message;
  } else if (code && supabase) {
    const exchanged = await supabase.auth.exchangeCodeForSession(code);
    if (exchanged.error) authError = exchanged.error.message;
  } else if (token_hash || code) {
    authError = "auth is not configured.";
  }

  const { data } = supabase
    ? await supabase.auth.getClaims()
    : { data: null };
  const userId =
    typeof data?.claims?.sub === "string" ? data.claims.sub : null;

  if (authError && !userId) {
    const failPath =
      type === "recovery"
        ? `${SITE_RESET_PATH}?error=expired`
        : `/come?error=link&next=${encodeURIComponent(next)}`;
    const fail = NextResponse.redirect(new URL(failPath, requestUrl.origin));
    return route ? route.applyCookies(fail) : fail;
  }

  if (userId && type !== "recovery") {
    const parsed = parseClaimCookie(request.cookies.get(CLAIM_COOKIE)?.value);
    if (parsed) {
      try {
        const claimed = await claimPage(parsed.pageId, userId, parsed.token);
        if (claimed) {
          const toPage = NextResponse.redirect(
            new URL(`/${claimed.slug}`, requestUrl.origin),
          );
          clearClaimCookies(toPage.cookies);
          return route ? route.applyCookies(toPage) : toPage;
        }
      } catch {
        // Fall through to next; still drop a stale claim cookie below.
      }
      const redirect = NextResponse.redirect(new URL(next, requestUrl.origin));
      clearClaimCookies(redirect.cookies);
      return route ? route.applyCookies(redirect) : redirect;
    }
  }

  const redirect = NextResponse.redirect(new URL(next, requestUrl.origin));
  return route ? route.applyCookies(redirect) : redirect;
}
