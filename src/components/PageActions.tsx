"use client";

import { useEffect, useState, useTransition } from "react";
import { downloadLockScreen } from "@/lib/export-png";
import type { Look } from "@/lib/looks";
import {
  formatHereFor,
  JUST_LEFT_KEY,
  keepLabel,
  shareOrCopy,
} from "@/lib/voice";

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
};

export function PageActions({
  pageId,
  slug,
  word,
  line,
  look,
  bgUrl,
  tokenUrl,
  kept,
  expiresAt,
  foundCount,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const [found, setFound] = useState(foundCount);
  const [tapped, setTapped] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [justLeft, setJustLeft] = useState(false);

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

  function openShrine() {
    sessionStorage.removeItem(JUST_LEFT_KEY);
    setJustLeft(false);
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

  function savePng() {
    void downloadLockScreen({
      word,
      look,
      line,
      bgUrl,
      tokenUrl,
      watermark: !kept,
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
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-6">
        <div className="quiet-tray mx-auto w-full max-w-md px-3.5 py-3">
          <p className="text-sm text-[var(--ink)]">{word} is somewhere now.</p>
          <p className="mt-0.5 text-[12px] text-[var(--ink-faint)]">
            lost.pink/{slug}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[var(--ink)]">
            <button type="button" onClick={() => void share()}>
              {copied ? "copied" : "share"}
            </button>
            <button type="button" onClick={savePng}>
              save 9:16
            </button>
            <button
              type="button"
              onClick={openShrine}
              className="ml-auto text-[var(--ink-muted)]"
            >
              open {word} →
            </button>
          </div>
          <p className="mt-2 text-[11px] text-[var(--ink-faint)]">
            here for 48 hours unless someone keeps it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-6">
      <div className="quiet-tray mx-auto w-full max-w-md px-3.5 py-2.5">
        <div className="flex items-baseline justify-between gap-3 text-[12px] text-[var(--ink-muted)]">
          <span>lost.pink/{slug}</span>
          {hereLabel ? <span>{hereLabel}</span> : null}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-3 text-[13px]">
          <button
            type="button"
            onClick={foundThis}
            className="text-[var(--ink)] transition-opacity duration-200"
          >
            {tapped ? "♥ found this" : "♡ found this"}
            {found >= 10 ? (
              <span className="text-[var(--ink-faint)]"> · {found}</span>
            ) : null}
          </button>
          <a href="/" className="text-[var(--ink-faint)]">
            make one for someone else
          </a>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[var(--ink)]">
          <button type="button" onClick={() => void share()}>
            {copied ? "copied" : "share"}
          </button>
          <button type="button" onClick={savePng}>
            save 9:16
          </button>
          {!kept ? (
            <button
              type="button"
              onClick={keepIt}
              disabled={pending}
              className="ml-auto disabled:opacity-50"
            >
              {pending ? "keeping…" : keepLabel(word)}
            </button>
          ) : null}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-[var(--ink-muted)]" role="alert">
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
