import { HomeLanding } from "@/components/HomeLanding";
import { getAuthUserId } from "@/lib/supabase/server";

export default async function HomePage() {
  const userId = await getAuthUserId();
  return <HomeLanding signedIn={Boolean(userId)} />;
}
