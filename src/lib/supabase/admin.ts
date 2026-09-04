import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseUrl } from "../site";

export function supabaseAdminAuth() {
  if (!isSupabaseConfigured()) return null;
  return createClient(
    supabaseUrl()!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
