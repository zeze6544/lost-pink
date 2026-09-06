import { redirect } from "next/navigation";
import { MailSetupChooser } from "@/components/MailSetup";
import { HomeMark, SiteFooter, SiteFrame } from "@/components/SiteFrame";
import { getAuthUserId } from "@/lib/supabase/server";

export const metadata = {
  title: "mail setup",
  robots: { index: false, follow: false },
};


export const dynamic = "force-dynamic";

export default async function MailSetupPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/come?next=/setup");

  return (
    <SiteFrame atmosphere="landing">
      <div className="flex min-h-[100dvh] flex-col">
        <HomeMark className="absolute left-5 top-5 z-20 sm:left-8 sm:top-8" />
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-24">
          <MailSetupChooser />
        </div>
        <SiteFooter left="setup" />
      </div>
    </SiteFrame>
  );
}
