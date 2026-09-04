import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InboxPanel } from "@/components/InboxPanel";
import { CLAIM_COOKIE, parseClaimCookie } from "@/lib/claim";
import { listMailboxesByPageIds, toOwnerMailboxView } from "@/lib/mailbox-store";
import { claimPage, listOwnedPages } from "@/lib/pages";
import { displayLostEmail } from "@/lib/slug";
import { getAuthUserId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function YouPage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/come?next=/you");
  }

  const cookieStore = await cookies();
  const parsed = parseClaimCookie(cookieStore.get(CLAIM_COOKIE)?.value);
  if (parsed) {
    const claimed = await claimPage(parsed.pageId, userId, parsed.token);
    if (claimed) redirect(`/${claimed.slug}`);
  }

  const pages = await listOwnedPages(userId);
  const mailboxes = await listMailboxesByPageIds(pages.map((page) => page.id));

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[var(--paper)] text-[var(--ink)]">
      <a
        href="/"
        className="mark absolute left-4 top-4 text-sm text-[var(--ink)]/85 sm:left-8 sm:top-8"
      >
        lost.pink
      </a>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-3xl tracking-tight">yours</h1>
          {pages.length === 0 ? (
            <p className="mt-3 text-[13px] text-[var(--ink-muted)]">
              nothing of yours is here.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {pages.map((page) => {
                const mailbox = mailboxes.get(page.id) ?? null;
                return (
                  <li key={page.id}>
                    <a
                      href={`/${page.slug}`}
                      className="font-display text-2xl text-[var(--ink)]/80 transition hover:text-[var(--ink)]"
                    >
                      {page.word}
                    </a>
                    {page.email_local ? (
                      <p className="text-[11px] tracking-[0.12em] text-[var(--ink-faint)]">
                        {displayLostEmail(page.email_local)}
                      </p>
                    ) : null}
                    <div className="mt-1">
                      <InboxPanel
                        pageId={page.id}
                        kept={page.status === "kept"}
                        signedIn
                        alias={page.email_local}
                        publicLabel={page.mailbox_status}
                        mailbox={mailbox ? toOwnerMailboxView(mailbox) : null}
                        compact
                        nextPath={`/${page.slug}`}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <form action="/api/auth/signout" method="post" className="mt-8">
            <button
              type="submit"
              className="text-[12px] text-[var(--ink-faint)]"
            >
              leave
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
