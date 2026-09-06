import type { CookieOptions } from "@supabase/ssr";
import {
  isAuthConfigured,
  supabasePublicUrl,
  supabasePublishableKey,
} from "@/lib/site";

export function authEnv(): { url: string; key: string } | null {
  if (!isAuthConfigured()) return null;
  const url = supabasePublicUrl();
  const key = supabasePublishableKey();
  if (!url || !key) return null;
  return { url, key };
}

/** Keep auth cookies HTTPS-only in production (preview + prod on Vercel). */
export function authCookieOptions(): CookieOptions {
  const secure =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  return {
    path: "/",
    sameSite: "lax",
    secure,
    // Session cookies stay HttpOnly; auth flows go through route handlers + middleware.
    httpOnly: true,
  };
}
