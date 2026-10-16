"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { BrandMark } from "@/components/BrandMark";
import { TakenNamePreview } from "@/components/TakenNamePreview";
import { NAME_INBOX_WHISPER } from "@/lib/landing-voice";
import {
  NAME_MIN_CHARS,
  PUBLIC_IMPLIES_ADDRESS,
  claimLengthCopy,
  impliedPageAndAddress,
  nameIsPageAndAddress,
} from "@/lib/product-rules";
import { holdCountdownCopy } from "@/lib/voice";
import { normalizeWord } from "@/lib/slug";

type Check =
  | { status: "idle" }
  | { status: "looking" }
  | { status: "invalid"; error: string }
  | { status: "reserved"; error: string }
  | {
      status: "taken";
      error: string;
      slug: string;
      word?: string | null;
      line?: string | null;
    }
  | { status: "held"; error: string; until: string | null }
  | { status: "free"; local: string };

export function NameInboxClient({ signedIn: _signedIn }: { signedIn: boolean }) {
  const [raw, setRaw] = useState("");
  const [check, setCheck] = useState<Check>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const slug = useMemo(() => normalizeWord(raw), [raw]);

  useEffect(() => {
    const u = new URLSearchParams(window.location.search).get("u");
    if (u) setRaw(u);
  }, []);

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
      if (data.status === "reserved") {
        setCheck({
          status: "reserved",
          error: data.error ?? `${slug} is reserved.`,
        });
        return;
      }
      if (data.status === "invalid") {
        setCheck({ status: "invalid", error: data.error ?? "not a name." });
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

  function continueName() {
    if (check.status !== "free") {
      setError(
        check.status === "idle"
          ? "choose a username."
          : check.status === "looking"
            ? "still checking."
            : "error" in check
              ? check.error
              : "that name isn’t free.",
      );
      return;
    }
    setError(null);
    startTransition(() => {
      window.location.assign(`/?u=${encodeURIComponent(check.local)}`);
    });
  }

  const implication =
    PUBLIC_IMPLIES_ADDRESS && slug.length > 0
      ? impliedPageAndAddress(slug)
      : null;
  const statusLine =
    slug.length > 0 && slug.length < NAME_MIN_CHARS ? (
      <p className="mark text-[12px] text-[var(--ink-muted)]">
        {claimLengthCopy()}
      </p>
    ) : check.status === "taken" ? (
      <TakenNamePreview slug={check.slug} word={check.word} line={check.line} />
    ) : check.status === "free" ? (
      <p className="mark text-[12px] text-[var(--ink-muted)]">
        {check.local}@lost.pink - yours.
      </p>
    ) : check.status === "looking" ? (
      <p className="mark text-[12px] text-[var(--ink-muted)]">checking…</p>
    ) : check.status === "reserved" ? (
      <p className="mark text-[12px] text-[var(--ink)]">{check.error}</p>
    ) : check.status === "held" || check.status === "invalid" ? (
      <p className="mark text-[12px] text-[var(--ink)]">
        {check.status === "held" && check.until
          ? holdCountdownCopy(check.until)
          : check.error}
      </p>
    ) : null;

  return (
    <div className="lp-shell relative min-h-[100dvh] overflow-hidden bg-[var(--paper)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 z-0">
        <Atmosphere wash={1} variant="landing" />
      </div>

      <header className="absolute left-0 top-0 z-20 p-5 sm:p-8">
        <BrandMark className="text-[13px] tracking-[0.04em] text-[var(--ink)]/90" />
      </header>

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-24">
          <p
            className="claim-whisper pointer-events-none mb-8 max-w-md text-center font-display text-[clamp(1.15rem,3.4vw,1.85rem)] leading-snug tracking-[-0.02em] text-[var(--ink)]/[0.22]"
            aria-hidden
          >
            {NAME_INBOX_WHISPER}
          </p>

          <h1 className="font-display text-center text-[clamp(2.4rem,7vw,4.25rem)] font-medium leading-none tracking-[-0.035em] text-[var(--ink)]">
            name the inbox
          </h1>

          <p className="mark mt-4 max-w-xs text-center text-[12px] tracking-[0.04em] text-[var(--ink-muted)]">
            {nameIsPageAndAddress()}
          </p>

          <form
            className="mt-10 flex w-full max-w-sm flex-col items-center"
            onSubmit={(e) => {
              e.preventDefault();
              continueName();
            }}
          >
            <label htmlFor="name-inbox" className="sr-only">
              name
            </label>
            <div className="lp-boxed-field flex w-full items-stretch border border-[color-mix(in_srgb,var(--ink)_40%,transparent)]">
              <input
                id="name-inbox"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="mercy"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                autoFocus
                className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 font-display text-[1.55rem] leading-none tracking-[-0.02em] text-[var(--ink)] outline-none placeholder:text-[var(--ink)]/35"
              />
              <span
                className="w-px self-stretch bg-[color-mix(in_srgb,var(--ink)_40%,transparent)]"
                aria-hidden
              />
              <span className="flex shrink-0 items-center px-4 font-mono text-[14px] text-[var(--ink)]/55">
                @lost.pink
              </span>
            </div>

            <div className="mt-3 min-h-[1.25rem] text-center" aria-live="polite">
              {implication ? (
                <p className="mark text-[12px] text-[var(--ink-muted)]">
                  {implication}
                </p>
              ) : null}
              {statusLine}
              {error ? (
                <p className="mark text-[12px] text-[var(--ink-muted)]" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={pending || check.status !== "free"}
              className="mark mt-8 cursor-pointer border border-[color-mix(in_srgb,var(--ink)_45%,transparent)] bg-transparent px-8 py-2.5 text-[12px] tracking-[0.14em] text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {pending ? "…" : "continue"}
            </button>
          </form>
        </div>

        <p className="mark px-6 pb-8 text-center text-[11px] text-[var(--ink-muted)]">
          continue stays off until the name is free and valid.
        </p>
      </div>
    </div>
  );
}
