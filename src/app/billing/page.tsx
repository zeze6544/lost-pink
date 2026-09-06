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

          <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            <div>
              <p className="field-label">plan</p>
              <p className="mt-1 font-mono text-[13px] text-[var(--ink)]">
                {planLabel(view.plan)}
              </p>
            </div>
            <div>
              <p className="field-label">paid through</p>
              <p className="mt-1 font-mono text-[13px] text-[var(--ink)]">
                {view.paidThrough
                  ? formatPaidThrough(view.paidThrough).replace(/^paid through /, "")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="field-label">time left</p>
              <p className="mt-1 font-mono text-[13px] text-[var(--ink)]">
                {view.paidThrough ? formatTimeLeft(view.paidThrough) : "—"}
              </p>
            </div>
            <div>
              <p className="field-label">cancel</p>
              <p className="mt-1 font-mono text-[13px] text-[var(--ink)]">
                {view.hasPortal ? (
                  <a
                    href={`/api/mailbox/portal?pageId=${encodeURIComponent(page.id)}`}
                    className="underline underline-offset-2"
                  >
                    cancel
                  </a>
                ) : (
                  "—"
                )}
              </p>
            </div>
          </div>

          <BuyMoreTime pageId={page.id} plan={view.plan} />
        </div>
      )}
    </AccountShell>
  );
}
