import { NextRequest, NextResponse } from "next/server";
import {
  CLAIM_COOKIE,
  clearClaimCookies,
  parseClaimCookie,
} from "@/lib/claim";
import { claimPage } from "@/lib/pages";
import { safeNextPath } from "@/lib/site";
import { getAuthUserId } from "@/lib/supabase/server";

/** Claim + clear cookie (RSC cannot mutate cookies), then redirect. */
export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"), "/settings");
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.redirect(
      new URL(`/come?next=${encodeURIComponent(next)}`, request.nextUrl.origin),
    );
  }

  const parsed = parseClaimCookie(request.cookies.get(CLAIM_COOKIE)?.value);
  let destination = next === "/come" ? "/settings" : next;

  if (parsed) {
    try {
      const claimed = await claimPage(parsed.pageId, userId, parsed.token);
      if (claimed) destination = `/${claimed.slug}`;
    } catch {
      // Fall through with next; still clear a stale claim cookie.
    }
  }

  const res = NextResponse.redirect(new URL(destination, request.nextUrl.origin));
  clearClaimCookies(res.cookies);
  return res;
}
