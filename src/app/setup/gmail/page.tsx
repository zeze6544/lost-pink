import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GmailSetup } from "@/components/GmailSetup";
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
    redirect("/you");
  }

  const pages = await listOwnedPages(userId);
  const mailbox = await getMailboxByOwnerId(userId);
  const page = pages.find((p) => p.id === mailbox?.page_id) ?? pages[0] ?? null;

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[var(--paper)] text-[var(--ink)]">
      <a
        href={page ? `/${page.slug}` : "/you"}
        className="mark absolute left-4 top-4 text-sm text-[var(--ink)]/85 sm:left-8 sm:top-8"
      >
        lost.pink
      </a>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <div className="quiet-tray w-full max-w-md px-5 py-5">
          <h1 className="font-display text-3xl tracking-tight">put it in gmail</h1>
          <GmailSetup pageId={page?.id ?? null} />
        </div>
      </div>
    </main>
  );
}
