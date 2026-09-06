import { BuyMoreTime } from "@/components/BuyMoreTime";
import { AccountShell } from "@/components/SiteFrame";
import { countInbox } from "@/lib/mail-imap";
import {
  getMailboxByOwnerId,
  listMailboxesByPageIds,
  toOwnerMailboxView,
} from "@/lib/mailbox-store";
import { listOwnedPages, pageHandle } from "@/lib/pages";
import { publicPagePath } from "@/lib/site";
import { displayLostEmail } from "@/lib/slug";
import { getAuthUserId } from "@/lib/supabase/server";
import {
  formatMemberSince,
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
  const mailCount =
    mailbox?.status === "live" ? await countInbox(mailbox) : null;
  const photoCount = page
    ? Number(Boolean(page.bg_url)) + Number(Boolean(page.token_url))
    : 0;
  const since = mailbox?.created_at ?? page?.created_at ?? null;

  return (
    <AccountShell title="billing">
      {!page || !view ? (
        <div className="quiet-tray px-4 py-4">
          <p className="text-[13px] text-[var(--ink-muted)]">
            no paid inbox on this account yet.
          </p>
          <a href="/" className="tray-btn mt-4 inline-flex items-center">
            get an inbox
          </a>
        </div>
      ) : (
        <div className="quiet-tray space-y-4 px-4 py-4">
          <div>
            <p className="field-label">inbox</p>
            <p className="mark text-[12px]">
              {displayLostEmail(page.email_local || page.slug)}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--ink-faint)]">
              lost.pink/{pageHandle(page)}
            </p>
          </div>
          <div>
            <p className="field-label">plan</p>
            <p className="text-[13px]">{planLabel(view.plan)}</p>
          </div>
          {view.paidThrough ? (
            <div>
              <p className="field-label">time left</p>
              <p className="text-[13px]">
                {formatTimeLeft(view.paidThrough)}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--ink-faint)]">
                {formatPaidThrough(view.paidThrough)}
              </p>
            </div>
          ) : null}
          {since ? (
            <div>
              <p className="field-label">member since</p>
              <p className="text-[13px]">{formatMemberSince(since)}</p>
            </div>
          ) : null}
          <div>
            <p className="field-label">mail in inbox</p>
            <p className="text-[13px]">
              {mailCount === null
                ? mailbox?.status === "live"
                  ? "couldn't count mail right now"
                  : "inbox isn’t live, so there’s no count"
                : `${mailCount} ${mailCount === 1 ? "message" : "messages"}`}
            </p>
          </div>
          <div>
            <p className="field-label">photos on the page</p>
            <p className="text-[13px]">
              {photoCount === 0
                ? "none"
                : `${photoCount} ${photoCount === 1 ? "photo" : "photos"}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {view.hasPortal ? (
              <a
                href={`/api/mailbox/portal?pageId=${encodeURIComponent(page.id)}`}
                className="tray-btn inline-flex items-center"
              >
                polar customer portal
              </a>
            ) : null}
            <a
              href={publicPagePath(pageHandle(page))}
              className="tray-btn inline-flex items-center"
            >
              view live page
            </a>
            <a href="/receipts" className="tray-btn inline-flex items-center">
              receipts
            </a>
            <a href="/settings" className="tray-btn inline-flex items-center">
              settings
            </a>
          </div>
          {view.plan !== "subscription" ? (
            <BuyMoreTime pageId={page.id} plan={view.plan} />
          ) : view.hasPortal ? (
            <p className="text-[12px] text-[var(--ink-faint)]">
              cancel or change the renewing year in the polar portal.
            </p>
          ) : null}
        </div>
      )}
    </AccountShell>
  );
}
