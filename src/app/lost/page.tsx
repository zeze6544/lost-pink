import { HomeLanding } from "@/components/HomeLanding";
import { getAuthUserId } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "lost.pink" },
};

export default async function HomePage() {
  const userId = await getAuthUserId();
  return <HomeLanding signedIn={Boolean(userId)} />;
}
