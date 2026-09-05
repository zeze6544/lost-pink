"use client";

import { useState, useTransition } from "react";
import { MailboxOfferInfo } from "@/components/MailboxOfferInfo";
import { mailboxCheckoutKind, MAILBOX_OFFERS } from "@/lib/mailbox-pricing";
import type { CheckoutKind, PublicMailboxLabel } from "@/lib/mailbox-status";
import type { OwnerMailboxView } from "@/lib/mailbox-view";
import {
  formatPaidDate,
  inboxArriving,
  inboxDarkCopy,
  inboxDisplayOnly,
  inboxFailedCopy,
  inboxNeedAlias,
  inboxNeedComeBack,
  inboxNeedKeep,
  inboxTerminationNotice,
} from "@/lib/voice";

type Props = {
  pageId: string;
  kept: boolean;
  signedIn: boolean;
  alias: string | null;
  publicLabel: PublicMailboxLabel;
  mailbox: OwnerMailboxView | null;
  compact?: boolean;
  inviteComeBack?: boolean;
  nextPath?: string;
  beforeCheckout?: () => Promise<boolean>;
  onNeedAlias?: () => void;
  writePath?: string | null;
};

export function InboxPanel({
  pageId,
  kept,
  signedIn,
  alias,
  publicLabel,
  mailbox,
  compact = false,
  inviteComeBack = false,
  nextPath = "/settings",
  beforeCheckout,
  onNeedAlias,
  writePath = null,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<void>) {
    setError(null);
    setNote(null);
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        setError(err instanceof Error ? err.message : "couldn't do that.");
      }
    });
  }

  async function startCheckout(kind: Exclude<CheckoutKind, "keep">) {
    if (beforeCheckout) {
      const ok = await beforeCheckout();
      if (!ok) return;
    }
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, kind }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      setError(data.error ?? "couldn't open the inbox.");
      return;
    }
    window.location.href = data.url;
  }

  async function clearCheckout() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, kind: "mailbox_once", action: "clear" }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "couldn't clear that.");
      return;
    }
    window.location.reload();
  }

  async function retryProvision() {
    const res = await fetch("/api/mailbox/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "couldn't try again.");
      return;
    }
    window.location.reload();
  }

  const openNote = writePath ? (
    <a href={writePath} className="underline-offset-2 hover:underline">
      write
    </a>
  ) : null;
  const displayNote =
    publicLabel === "display" || alias ? inboxDisplayOnly() : null;

  if (!signedIn && !inviteComeBack) {
    return null;
  }

  if (!kept) {
    return (
      <p className="text-[12px] text-[var(--ink-muted)]">
        {inboxNeedKeep()}
        {publicLabel === "open" ? (
          <span className="ml-1 opacity-70">· {openNote}</span>
        ) : displayNote ? (
          <span className="ml-1 opacity-70">· {displayNote}</span>
        ) : null}
      </p>
    );
  }

  if (!signedIn) {
    if (inviteComeBack) {
      return (
        <div className="flex flex-col gap-1 text-[12px] text-[var(--ink)]">
          <a href={`/come?next=${encodeURIComponent(nextPath)}`}>
            {inboxNeedComeBack(
              publicLabel === "open" || mailbox?.status === "live",
            )}
          </a>
        </div>
      );
    }
    if (publicLabel === "open") {
      return <p className="text-[12px] text-[var(--ink)]">{openNote}</p>;
    }
    return displayNote ? (
      <p className="text-[12px] text-[var(--ink-faint)]">{displayNote}</p>
    ) : null;
  }

  if (!alias) {
    return (
      <p className="text-[12px] text-[var(--ink)]">
        <button type="button" onClick={onNeedAlias} className="cursor-pointer">
          {inboxNeedAlias()}
        </button>
      </p>
    );
  }

  if (mailbox?.status === "checkout_started") {
    return (
      <div className="space-y-1 text-[12px] text-[var(--ink)]">
        <p className="text-[var(--ink-faint)]">
          {mailbox.checkoutAbandoned
            ? "that checkout went quiet. resume or let the alias go."
            : "checkout is waiting."}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <button
            type="button"
            disabled={pending}
            className="cursor-pointer"
            onClick={() =>
              run(() =>
                startCheckout(
                  mailbox.plan
                    ? mailboxCheckoutKind(mailbox.plan)
                    : "mailbox_once",
                ),
              )
            }
          >
            resume
          </button>
          <button
            type="button"
            disabled={pending}
            className="cursor-pointer"
            onClick={() => run(clearCheckout)}
          >
            clear
          </button>
        </div>
        <Status error={error} note={note} />
      </div>
    );
  }

  if (mailbox?.status === "provisioning") {
    return (
      <div className="space-y-1 text-[12px] text-[var(--ink-faint)]">
        <p>{inboxArriving()}</p>
        <Progress mailbox={mailbox} />
        <Status error={error} note={note} />
      </div>
    );
  }

  if (mailbox?.status === "failed") {
    return (
      <div className="space-y-1 text-[12px] text-[var(--ink)]">
        <p className="text-[var(--ink-faint)]">{inboxFailedCopy()}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <button
            type="button"
            disabled={pending}
            className="cursor-pointer"
            onClick={() => run(retryProvision)}
          >
            try again
          </button>
          <a href="/support">support</a>
        </div>
        <Status error={error} note={note} />
      </div>
    );
  }

  if (mailbox?.status === "live") {
    return (
      <div className="space-y-2 text-[12px] text-[var(--ink)]">
        {!compact ? (
          <div>
            <p className="field-label">inbox</p>
            <p className="mark text-[12px] text-[var(--ink)]">{mailbox.address}</p>
          <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
            {openNote}
          </p>
          </div>
        ) : (
          <p className="text-[11px] text-[var(--ink-muted)]">{openNote}</p>
        )}
        {!compact ? (
          <>
            {mailbox.recoveryEmail ? (
              <div>
                <p className="field-label">recovery</p>
                <p className="text-[var(--ink-faint)]">{mailbox.recoveryEmail}</p>
              </div>
            ) : null}
            {mailbox.paidThrough ? (
              <div>
                <p className="field-label">paid through</p>
                <p className="text-[var(--ink-faint)]">
                  {formatPaidDate(mailbox.paidThrough)}
                  {mailbox.plan === "subscription"
                    ? " · yearly"
                    : mailbox.plan === "month"
                      ? " · a month"
                      : mailbox.plan === "day"
                        ? " · a day"
                        : " · a year"}
                </p>
              </div>
            ) : null}
          </>
        ) : mailbox.paidThrough ? (
          <p className="text-[11px] text-[var(--ink-faint)]">
            {formatPaidDate(mailbox.paidThrough)}
            {mailbox.plan === "subscription"
              ? " · yearly"
              : mailbox.plan === "month"
                ? " · a month"
                : mailbox.plan === "day"
                  ? " · a day"
                  : " · a year"}
          </p>
        ) : null}
        <div>
          <p className="field-label">actions</p>
          <div className="tray-actions">
            {mailbox.plan === "subscription" ? (
              <span className="block py-2 text-[var(--ink-faint)]">
                renews on its own
              </span>
            ) : (
              <button
                type="button"
                disabled={pending}
                className="cursor-pointer"
                onClick={() =>
                  run(() =>
                    startCheckout(
                      mailbox.plan
                        ? mailboxCheckoutKind(mailbox.plan)
                        : "mailbox_once",
                    ),
                  )
                }
              >
                buy more time
              </button>
            )}
            <a href="/settings">settings</a>
            <a href="/support">support</a>
          </div>
        </div>
        <Status error={error} note={note} />
      </div>
    );
  }

  if (mailbox?.status === "dark") {
    return (
      <BuyChoices
        compact={compact}
        pending={pending}
        error={error}
        note={note}
        lead={inboxDarkCopy()}
        onBuy={(kind) => run(() => startCheckout(kind))}
      />
    );
  }

  return (
    <BuyChoices
      compact={compact}
      pending={pending}
      error={error}
      note={note}
      lead={displayNote}
      onBuy={(kind) => run(() => startCheckout(kind))}
    />
  );
}

