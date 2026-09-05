import { NextRequest, NextResponse } from "next/server";
import { CLAIM_COOKIE, parseClaimCookie } from "@/lib/claim";
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

  if (supabase && token_hash) {
    await supabase.auth.verifyOtp({
      type: type as "recovery",
      token_hash,
    });
  } else if (code && supabase) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const { data } = supabase
    ? await supabase.auth.getClaims()
    : { data: null };
  const userId =
    typeof data?.claims?.sub === "string" ? data.claims.sub : null;

  if (userId && type !== "recovery") {
    const parsed = parseClaimCookie(request.cookies.get(CLAIM_COOKIE)?.value);
    if (parsed) {
      try {
        const claimed = await claimPage(parsed.pageId, userId, parsed.token);
        if (claimed) {
          const toPage = NextResponse.redirect(
            new URL(`/${claimed.slug}`, requestUrl.origin),
          );
          toPage.cookies.set(CLAIM_COOKIE, "", { path: "/", maxAge: 0 });
          return route ? route.applyCookies(toPage) : toPage;
        }
      } catch {
        // Fall through to next.
      }
    }
  }

  const redirect = NextResponse.redirect(new URL(next, requestUrl.origin));
  return route ? route.applyCookies(redirect) : redirect;
}
