"use client";

import { useState, useTransition } from "react";
import { MailboxOfferInfo } from "@/components/MailboxOfferInfo";
import { MAILBOX_OFFERS } from "@/lib/mailbox-pricing";
import type { CheckoutKind } from "@/lib/mailbox-status";
import type { MailboxPlan } from "@/lib/mailbox-status";

export function BuyMoreTime({
  pageId,
  plan,
}: {
  pageId: string;
  plan: MailboxPlan | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function buy(kind: Exclude<CheckoutKind, "keep">) {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, kind }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "couldn't open checkout.");
        return;
      }
      window.location.href = data.url;
    });
  }

  return (
    <div className="space-y-2">
      <p className="field-label">buy more time</p>
      <div className="flex flex-col gap-1">
        {MAILBOX_OFFERS.map((offer) => (
          <div key={offer.kind} className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending}
              className="tray-btn min-w-0 flex-1 text-left"
              onClick={() => buy(offer.kind)}
            >
              {pending ? "opening…" : offer.label}
            </button>
            <MailboxOfferInfo
              label={offer.label}
              explanation={offer.explanation}
            />
          </div>
        ))}
      </div>
      {plan === "subscription" ? (
        <p className="text-[11px] text-[var(--ink-faint)]">
          yearly plans renew on their own unless you cancel in the polar portal.
        </p>
      ) : null}
      {error ? (
        <p className="text-[12px] text-[var(--ink-muted)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
