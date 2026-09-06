"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { InboxPanel } from "@/components/InboxPanel";
import type { Look } from "@/lib/looks";
import type { PublicMailboxLabel } from "@/lib/mailbox-status";
import type { OwnerMailboxView } from "@/lib/mailbox-view";
import {
  formatHereFor,
  JUST_LEFT_KEY,
  keepLabel,
  shareOrCopy,
} from "@/lib/voice";
import { FREE_PAGE_HOURS } from "@/lib/product-rules";

type Props = {
  pageId: string;
  slug: string;
  word: string;
  line: string | null;
  look: Look;
  bgUrl: string | null;
  tokenUrl: string | null;
  kept: boolean;
  expiresAt: string | null;
  foundCount: number;
  alias?: string | null;
  owned?: boolean;
  canComeBack?: boolean;
  mailboxStatus?: PublicMailboxLabel;
  mailbox?: OwnerMailboxView | null;
  onDismissJustLeft?: () => void;
  onTrayHeight?: (px: number) => void;
};

export function PageActions({
  pageId,
  slug,
  word,
  kept,
  expiresAt,
  foundCount,
  alias = null,
  owned = false,
  canComeBack = false,
  mailboxStatus = "none",
  mailbox = null,
  onDismissJustLeft,
  onTrayHeight,
}: Props) {
  const trayRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const [found, setFound] = useState(foundCount);
  const [tapped, setTapped] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [justLeft, setJustLeft] = useState(false);
  const writePath = mailboxStatus === "open" ? `/${slug}/write` : null;

  useEffect(() => {
    setTapped(localStorage.getItem(foundKey(slug)) === "1");
  }, [slug]);

  useEffect(() => {
    if (sessionStorage.getItem(JUST_LEFT_KEY) === slug) {
      setJustLeft(true);
    }
  }, [slug]);

  useEffect(() => {
    if (kept || !expiresAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [kept, expiresAt]);

  useEffect(() => {
    const node = trayRef.current;
    if (!node || !onTrayHeight) return;
    const measure = () => onTrayHeight(node.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [justLeft, onTrayHeight]);

  function openPage() {
    sessionStorage.removeItem(JUST_LEFT_KEY);
    setJustLeft(false);
    onDismissJustLeft?.();
  }

  async function share() {
    const url = `${window.location.origin}/${slug}`;
    const result = await shareOrCopy(url, `lost.pink/${slug}`);
    if (result === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }

  function keepIt() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "couldn't keep it.");
        return;
      }
      window.location.href = data.url;
    });
  }

  async function foundThis() {
    if (tapped) return;
    setTapped(true);
    localStorage.setItem(foundKey(slug), "1");
    try {
      const res = await fetch("/api/found", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = (await res.json()) as { found?: number };
      if (res.ok && typeof data.found === "number") {
        setFound(data.found);
      }
    } catch {
      setTapped(false);
      localStorage.removeItem(foundKey(slug));
    }
  }

  const countdown =
    !kept && expiresAt && now ? formatHereFor(expiresAt, now) : null;
  const hereLabel = kept
    ? "kept"
    : (countdown ?? (expiresAt ? formatHereFor(expiresAt, Date.now()) : null));

  if (justLeft) {
    return (
      <div
        ref={trayRef}
        className="absolute bottom-0 left-0 right-0 z-20 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6"
      >
        <div className="quiet-tray mx-auto flex w-full max-w-md flex-col gap-1.5 px-3.5 py-2.5">
          <p className="text-sm text-[var(--ink)]">{word} is somewhere now.</p>
          <p className="text-[12px] text-[var(--ink-faint)]">
            lost.pink/{slug}
          </p>
          <button
            type="button"
            onClick={() => void share()}
            aria-live="polite"
          className="cursor-pointer text-left text-[13px] text-[var(--ink)]"
          >
            {copied ? "copied" : "share"}
          </button>
          <button
            type="button"
            onClick={openPage}
            className="cursor-pointer text-left text-[13px] text-[var(--ink-muted)]"
          >
            open {word} →
          </button>
          <p className="text-[11px] text-[var(--ink-faint)]">
            {owned
              ? "you own this page."
              : `here for ${FREE_PAGE_HOURS} hours unless someone keeps it.`}
          </p>
          <InboxPanel
            pageId={pageId}
            kept={kept}
            signedIn={owned}
            alias={alias}
            publicLabel={mailboxStatus}
            mailbox={mailbox}
            compact
            inviteComeBack={canComeBack}
            nextPath={`/${slug}`}
            writePath={writePath}
            onNeedAlias={openPage}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={trayRef}
      className="absolute bottom-0 left-0 right-0 z-20 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6"
    >
      <div className="quiet-tray mx-auto flex w-full max-w-md flex-col gap-1.5 px-3.5 py-2.5">
        <div className="flex items-baseline justify-between gap-3 text-[12px] text-[var(--ink-muted)]">
          <span>lost.pink/{slug}</span>
          {hereLabel ? <span>{hereLabel}</span> : null}
        </div>
        <button
          type="button"
          onClick={foundThis}
          className="cursor-pointer text-left text-[13px] text-[var(--ink)] transition-opacity duration-200"
        >
          {tapped ? "♥ found this" : "♡ found this"}
          {found >= 10 ? (
            <span className="text-[var(--ink-faint)]"> · {found}</span>
          ) : null}
        </button>
        <a href="/" className="text-left text-[13px] text-[var(--ink-faint)]">
          make one for someone else
        </a>
        <button
          type="button"
          onClick={() => void share()}
          aria-live="polite"
          className="cursor-pointer text-left text-[13px] text-[var(--ink)]"
        >
          {copied ? "copied" : "share"}
        </button>
        {!kept ? (
          <button
            type="button"
            onClick={keepIt}
            disabled={pending}
            className="cursor-pointer text-left text-[13px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "keeping…" : keepLabel(word)}
          </button>
        ) : null}
        <InboxPanel
          pageId={pageId}
          kept={kept}
          signedIn={owned}
          alias={alias}
          publicLabel={mailboxStatus}
          mailbox={owned ? mailbox : null}
          compact
          inviteComeBack={canComeBack}
          nextPath={`/${slug}`}
          writePath={writePath}
        />
        {error ? (
          <p className="text-xs text-[var(--ink-muted)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function foundKey(slug: string) {
  return `lost.pink:found:${slug}`;
}
