import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InboxPanel } from "@/components/InboxPanel";
import { AccountShell } from "@/components/SiteFrame";
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
    <AccountShell title="yours">
      {pages.length === 0 ? (
        <div className="quiet-tray px-4 py-4">
          <p className="text-[13px] text-[var(--ink-muted)]">
            nothing of yours is here.
          </p>
          <a href="/" className="tray-btn mt-4 inline-flex items-center">
            get an inbox
          </a>
        </div>
      ) : (
        pages.map((page) => {
          const mailbox = mailboxes.get(page.id) ?? null;
          return (
            <div key={page.id} className="quiet-tray space-y-3 px-4 py-4">
              <a
                href={`/${page.slug}`}
                className="font-display text-2xl text-[var(--ink)]/80 transition hover:text-[var(--ink)]"
              >
                {page.word}
              </a>
              {page.email_local ? (
                <p className="mark text-[11px] tracking-[0.12em] text-[var(--ink-faint)]">
                  {displayLostEmail(page.email_local)}
                </p>
              ) : null}
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
          );
        })
      )}
      <form action="/api/auth/signout" method="post">
        <button type="submit" className="tray-btn w-full">
          log out
        </button>
      </form>
    </AccountShell>
  );
}
