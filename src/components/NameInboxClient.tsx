"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { BrandMark } from "@/components/BrandMark";
import { SiteFooter } from "@/components/SiteFrame";
import { NAME_INBOX_WHISPER } from "@/lib/landing-voice";
import { normalizeWord } from "@/lib/slug";

type Check =
  | { status: "idle" }
  | { status: "looking" }
  | { status: "invalid"; error: string }
  | { status: "taken"; error: string; slug: string }
  | { status: "held"; error: string }
  | { status: "free"; local: string };

export function NameInboxClient({ signedIn }: { signedIn: boolean }) {
  const [raw, setRaw] = useState("");
  const [check, setCheck] = useState<Check>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const slug = useMemo(() => normalizeWord(raw), [raw]);

  useEffect(() => {
    if (slug.length < 2) {
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
      };
      if (data.status === "free" && data.local) {
        setCheck({ status: "free", local: data.local });
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
        });
        return;
      }
      setCheck({
        status: "taken",
        error: data.error ?? "that name is taken.",
        slug: data.slug || slug,
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
            className="pointer-events-none mb-8 max-w-md text-center font-display text-[clamp(1.15rem,3.4vw,1.85rem)] leading-snug tracking-[-0.02em] text-[var(--ink)]/[0.22] blur-[1.2px]"
            aria-hidden
          >
            {NAME_INBOX_WHISPER}
          </p>

          <h1 className="font-display text-center text-[clamp(2.4rem,7vw,4.25rem)] font-medium leading-none tracking-[-0.035em] text-[var(--ink)]">
            name the inbox
          </h1>

          <p className="mark mt-6 text-center text-[11px] tracking-[0.14em] text-[var(--ink-muted)]">
            CHOOSE A USERNAME.
          </p>

          <form
            className="mt-8 flex w-full max-w-xs flex-col items-center"
            onSubmit={(e) => {
              e.preventDefault();
              continueName();
            }}
          >
            <div className="lp-underline-field inline-flex min-w-[16rem] items-baseline justify-center border-b border-[var(--rule)] pb-1.5">
              <input
                id="name-inbox"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="your"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                autoFocus
                size={Math.max(4, (raw || "your").length)}
                className="w-auto min-w-[3ch] border-0 bg-transparent text-right font-mono text-[16px] text-[var(--ink)] outline-none placeholder:text-[var(--ink)]/75"
              />
              <span className="shrink-0 font-mono text-[16px] text-[var(--ink)]/80">
                @lost.pink
              </span>
            </div>

            <div className="mt-3 min-h-[1rem] text-center" aria-live="polite">
              {check.status === "taken" ? (
                <p className="mark text-[11px] text-[var(--ink-muted)]">
                  that name is taken.{" "}
                  <a
                    href={`/${check.slug}`}
                    className="underline underline-offset-2"
                  >
                    view their page
                  </a>
                </p>
              ) : check.status === "free" ? (
                <p className="mark text-[11px] text-[var(--ink-muted)]">
                  {check.local}@lost.pink is available
                </p>
              ) : check.status === "looking" ? (
                <p className="mark text-[11px] text-[var(--ink-muted)]">
                  checking…
                </p>
              ) : check.status === "held" || check.status === "invalid" ? (
                <p className="mark text-[11px] text-[var(--ink-muted)]">
                  {check.error}
                </p>
              ) : null}
              {error ? (
                <p
                  className="mark text-[11px] text-[var(--ink-muted)]"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mark mt-8 cursor-pointer border-0 border-b border-[var(--ink)]/55 bg-transparent pb-0.5 text-[11px] tracking-[0.16em] text-[var(--ink)] disabled:opacity-30"
            >
              {pending ? "…" : "continue"}
            </button>
          </form>
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
  );
}