function BuyChoices({
  compact,
  pending,
  error,
  note,
  lead,
  onBuy,
}: {
  compact: boolean;
  pending: boolean;
  error: string | null;
  note: string | null;
  lead?: string | null;
  onBuy: (kind: Exclude<CheckoutKind, "keep">) => void;
}) {
  return (
    <div className="space-y-1 text-[12px] text-[var(--ink)]">
      {lead ? <p className="text-[var(--ink-faint)]">{lead}</p> : null}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {MAILBOX_OFFERS.map((offer) => (
          <span key={offer.kind} className="flex items-center gap-1">
            <button
              type="button"
              disabled={pending}
              className="cursor-pointer"
              onClick={() => onBuy(offer.kind)}
            >
              {pending ? "opening…" : offer.label}
            </button>
            <MailboxOfferInfo
              label={offer.label}
              explanation={offer.explanation}
            />
          </span>
        ))}
      </div>
      {!compact ? (
        <p className="text-[11px] text-[var(--ink-faint)]">
          {inboxTerminationNotice()}
        </p>
      ) : null}
      <Status error={error} note={note} />
    </div>
  );
}

function Progress({ mailbox }: { mailbox: OwnerMailboxView }) {
  const step = mailbox.provisionStep;
  const creating = step === "creating_inbox" || step === "invitation_sent";
  const invited = step === "invitation_sent";
  return (
    <p>
      payment received{creating ? " → creating inbox" : ""}
      {invited ? " → invitation sent" : ""}
    </p>
  );
}

function Status({ error, note }: { error: string | null; note: string | null }) {
  if (error) {
    return (
      <p className="text-[var(--ink-muted)]" role="alert">
        {error}
      </p>
    );
  }
  if (note) return <p className="text-[var(--ink-faint)]">{note}</p>;
  return null;
}
