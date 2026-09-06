"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { Stage } from "@/components/Stage";
import type { Look } from "@/lib/looks";
import { stageStyle } from "@/lib/looks";
import { provisionProgress } from "@/lib/mailbox-lifecycle";
import type { OwnerMailboxView } from "@/lib/mailbox-view";
import { inboxLabel, inboxWaiting, shareOrCopy } from "@/lib/voice";

type Progress = ReturnType<typeof provisionProgress>;

type Props = {
  slug: string;
  word: string;
  line: string | null;
  look: Look;
  bgUrl: string | null;
  tokenUrl: string | null;
  alias?: string | null;
  caption?: string | null;
  inbox?: boolean;
  pageId?: string | null;
  initialMailbox?: OwnerMailboxView | null;
};

export function ThanksClient({
  slug,
  word,
  line,
  look,
  bgUrl,
  tokenUrl,
  alias = null,
  caption = null,
  inbox = false,
  pageId = null,
  initialMailbox = null,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [mailbox, setMailbox] = useState(initialMailbox);
  const shown = word || slug || "kept";
  const progress = mailbox
    ? provisionProgress(mailbox.status, mailbox.provisionStep)
    : null;

  useEffect(() => {
    if (!inbox || !pageId) return;
    if (mailbox?.status === "live" || mailbox?.status === "failed") return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(
          `/api/mailbox/status?pageId=${encodeURIComponent(pageId)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { mailbox?: OwnerMailboxView | null };
        if (!cancelled && data.mailbox) setMailbox(data.mailbox);
      } catch {
        // keep last known progress
      }
    };
    const id = setInterval(() => void tick(), 2500);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [inbox, pageId, mailbox?.status]);

  useEffect(() => {
    if (mailbox?.status === "awaiting_account" && mailbox.id) {
      window.location.replace(`/join?mailbox=${encodeURIComponent(mailbox.id)}`);
    }
  }, [mailbox?.id, mailbox?.status]);

  async function share() {
    if (!slug) return;
    const url = `${window.location.origin}/${slug}`;
    const result = await shareOrCopy(url, `lost.pink/${slug}`);
    if (result === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden"
      style={
        {
          "--tray-h": "7.5rem",
          ...stageStyle(look),
        } as React.CSSProperties
      }
    >
      <Stage
        word={shown}
        look={look}
        line={line}
        alias={alias}
        writeHref={
          mailbox?.status === "live" && slug ? `/${slug}/write` : null
        }
        bgUrl={bgUrl}
        tokenUrl={tokenUrl}
        caption={caption}
        animate
      />
      <div className="absolute left-4 top-4 z-20 sm:left-8 sm:top-8">
        <BrandMark className="text-sm text-[var(--stage-ink)]/80 transition hover:text-[var(--stage-ink)]" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-6">
        <div className="quiet-tray mx-auto w-full max-w-md px-3.5 py-3">
          {slug ? (
            <>
              <p className="text-sm text-[var(--ink)]">
                {inbox
                  ? thanksInboxLine(alias, mailbox, progress)
                  : "kept."}
              </p>
              <p className="mt-0.5 text-[13px] text-[var(--ink-muted)]">
                {inbox
                  ? "keep still preserves the name. this is mail."
                  : `${shown} isn't going anywhere.`}
              </p>
              {inbox && progress ? (
                <p className="mt-1.5 text-[12px] text-[var(--ink-faint)]">
                  {progressLine(progress)}
                </p>
              ) : null}
              {mailbox?.status === "failed" ? (
                <p className="mt-1 text-[12px] text-[var(--ink)]">
                  <a href="/support">write support</a>
                  <span className="mx-2 text-[var(--ink-faint)]">·</span>
                  <a href={`/${slug}`}>try again from the page</a>
                </p>
              ) : null}
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[var(--ink)]">
                <button
                  type="button"
                  aria-live="polite"
                  onClick={() => void share()}
                >
                  {copied ? "copied" : "share"}
                </button>
                {!inbox ? (
                  <a href={`/${slug}`} className="text-[var(--ink)]">
                    {inboxLabel()}
                  </a>
                ) : null}
                <a href={`/${slug}`} className="ml-auto text-[var(--ink-muted)]">
                  open {shown} →
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--ink)]">kept.</p>
              <p className="mt-1 text-[12px] text-[var(--ink-muted)]">
                if it isn&apos;t here yet, wait a moment and open the link again.
              </p>
              <a
                href="/"
                className="mt-2 inline-block text-[13px] text-[var(--ink-muted)]"
              >
                back
              </a>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function thanksInboxLine(
  alias: string | null,
  mailbox: OwnerMailboxView | null,
  progress: Progress | null,
): string {
  if (mailbox?.status === "live" && alias) return inboxWaiting(alias);
  if (mailbox?.status === "failed") return "couldn't open it yet.";
  if (progress?.invitationSent) return alias ? inboxWaiting(alias) : "invitation sent.";
  if (progress?.creatingInbox) return "creating inbox.";
  if (progress?.paymentReceived) return "payment received.";
  return "the inbox is still arriving.";
}

function progressLine(progress: Progress): string {
  if (progress.failed) return "failed · we can try again.";
  if (progress.live || progress.invitationSent) {
    return "payment received → creating inbox → invitation sent";
  }
  if (progress.creatingInbox) return "payment received → creating inbox";
  return "payment received";
}
