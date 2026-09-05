"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { PhraseBackdrop } from "@/components/PhraseBackdrop";
import { MAILBOX_OFFERS } from "@/lib/mailbox-pricing";
import { normalizeWord } from "@/lib/slug";
import type { CheckoutKind } from "@/lib/mailbox-status";

type Check =
  | { status: "idle" }
  | { status: "looking" }
  | { status: "invalid"; error: string }
  | { status: "taken"; error: string; slug?: string }
  | { status: "held"; error: string }
  | { status: "free"; local: string };

export function HomeLanding({ signedIn }: { signedIn: boolean }) {
  const [raw, setRaw] = useState("");
  const [check, setCheck] = useState<Check>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Exclude<CheckoutKind, "keep">>(
    "mailbox_subscription",
  );
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
          error: data.error ?? "someone’s holding that name.",
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

  function createAccount() {
    if (check.status !== "free") return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: check.local, kind: plan }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "couldn't start that.");
        return;
      }
      window.location.href = data.url;
    });
  }

  const note =
    check.status === "looking"
      ? "looking…"
      : check.status === "free"
        ? `this becomes ${check.local}@lost.pink`
        : check.status === "taken"
          ? check.error
          : check.status === "held" || check.status === "invalid"
            ? check.error
            : slug
              ? "keep typing."
              : "this becomes you@lost.pink";

  return (
    <div
      className="landing-home relative min-h-[100dvh] overflow-hidden bg-[#050505] text-[var(--ink)]"
      style={
        {
          "--stage-a": "#161616",
          "--stage-b": "#242422",
          "--stage-c": "#0c0c0c",
          "--stage-ink": "#eceae4",
        } as React.CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0">
        <Atmosphere variant="landing" wash={1} />
        <PhraseBackdrop preset="pity-religion" variant="stage" />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-baseline justify-between gap-4 p-4 sm:p-8">
        <a
          href="/"
          className="brand-mark mark pointer-events-auto inline-flex items-center gap-2 text-[13px] text-[var(--stage-ink)]/85"
        >
          <span className="brand-glyph" aria-hidden />
          lost.pink
        </a>
      </header>

      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 py-20 sm:px-6">
        <div className="auth-card w-full max-w-md px-4 py-5 sm:px-5 sm:py-6">
          <label htmlFor="name" className="field-label">
            username
          </label>
          <div className="auth-input mt-2 flex items-center gap-2 px-3 py-2.5">
            <span className="font-display text-2xl text-[var(--ink)]/55">@</span>
            <input
              id="name"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder=""
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              autoFocus
              className="w-full border-0 bg-transparent font-mono text-[15px] text-[var(--ink)] outline-none"
            />
          </div>
          <p className="mark mt-2 text-[11px] text-[var(--ink-muted)]">
            {check.status === "taken" ? (
              <>
                that name is taken.{" "}
                <a
                  href={`/${check.slug || slug}`}
                  className="underline underline-offset-2"
                >
                  view their page
                </a>
              </>
            ) : (
              note
            )}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {MAILBOX_OFFERS.map((offer) => {
              const selected = plan === offer.kind;
              return (
                <button
                  key={offer.kind}
                  type="button"
                  onClick={() => setPlan(offer.kind)}
                  aria-pressed={selected}
                  className={`plan-card flex items-center gap-2.5 px-3 py-3 text-left ${
                    selected ? "plan-card--on" : ""
                  }`}
                >
                  <span
                    className={`plan-radio ${selected ? "plan-radio--on" : ""}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="font-display block text-[1.35rem] leading-none tracking-tight text-[var(--ink)]">
                      {offer.label}
                    </span>
                    <span className="mark mt-1 block text-[10px] text-[var(--ink-muted)]">
                      {offer.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {error ? (
            <p className="mt-3 text-xs text-[var(--ink-muted)]" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={pending || check.status !== "free"}
            onClick={createAccount}
            className="auth-primary mt-4 w-full py-3 font-mono text-[13px] tracking-wide text-[var(--ink)] disabled:opacity-30"
          >
            {pending ? "holding…" : "create account"}
          </button>
          <p className="mark mt-3 text-center text-[10px] text-[var(--ink-faint)]">
            names are first come, first served.
          </p>
        </div>
      </div>

      <p className="mark absolute inset-x-0 bottom-5 z-20 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-[11px] text-[var(--ink)]/70">
        <a href={signedIn ? "/you" : "/come"} className="hover:underline">
          {signedIn ? "yours" : "log in"}
        </a>
        <a href="/support" className="hover:underline">
          support
        </a>
        <a href="/privacy" className="hover:underline">
          privacy
        </a>
        <a href="/terms" className="hover:underline">
          terms
        </a>
      </p>
    </div>
  );
}
