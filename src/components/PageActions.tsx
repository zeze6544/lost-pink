"use client";

import { useEffect, useState, useTransition } from "react";
import { downloadLockScreen } from "@/lib/export-png";
import type { Look } from "@/lib/looks";

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

  useEffect(() => {
    setTapped(localStorage.getItem(foundKey(slug)) === "1");
  }, [slug]);

  useEffect(() => {
    if (kept || !expiresAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [kept, expiresAt]);

  async function copyLink() {
    const url = `${window.location.origin}/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function keepForever() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Checkout failed.");
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
    !kept && expiresAt && now
      ? formatCountdown(expiresAt, now)
      : null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3 rounded-2xl border border-[var(--ink)]/10 bg-[var(--paper)]/80 p-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--ink-muted)]">
          <span>lost.pink/{slug}</span>
          {kept ? (
            <span>Kept forever</span>
          ) : (
            <span>{countdown ?? "Free for 48 hours"}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <button
            type="button"
            onClick={foundThis}
            className="text-[var(--ink)] underline-offset-4 hover:underline"
          >
            {tapped ? "You found this" : "Found this"}
            {found >= 10 ? (
              <span className="ml-1 text-[var(--ink-muted)]">· {found}</span>
            ) : null}
          </button>
          <a
            href="/"
            className="text-[var(--ink-muted)] underline-offset-4 hover:underline"
          >
            make one for someone else
          </a>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={copyLink}
            className="h-11 flex-1 rounded-full border border-[var(--ink)]/15 bg-white/50 text-sm text-[var(--ink)] transition hover:bg-white/80"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={savePng}
            className="h-11 flex-1 rounded-full border border-[var(--ink)]/15 bg-white/50 text-sm text-[var(--ink)] transition hover:bg-white/80"
          >
            Save 9:16
          </button>
        </div>
        {!kept ? (
          <button
            type="button"
            onClick={keepForever}
            disabled={pending}
            className="h-11 rounded-full bg-[var(--ink)] text-sm text-[var(--blush)] transition enabled:hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Opening…" : "Keep this name · $5"}
          </button>
        ) : null}
        {error ? (
          <p className="text-sm text-[#8a2f45]" role="alert">
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

function formatCountdown(expiresAt: string, now: number): string {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return "Expiring…";
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `Gone in ${d}d ${h}h`;
  return `Gone in ${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
