"use client";

import { useState, useTransition } from "react";
import { HOME_MAILBOX_OFFERS } from "@/lib/mailbox-pricing";
import type { CheckoutKind } from "@/lib/mailbox-status";
import type { MailboxPlan } from "@/lib/mailbox-status";

function offerPhrase(plan: MailboxPlan): string {
  if (plan === "day") return "$1 day";
  if (plan === "month") return "$5 month";
  return "$20 year";
}

export function BuyMoreTime({
  pageId,
  plan: _plan,
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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <span className="border border-[color-mix(in_srgb,var(--ink)_45%,transparent)] px-5 py-2.5 font-mono text-[13px] tracking-[0.02em] text-[var(--ink)]">
          buy more time
        </span>
        <p className="font-mono text-[12px] text-[var(--ink-muted)]">
          {HOME_MAILBOX_OFFERS.map((offer, i) => (
            <span key={offer.kind}>
              {i > 0 ? " · " : null}
              <button
                type="button"
                disabled={pending}
                onClick={() => buy(offer.kind)}
                className="cursor-pointer text-[var(--ink)] underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {offerPhrase(offer.plan)}
              </button>
            </span>
          ))}
        </p>
      </div>
      {error ? (
        <p className="font-mono text-[12px] text-[var(--ink-muted)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
