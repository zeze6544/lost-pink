import { NameInboxClient } from "@/components/NameInboxClient";
import { getAuthUserId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NamePage() {
  const userId = await getAuthUserId();
  return <NameInboxClient signedIn={Boolean(userId)} />;
}
