import { createBrowserClient } from "@supabase/ssr";
import { authCookieOptions, authEnv } from "./env";

export function createBrowserSupabase() {
  const env = authEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.key, {
    cookieOptions: authCookieOptions(),
  });
}
