"use client";

import { useState, useTransition } from "react";
import type { OwnerMailboxView } from "@/lib/mailbox-view";
import type { PublicMailboxLabel } from "@/lib/mailbox-status";
import {
  formatPaidThrough,
  inboxArriving,
  inboxDarkCopy,
  inboxDisplayOnly,
  inboxFailedCopy,
  inboxNeedAlias,
  inboxNeedComeBack,
  inboxNeedKeep,
  inboxOnceLabel,
  inboxOpenLabel,
  inboxTerminationNotice,
  inboxYearlyLabel,
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
  nextPath = "/you",
  beforeCheckout,
  onNeedAlias,
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

  async function startCheckout(kind: "mailbox_once" | "mailbox_subscription") {
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

  async function setupHelp() {
    const res = await fetch("/api/mailbox/setup-help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "couldn't send help.");
      return;
    }
    setNote("setup help is on its way.");
  }

  const aliasNote =
    publicLabel === "open"
      ? inboxOpenLabel()
      : publicLabel === "display" || alias
        ? inboxDisplayOnly()
        : null;

  if (!signedIn && !inviteComeBack) {
    return aliasNote ? (
      <p className="text-[12px] text-[var(--ink-faint)]">{aliasNote}</p>
    ) : null;
  }

  if (!kept) {
    return (
      <p className="text-[12px] text-[var(--ink-muted)]">
        {inboxNeedKeep()}
        {aliasNote ? <span className="ml-1 opacity-70">· {aliasNote}</span> : null}
      </p>
    );
  }

  if (!signedIn) {
    if (inviteComeBack) {
      return (
        <p className="text-[12px] text-[var(--ink)]">
          <a href={`/come?next=${encodeURIComponent(nextPath)}`}>
            {inboxNeedComeBack(
              publicLabel === "open" || mailbox?.status === "live",
            )}
          </a>
          {aliasNote ? (
            <span className="ml-1 text-[var(--ink-faint)]">· {aliasNote}</span>
          ) : null}
        </p>
      );
    }
    return aliasNote ? (
      <p className="text-[12px] text-[var(--ink-faint)]">{aliasNote}</p>
    ) : null;
  }

  if (!alias) {
    return (
      <p className="text-[12px] text-[var(--ink)]">
        <button type="button" onClick={onNeedAlias}>
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
            onClick={() =>
              run(() =>
                startCheckout(
                  mailbox.plan === "subscription"
                    ? "mailbox_subscription"
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
      <div className="space-y-1 text-[12px] text-[var(--ink)]">
        <p>
          {mailbox.address}
          <span className="ml-1 text-[var(--ink-faint)]">{inboxOpenLabel()}</span>
        </p>
        {!compact ? (
          <>
            {mailbox.recoveryEmail ? (
              <p className="text-[var(--ink-faint)]">
                recovery · {mailbox.recoveryEmail}
              </p>
            ) : null}
            {mailbox.paidThrough ? (
              <p className="text-[var(--ink-faint)]">
                {formatPaidThrough(mailbox.paidThrough)}
                {mailbox.plan === "subscription" ? " · yearly" : " · one year"}
              </p>
            ) : null}
            <p className="text-[var(--ink-faint)]">
              IMAP {mailbox.imap.host}:{mailbox.imap.port} · SMTP{" "}
              {mailbox.smtp.host}:{mailbox.smtp.port}
            </p>
          </>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <a
            href={mailbox.webmailUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center sm:min-h-0"
          >
            webmail
          </a>
          {mailbox.hasPortal ? (
            <a
              href={`/api/mailbox/portal?pageId=${encodeURIComponent(pageId)}`}
              className="inline-flex min-h-11 items-center sm:min-h-0"
            >
              receipts
            </a>
          ) : null}
          {mailbox.plan === "once" ? (
            <button
              type="button"
              disabled={pending}
              className="min-h-11 sm:min-h-0"
              onClick={() => run(() => startCheckout("mailbox_once"))}
            >
              renew one year
            </button>
          ) : (
            <span className="text-[var(--ink-faint)]">renews on its own</span>
          )}
          <button
            type="button"
            disabled={pending}
            className="min-h-11 sm:min-h-0"
            onClick={() => run(setupHelp)}
          >
            setup help
          </button>
          <a
            href={mailbox.recoveryUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center sm:min-h-0"
          >
            forgot password
          </a>
          <a
            href="/support"
            className="inline-flex min-h-11 items-center sm:min-h-0"
          >
            support
          </a>
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
        onOnce={() => run(() => startCheckout("mailbox_once"))}
        onYearly={() => run(() => startCheckout("mailbox_subscription"))}
      />
    );
  }

  return (
    <BuyChoices
      compact={compact}
      pending={pending}
      error={error}
      note={note}
      lead={aliasNote}
      onOnce={() => run(() => startCheckout("mailbox_once"))}
      onYearly={() => run(() => startCheckout("mailbox_subscription"))}
    />
  );
}

function BuyChoices({
  compact,
  pending,
  error,
  note,
  lead,
  onOnce,
  onYearly,
}: {
  compact: boolean;
  pending: boolean;
  error: string | null;
  note: string | null;
  lead?: string | null;
  onOnce: () => void;
  onYearly: () => void;
}) {
  return (
    <div className="space-y-1 text-[12px] text-[var(--ink)]">
      {lead ? <p className="text-[var(--ink-faint)]">{lead}</p> : null}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <button type="button" disabled={pending} onClick={onOnce}>
          {pending ? "opening…" : inboxOnceLabel()}
        </button>
        <button type="button" disabled={pending} onClick={onYearly}>
          {inboxYearlyLabel()}
        </button>
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
