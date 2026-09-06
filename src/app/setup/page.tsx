import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MailSetupChooser } from "@/components/MailSetup";
import { HomeMark, SiteFooter, SiteFrame } from "@/components/SiteFrame";
import { CLAIM_COOKIE, parseClaimCookie } from "@/lib/claim";
import { getAuthUserId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MailSetupPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/come?next=/setup");

  const cookieStore = await cookies();
  const parsed = parseClaimCookie(cookieStore.get(CLAIM_COOKIE)?.value);
  if (parsed) redirect("/settings");

  return (
    <SiteFrame atmosphere="landing">
      <div className="flex min-h-[100dvh] flex-col">
        <HomeMark className="absolute left-5 top-5 z-20 sm:left-8 sm:top-8" />
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 py-24 sm:px-8 lg:px-12">
          <MailSetupChooser />
        </div>
        <SiteFooter left="setup" />
      </div>
    </SiteFrame>
  );
}
