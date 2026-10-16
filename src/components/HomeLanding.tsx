"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { BrandMark } from "@/components/BrandMark";
import { SiteFooter } from "@/components/SiteFrame";
import { TakenNamePreview } from "@/components/TakenNamePreview";
import { readLastClaim, writeLastClaim } from "@/lib/claim-session";
import { LANDING_HERO_LINES } from "@/lib/landing-voice";
import { HOME_MAILBOX_OFFERS } from "@/lib/mailbox-pricing";
import {
  NAME_MIN_CHARS,
  PUBLIC_IMPLIES_ADDRESS,
  claimLengthCopy,
  impliedPageAndAddress,
  productOneLiner,
} from "@/lib/product-rules";
import { normalizeWord } from "@/lib/slug";
import type { CheckoutKind } from "@/lib/mailbox-status";
import { holdCountdownCopy } from "@/lib/voice";

type Check =
  | { status: "idle" }
  | { status: "looking" }
  | { status: "invalid"; error: string }
  | {
      status: "taken";
      error: string;
      slug: string;
      word?: string | null;
      line?: string | null;
    }
  | { status: "reserved"; error: string }
  | { status: "held"; error: string; until: string | null }
  | { status: "free"; local: string };

export function HomeLanding({ signedIn }: { signedIn: boolean }) {
  const [raw, setRaw] = useState("");
  const [check, setCheck] = useState<Check>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const slug = useMemo(() => normalizeWord(raw), [raw]);

  useEffect(() => {
    const u = new URLSearchParams(window.location.search).get("u");
    if (u) {
      setRaw(u);
      return;
    }
    const last = readLastClaim();
    if (last?.alias) setRaw(last.alias);
  }, []);

  useEffect(() => {
    const last = readLastClaim();
    if (last?.polarUrl && last.alias === slug) {
      setResumeUrl(last.polarUrl);
      return;
    }
    setResumeUrl(null);
  }, [slug]);

  useEffect(() => {
    if (check.status !== "held" || !check.until) return;
    const wait = Math.min(
      30_000,
      Math.max(1_000, new Date(check.until).getTime() - Date.now()),
    );
    const t = window.setTimeout(() => setNow(Date.now()), wait);
    return () => window.clearTimeout(t);
  }, [check, now]);

  useEffect(() => {
    if (slug.length < NAME_MIN_CHARS) {
      setCheck({ status: "idle" });
      return;
    }
    setCheck({ status: "looking" });
    const t = window.setTimeout(async () => {
      const res = await fetch(
        `/api/alias/available?q=${encodeURIComponent(slug)}`,
      );
      const data = (await res.json()) as Check & {
        error?: string;
        local?: string;
        slug?: string;
        until?: string | null;
        word?: string | null;
        line?: string | null;
      };
      if (data.status === "free" && data.local) {
        setCheck({ status: "free", local: data.local });
        return;
      }
      if (data.status === "invalid") {
        setCheck({ status: "invalid", error: data.error ?? "not a name." });
        return;
      }
      if (data.status === "reserved") {
        setCheck({
          status: "reserved",
          error: data.error ?? `${slug} is reserved.`,
        });
        return;
      }
      if (data.status === "held") {
        setCheck({
          status: "held",
          error: data.error ?? "someone is holding that name.",
          until: data.until ?? null,
        });
        return;
      }
      setCheck({
        status: "taken",
        error: data.error ?? "that name is taken.",
        slug: data.slug || slug,
        word: data.word,
        line: data.line,
      });
    }, 220);
    return () => window.clearTimeout(t);
  }, [slug]);

  function buy(kind: Exclude<CheckoutKind, "keep">) {
    if (check.status !== "free") return;
    setError(null);
    writeLastClaim({ alias: check.local, kind });
    startTransition(async () => {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: check.local, kind }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "couldn't start checkout.");
        return;
      }
      writeLastClaim({ alias: check.local, kind, polarUrl: data.url });
      window.location.href = data.url;
    });
  }

  function resumeHold() {
    if (!resumeUrl) return;
    window.location.href = resumeUrl;
  }

  const implication =
    PUBLIC_IMPLIES_ADDRESS && slug.length > 0
      ? impliedPageAndAddress(slug)
      : null;
  const tooShort = slug.length > 0 && slug.length < NAME_MIN_CHARS;
  const heldCopy =
    check.status === "held"
      ? check.until
        ? holdCountdownCopy(check.until, now)
        : check.error
      : null;
  const canResumeHold = check.status === "held" && Boolean(resumeUrl);
  const hint =
    tooShort
      ? claimLengthCopy()
      : check.status === "looking"
        ? "checking…"
        : check.status === "free"
          ? `${check.local}@lost.pink is available`
          : check.status === "held"
            ? heldCopy
            : check.status === "invalid" || check.status === "reserved"
              ? check.error
              : check.status === "taken"
                ? null
                : null;

  return (
    <div className="lp-shell relative min-h-[100dvh] overflow-hidden bg-[var(--paper)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 z-0">
        <Atmosphere wash={1} variant="landing" />
      </div>

      <header className="absolute left-0 top-0 z-20 p-5 sm:p-8">
        <BrandMark className="text-[13px] tracking-[0.04em] text-[var(--ink)]/90" />
      </header>

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        {/* Hero sits in the upper stage above the floor / tray */}
        <div className="flex flex-[0.92] flex-col items-center justify-center px-6 pb-0 pt-12 sm:pt-10">
          <h1 className="lp-hero font-display text-center text-[clamp(3.8rem,12vw,7.9rem)] font-medium leading-[0.88] tracking-[-0.04em] text-[var(--ink)]">
            {LANDING_HERO_LINES.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mark mt-6 max-w-sm text-center text-[12px] tracking-[0.04em] text-[var(--ink-muted)]">
            {productOneLiner()}
          </p>
        </div>

        <div className="relative z-10 w-full shrink-0">
          <div className="site-rule" aria-hidden />

          <div className="mx-auto flex flex-col items-center px-6 py-5">
            <label htmlFor="name" className="sr-only">
              name
            </label>
            <div className="lp-boxed-field mt-1 flex w-[min(34rem,88vw)] items-center justify-between gap-3 border border-[var(--rule)] px-4 py-3">
              <input
                id="name"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="mercy"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                autoFocus
                className="min-w-0 flex-1 border-0 bg-transparent font-mono text-[17px] text-[var(--ink)] outline-none placeholder:text-[var(--ink)]/45"
              />
              <span className="shrink-0 font-mono text-[17px] text-[var(--ink)]/55">
                @lost.pink
              </span>
            </div>
            <div className="mt-2 min-h-[1rem] text-center" aria-live="polite">
              {implication ? (
                <p className="mark text-[11px] tracking-[0.04em] text-[var(--ink-muted)]">
                  {implication}
                </p>
              ) : null}
              {check.status === "taken" ? (
                <TakenNamePreview
                  slug={check.slug}
                  word={check.word}
                  line={check.line}
                />
              ) : hint ? (
                <p className="mark text-[11px] text-[var(--ink-muted)]">{hint}</p>
              ) : null}
              {canResumeHold ? (
                <p className="mt-2">
                  <button
                    type="button"
                    className="mark cursor-pointer text-[11px] text-[var(--ink)] underline underline-offset-2"
                    onClick={resumeHold}
                  >
                    keep {slug}
                  </button>
                </p>
              ) : null}
              {error ? (
                <p className="mark text-[11px] text-[var(--ink-muted)]" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </div>

          <div className="site-rule" aria-hidden />

          <div className="lp-price-row grid grid-cols-1 border-b border-[var(--rule)] sm:grid-cols-3">
            {HOME_MAILBOX_OFFERS.map((offer, i) => (
              <button
                key={offer.kind}
                type="button"
                disabled={pending || check.status !== "free"}
                onClick={() => buy(offer.kind)}
                aria-label={`keep for ${offer.label} ${offer.explanation}`}
                className={`group flex min-h-[7rem] flex-col items-center justify-center gap-2 px-3 py-5 text-center transition ${
                  check.status === "free" && !pending
                    ? "cursor-pointer text-[var(--ink)] enabled:hover:bg-white/[0.04] enabled:focus-visible:bg-white/[0.06]"
                    : "cursor-not-allowed opacity-40"
                } ${
                  i > 0 ? "border-t border-[var(--rule)] sm:border-l sm:border-t-0" : ""
                }`}
              >
                <span className="font-display text-[2.65rem] leading-none tracking-[-0.03em] transition group-enabled:group-hover:tracking-[-0.04em]">
                  {pending ? "…" : offer.label}
                </span>
                <span className="mark text-[11px] tracking-[0.05em] text-[var(--ink-muted)]">
                  {offer.explanation}
                </span>
              </button>
            ))}
          </div>

          <SiteFooter
            left={<span className="sr-only">lost.pink</span>}
            center={
              <>
                <a href={signedIn ? "/settings" : "/come"}>you&apos;re back</a>
                <span aria-hidden> · </span>
                <a href="/support">support</a>
                <span aria-hidden> · </span>
                <a href="/privacy">privacy</a>
                <span aria-hidden> · </span>
                <a href="/terms">terms</a>
              </>
            }
            right={null}
            className="lp-footer-flat"
          />
        </div>
      </div>
    </div>
  );
}