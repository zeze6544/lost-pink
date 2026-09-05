import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/SettingsClient";
import { AccountShell } from "@/components/SiteFrame";
import { listMailboxesByPageIds, toOwnerMailboxView } from "@/lib/mailbox-store";
import { listOwnedPages, pageHandle } from "@/lib/pages";
import { publicPagePath } from "@/lib/site";
import { displayLostEmail } from "@/lib/slug";
import { getAuthUserId } from "@/lib/supabase/server";
import { formatPaidDate } from "@/lib/voice";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/come?next=/settings");

  const pages = await listOwnedPages(userId);
  const mailboxes = await listMailboxesByPageIds(pages.map((page) => page.id));

  return (
    <AccountShell title="settings">
      {pages.length === 0 ? (
        <div className="quiet-tray px-4 py-4">
          <p className="text-[13px] text-[var(--ink-muted)]">
            nothing here yet.
          </p>
          <a href="/" className="tray-btn mt-4 inline-flex items-center">
            get an inbox
          </a>
        </div>
      ) : (
        pages.map((page) => {
          const mailbox = mailboxes.get(page.id) ?? null;
          const view = mailbox ? toOwnerMailboxView(mailbox) : null;
          const handle = pageHandle(page);
          const inbox = page.email_local
            ? displayLostEmail(page.email_local)
            : null;
          const inboxLocked = Boolean(
            view &&
              (view.status === "live" ||
                view.status === "provisioning" ||
                view.status === "failed" ||
                view.status === "dark"),
          );
          return (
            <div key={page.id} className="quiet-tray space-y-4 px-4 py-4">
              <div>
                <p className="field-label">title</p>
                <p className="font-display text-xl text-[var(--ink)]">
                  {page.word}
                </p>
              </div>
              <div>
                <p className="field-label">page url</p>
                <p className="mark text-[12px] text-[var(--ink-muted)]">
                  lost.pink/{handle}
                </p>
              </div>
              <div>
                <label htmlFor={`inbox-${page.id}`} className="field-label">
                  inbox
                </label>
                <input
                  id={`inbox-${page.id}`}
                  readOnly
                  value={
                    inbox
                      ? inboxLocked
                        ? `${inbox} · locked while this inbox is active.`
                        : inbox
                      : "no inbox yet"
                  }
                  className="quiet-field mt-0.5 w-full border-0 bg-transparent text-[12px] text-[var(--ink)]/80 outline-none"
                />
              </div>
              {view?.paidThrough ? (
                <div>
                  <p className="field-label">paid through</p>
                <p className="text-[13px] text-[var(--ink-muted)]">
                  {formatPaidDate(view.paidThrough)}
                  </p>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <a href={`/${handle}`} className="tray-btn inline-flex items-center">
                  view inbox
                </a>
                <a
                  href={publicPagePath(handle)}
                  className="tray-btn inline-flex items-center"
                >
                  view live page
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href="/subscription" className="tray-btn inline-flex items-center">
                  subscription
                </a>
                <a href="/receipts" className="tray-btn inline-flex items-center">
                  receipts
                </a>
                <a href="/support" className="tray-btn inline-flex items-center">
                  support
                </a>
              </div>
              <SettingsClient
                inbox={inbox}
                mailboxId={mailbox?.id ?? null}
                recoveryEmail={view?.recoveryEmail ?? null}
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
