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
