import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GmailSetup } from "@/components/GmailSetup";
import { AccountShell } from "@/components/SiteFrame";
import { CLAIM_COOKIE, parseClaimCookie } from "@/lib/claim";
import { getMailboxByOwnerId } from "@/lib/mailbox-store";
import { listOwnedPages } from "@/lib/pages";
import { getAuthUserId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GmailSetupPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/come?next=/setup/gmail");

  const cookieStore = await cookies();
  const parsed = parseClaimCookie(cookieStore.get(CLAIM_COOKIE)?.value);
  if (parsed) {
    redirect("/settings");
  }

  const pages = await listOwnedPages(userId);
  const mailbox = await getMailboxByOwnerId(userId);
  const page = pages.find((p) => p.id === mailbox?.page_id) ?? pages[0] ?? null;

  return (
    <AccountShell title="connect a mail app">
      <div className="quiet-tray px-5 py-5">
        <GmailSetup pageId={page?.id ?? null} />
      </div>
    </AccountShell>
  );
}
