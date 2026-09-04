import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authEnv } from "./env";

export async function createServerSupabase() {
  const env = authEnv();
  if (!env) return null;
  const cookieStore = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, _headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot set cookies; middleware refreshes the session.
        }
      },
    },
  });
}

export async function getAuthUserId(): Promise<string | null> {
  const user = await getAuthUser();
  return user?.id ?? null;
}

export async function getAuthUser(): Promise<{
  id: string;
  email: string | null;
} | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.id) return null;
  return { id: user.id, email: user.email ?? null };
}
