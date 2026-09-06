import { AccountShell } from "@/components/SiteFrame";
import {
  listMailboxPayments,
  listMailboxesByPageIds,
  toOwnerMailboxView,
} from "@/lib/mailbox-store";
import { listOwnedPages } from "@/lib/pages";
import {
  listMailboxReceipts,
  polarCustomerBelongsToMailbox,
  type PolarReceipt,
} from "@/lib/polar-receipts";
import { getAuthUserId } from "@/lib/supabase/server";
import { formatPaidThrough } from "@/lib/voice";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function paymentKindLabel(kind: string): string {
  if (kind === "purchase") return "purchase";
  if (kind === "renewal") return "renewal";
  if (kind === "refund") return "refund";
  if (kind === "cancel") return "cancel";
  if (kind === "revoke") return "revoke";
  if (kind === "failed_renewal") return "failed renewal";
  return kind.replace(/_/g, " ");
}

export default async function ReceiptsPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/come?next=/receipts");

  const pages = await listOwnedPages(userId);
  const mailboxes = await listMailboxesByPageIds(pages.map((page) => page.id));
  const rows = [];
  for (const page of pages) {
    const mailbox = mailboxes.get(page.id);
    if (!mailbox) continue;
    const view = toOwnerMailboxView(mailbox);
    let polar: PolarReceipt[] = [];
    let portalSafe = false;
    if (mailbox.polar_customer_id) {
      try {
        portalSafe = await polarCustomerBelongsToMailbox(
          mailbox.polar_customer_id,
          mailbox.id,
        );
        polar = await listMailboxReceipts(
          mailbox.id,
          mailbox.polar_customer_id,
        );
      } catch {
        polar = [];
      }
    }
    const stored = await listMailboxPayments(mailbox.id);
    rows.push({ page, view, polar, stored, portalSafe });
  }

  return (
    <AccountShell title="receipts">
      {rows.length === 0 ? (
        <div className="quiet-tray px-4 py-4">
          <p className="text-[13px] text-[var(--ink-muted)]">
            no receipts yet.
          </p>
          <a href="/billing" className="tray-btn mt-4 inline-flex items-center">
            billing
          </a>
        </div>
      ) : (
        rows.map(({ page, view, polar, stored, portalSafe }) => (
          <div key={page.id} className="quiet-tray space-y-4 px-4 py-4">
            <div>
              <p className="field-label">inbox</p>
              <p className="mark text-[12px]">{view.address}</p>
              {view.paidThrough ? (
                <p className="mt-0.5 text-[11px] text-[var(--ink-faint)]">
                  {formatPaidThrough(view.paidThrough)}
                </p>
              ) : null}
            </div>
            {view.hasPortal && portalSafe ? (
              <a
                href={`/api/mailbox/portal?pageId=${encodeURIComponent(page.id)}`}
                className="tray-btn inline-flex items-center"
              >
                open polar customer portal
              </a>
            ) : (
              <p className="text-[12px] text-[var(--ink-faint)]">
                polar portal isn’t available for this inbox yet.
              </p>
            )}
            {polar.length > 0 ? (
              <ul className="space-y-2">
                {polar.map((item) => (
                  <li
                    key={item.id}
                    className="border-t border-[var(--rule)] pt-2 first:border-0 first:pt-0"
                  >
                    <p className="text-[13px] text-[var(--ink)]">
                      {item.label}
                      <span className="text-[var(--ink-muted)]">
                        {" "}
                        · {item.amount}
                      </span>
                    </p>
                    <p className="mark text-[10px] text-[var(--ink-faint)]">
                      {formatWhen(item.when)}
                      {item.invoiceNumber ? ` · ${item.invoiceNumber}` : ""}
                    </p>
                    {item.receiptUrl ? (
                      <a
                        href={item.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-[12px] underline-offset-2 hover:underline"
                      >
                        download receipt
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : stored.length > 0 ? (
              <ul className="space-y-2">
                {stored.map((item) => (
                  <li
                    key={item.id}
                    className="border-t border-[var(--rule)] pt-2 first:border-0 first:pt-0"
                  >
                    <p className="text-[13px]">{paymentKindLabel(item.kind)}</p>
                    <p className="mark text-[10px] text-[var(--ink-faint)]">
                      {formatWhen(item.processed_at)}
                      {item.polar_order_id
                        ? ` · ${item.polar_order_id.slice(0, 8)}`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-[var(--ink-muted)]">
                no polar receipts listed yet. the portal still has invoices if
                you paid.
              </p>
            )}
            <a href="/billing" className="tray-btn inline-flex items-center">
              billing
            </a>
          </div>
        ))
      )}
    </AccountShell>
  );
}
