import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InboxPanel } from "@/components/InboxPanel";
import { SiteFrame } from "@/components/SiteFrame";
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
    <SiteFrame>
      <div className="relative flex min-h-[100dvh] flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <a
          href="/"
          className="mark relative z-20 shrink-0 self-start text-[15px] text-[var(--ink)]/90 sm:text-base"
        >
          lost.pink
        </a>
        <div className="flex flex-1 flex-col items-center justify-center py-10 sm:py-14">
          <div className="w-full max-w-sm text-center">
            <h1 className="font-display text-3xl tracking-tight sm:text-[2rem]">
              yours
            </h1>
            {pages.length === 0 ? (
              <p className="mt-3 text-[13px] text-[var(--ink-muted)]">
                nothing of yours is here.
              </p>
            ) : (
              <ul className="mt-6 space-y-5">
                {pages.map((page) => {
                  const mailbox = mailboxes.get(page.id) ?? null;
                  return (
                    <li
                      key={page.id}
                      className="quiet-tray px-4 py-4 text-left sm:px-5"
                    >
                      <a
                        href={`/${page.slug}`}
                        className="font-display text-2xl text-[var(--ink)]/90 transition hover:text-[var(--ink)]"
                      >
                        {page.word}
                      </a>
                      {page.email_local ? (
                        <p className="mt-1 text-[11px] tracking-[0.12em] text-[var(--ink)]/55">
                          {displayLostEmail(page.email_local)}
                        </p>
                      ) : null}
                      <div className="mt-3">
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
            <form action="/api/auth/signout" method="post" className="mt-10">
              <button
                type="submit"
                className="min-h-11 text-[13px] text-[var(--ink)]/55"
              >
                leave
              </button>
            </form>
          </div>
        </div>
      </div>
    </SiteFrame>
  );
}
