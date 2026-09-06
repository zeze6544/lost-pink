import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { MailSetupDetail } from "@/components/MailSetup";
import { HomeMark, SiteFooter, SiteFrame } from "@/components/SiteFrame";
import { CLAIM_COOKIE, parseClaimCookie } from "@/lib/claim";
import { isMailSetupClient } from "@/lib/mail-setup";
import { getMailboxByOwnerId } from "@/lib/mailbox-store";
import { listOwnedPages } from "@/lib/pages";
import { getAuthUserId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ client: string }> };

export default async function MailSetupClientPage({ params }: Props) {
  const { client: raw } = await params;
  if (!isMailSetupClient(raw)) notFound();

  const userId = await getAuthUserId();
  if (!userId) redirect(`/come?next=/setup/${raw}`);

  const cookieStore = await cookies();
  const parsed = parseClaimCookie(cookieStore.get(CLAIM_COOKIE)?.value);
  if (parsed) redirect("/settings");

  const pages = await listOwnedPages(userId);
  const mailbox = await getMailboxByOwnerId(userId);
  const page = pages.find((p) => p.id === mailbox?.page_id) ?? pages[0] ?? null;

  return (
    <SiteFrame atmosphere="landing">
      <div className="flex min-h-[100dvh] flex-col">
        <HomeMark className="absolute left-5 top-5 z-20 sm:left-8 sm:top-8" />
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-24">
          <MailSetupDetail client={raw} pageId={page?.id ?? null} />
        </div>
        <SiteFooter left="setup" />
      </div>
    </SiteFrame>
  );
}
