import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authEnv } from "./env";

type PendingCookie = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export async function createRouteSupabase() {
  const env = authEnv();
  if (!env) return null;
  const cookieStore = await cookies();
  const pending: PendingCookie[] = [];
  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pending.push({ name, value, options });
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Route handlers still attach these via applyCookies.
          }
        });
      },
    },
  });
  return {
    supabase,
    applyCookies<T>(res: NextResponse<T>) {
      for (const { name, value, options } of pending) {
        res.cookies.set(name, value, options);
      }
      res.headers.set("Cache-Control", "private, no-store");
      return res;
    },
  };
}
