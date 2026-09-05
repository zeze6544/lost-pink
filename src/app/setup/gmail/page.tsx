import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GmailSetup } from "@/components/GmailSetup";
import { HomeMark, SiteFooter, SiteFrame } from "@/components/SiteFrame";
import { CLAIM_COOKIE, parseClaimCookie } from "@/lib/claim";
import { getMailboxByOwnerId } from "@/lib/mailbox-store";
import { listOwnedPages } from "@/lib/pages";
import { getAuthUserId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GmailSetupPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/come?next=/setup/gmail");

  const pages = await listOwnedPages(userId);
  const mailbox = await getMailboxByOwnerId(userId);
  const page = pages.find((p) => p.id === mailbox?.page_id) ?? pages[0] ?? null;

  // Stale claim cookies used to block setup forever. Only divert when there is
  // something left to claim and no live mailbox credentials yet.
  const cookieStore = await cookies();
  const parsed = parseClaimCookie(cookieStore.get(CLAIM_COOKIE)?.value);
  if (parsed && !mailbox) redirect("/settings");

  return (
    <SiteFrame atmosphere="landing">
      <div className="flex min-h-[100dvh] flex-col">
        <HomeMark className="absolute left-5 top-5 z-20 sm:left-8 sm:top-8" />
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-24">
          <GmailSetup pageId={page?.id ?? null} />
        </div>
        <SiteFooter left="setup" />
      </div>
    </SiteFrame>
  );
}
