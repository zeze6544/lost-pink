import { BuyMoreTime } from "@/components/BuyMoreTime";
import { AccountShell } from "@/components/SiteFrame";
import {
  getMailboxByOwnerId,
  listMailboxesByPageIds,
  toOwnerMailboxView,
} from "@/lib/mailbox-store";
import { listOwnedPages, pageHandle } from "@/lib/pages";
import { displayLostEmail } from "@/lib/slug";
import { getAuthUserId } from "@/lib/supabase/server";
import {
  formatPaidThrough,
  formatTimeLeft,
  planLabel,
} from "@/lib/voice";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/come?next=/billing");

  const pages = await listOwnedPages(userId);
  const mailboxes = await listMailboxesByPageIds(pages.map((page) => page.id));
  const ownedMailbox = await getMailboxByOwnerId(userId);
  const page =
    pages.find((row) => row.id === ownedMailbox?.page_id) ?? pages[0] ?? null;
  const mailbox = page ? mailboxes.get(page.id) ?? ownedMailbox : ownedMailbox;
  const view = mailbox ? toOwnerMailboxView(mailbox) : null;
  const handle = page ? pageHandle(page) : null;
  const inbox = page
    ? displayLostEmail(page.email_local || page.slug)
    : null;

  return (
    <AccountShell title="subscription" align="left">
      {!page || !view ? (
        <div>
          <p className="font-mono text-[13px] text-[var(--ink-muted)]">
            no paid inbox on this account yet.
          </p>
          <a
            href="/"
            className="mt-4 inline-block font-mono text-[12px] underline underline-offset-2"
          >
            get an inbox
          </a>
        </div>
      ) : (
        <div className="max-w-lg space-y-10">
          <div>
            <p className="font-mono text-[13px] text-[var(--ink)]">{inbox}</p>
            <p className="mt-1 font-mono text-[12px] text-[var(--ink-muted)]">
              lost.pink/{handle}
            </p>
          </div>

          <dl className="space-y-4 font-mono text-[13px]">
            <div className="grid grid-cols-[7.5rem_1fr] gap-x-4 sm:grid-cols-[9rem_1fr]">
              <dt className="text-[var(--ink-muted)]">plan</dt>
              <dd className="text-[var(--ink)]">{planLabel(view.plan)}</dd>
            </div>
            <div className="grid grid-cols-[7.5rem_1fr] gap-x-4 sm:grid-cols-[9rem_1fr]">
              <dt className="text-[var(--ink-muted)]">paid through</dt>
              <dd className="text-[var(--ink)]">
                {view.paidThrough
                  ? formatPaidThrough(view.paidThrough).replace(/^paid through /, "")
                  : "—"}
              </dd>
            </div>
            <div className="grid grid-cols-[7.5rem_1fr] gap-x-4 sm:grid-cols-[9rem_1fr]">
              <dt className="text-[var(--ink-muted)]">time left</dt>
              <dd className="text-[var(--ink)]">
                {view.paidThrough ? formatTimeLeft(view.paidThrough) : "—"}
              </dd>
            </div>
            <div className="grid grid-cols-[7.5rem_1fr] gap-x-4 sm:grid-cols-[9rem_1fr]">
              <dt className="text-[var(--ink-muted)]">cancel</dt>
              <dd className="text-[var(--ink)]">
                {view.hasPortal ? (
                  <a
                    href={`/api/mailbox/portal?pageId=${encodeURIComponent(page.id)}`}
                    className="underline underline-offset-2"
                  >
                    polar customer portal
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>

          <BuyMoreTime pageId={page.id} plan={view.plan} />
        </div>
      )}
    </AccountShell>
  );
}
