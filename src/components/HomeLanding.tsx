"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { BrandMark } from "@/components/BrandMark";
import { MailboxOfferInfo } from "@/components/MailboxOfferInfo";
import { Stage } from "@/components/Stage";
import {
  LANDING_PHRASE_PRESET,
  presetById,
} from "@/lib/phrase-presets";
import { defaultLookForSlug, DEFAULT_LOOK, stageStyle } from "@/lib/looks";
import { MAILBOX_OFFERS } from "@/lib/mailbox-pricing";
import { normalizeWord } from "@/lib/slug";
import type { CheckoutKind } from "@/lib/mailbox-status";

type Check =
  | { status: "idle" }
  | { status: "looking" }
  | { status: "invalid"; error: string }
  | { status: "taken"; error: string; slug: string }
  | { status: "held"; error: string }
  | { status: "free"; local: string };

const IDLE_HERO = presetById(LANDING_PHRASE_PRESET)?.text ?? "pity is a terrible religion";

export function HomeLanding({ signedIn }: { signedIn: boolean }) {
  const [raw, setRaw] = useState("");
  const [check, setCheck] = useState<Check>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const trayRef = useRef<HTMLDivElement>(null);
  const [trayH, setTrayH] = useState(88);
  const slug = useMemo(() => normalizeWord(raw), [raw]);
  const look = useMemo(
    () => (slug ? defaultLookForSlug(slug) : DEFAULT_LOOK),
    [slug],
  );

  useEffect(() => {
    const node = trayRef.current;
    if (!node) return;
    const measure = () => setTrayH(node.getBoundingClientRect().height + 24);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

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

  function buy(kind: Exclude<CheckoutKind, "keep">) {
    if (check.status !== "free") return;
    setError(null);
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
      window.location.href = data.url;
    });
  }

  const hint =
    check.status === "looking"
      ? "checking…"
      : check.status === "free"
        ? `${check.local}@lost.pink is available`
        : check.status === "held" || check.status === "invalid"
          ? check.error
          : slug && slug.length < 2
            ? "at least 2 characters."
            : null;

  return (
    <div
      className="landing-home relative min-h-[100dvh] overflow-hidden"
      style={
        {
          "--tray-h": `${trayH}px`,
          ...stageStyle(look),
        } as React.CSSProperties
      }
    >
      <Stage
        word={slug}
        look={look}
        alias={null}
        idleHero={slug ? null : IDLE_HERO}
        className="stage--landing"
        animate
      />
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-baseline justify-between gap-4 p-4 sm:p-8">
        <BrandMark className="pointer-events-auto text-[13px] text-[var(--stage-ink)]/85" />
      </header>

      <div className="landing-tray absolute inset-x-0 z-20 p-3 sm:p-6">
        <div ref={trayRef} className="mx-auto w-full max-w-md">
          <form
            className="quiet-tray quiet-tray--landing px-3 py-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              buy("mailbox_subscription");
            }}
          >
            <label htmlFor="name" className="field-label">
              username
            </label>
            <input
              id="name"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="@"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              autoFocus
              className="quiet-field w-full border-0 bg-transparent pb-1 text-xl text-[var(--ink)] outline-none"
            />
            <div className="min-h-[1.15rem]" aria-live="polite">
              {check.status === "taken" ? (
                <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                  that name is taken.{" "}
                  <a
                    href={`/${check.slug}`}
                    className="cursor-pointer underline underline-offset-2"
                  >
                    view their page
                  </a>
                </p>
              ) : hint ? (
                <p className="mt-1 text-[11px] text-[var(--ink-muted)]">{hint}</p>
              ) : null}
            </div>
            {error ? (
              <p className="mt-1 text-xs text-[var(--ink-muted)]" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
              {MAILBOX_OFFERS.map((offer) => (
                <div key={offer.kind} className="flex min-w-0 items-center gap-1">
                  <button
                    type={offer.kind === "mailbox_subscription" ? "submit" : "button"}
                    disabled={pending || check.status !== "free"}
                    onClick={
                      offer.kind === "mailbox_subscription"
                        ? undefined
                        : () => buy(offer.kind)
                    }
                    className="mailbox-offer-button min-h-9 min-w-0 flex-1 cursor-pointer text-left text-[12px] text-[var(--ink)]/80 disabled:cursor-not-allowed disabled:opacity-25 sm:text-[13px]"
                  >
                    {pending ? "opening checkout…" : offer.label}
                  </button>
                  <MailboxOfferInfo
                    label={offer.label}
                    explanation={offer.explanation}
                  />
                </div>
              ))}
            </div>
          </form>
          <p className="mark mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[10px] text-[var(--stage-ink)]/50">
            <a href={signedIn ? "/you" : "/come"} className="underline-offset-2 hover:underline">
              {signedIn ? "yours" : "log in"}
            </a>
            <a href="/support" className="underline-offset-2 hover:underline">
              support
            </a>
            <a href="/privacy" className="underline-offset-2 hover:underline">
              privacy
            </a>
            <a href="/terms" className="underline-offset-2 hover:underline">
              terms
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
