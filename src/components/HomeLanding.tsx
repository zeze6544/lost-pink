"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Stage } from "@/components/Stage";
import { defaultLookForSlug, DEFAULT_LOOK, stageStyle } from "@/lib/looks";
import { MAILBOX_OFFERS } from "@/lib/mailbox-pricing";
import { normalizeWord } from "@/lib/slug";
import { comeBackLabel } from "@/lib/voice";
import type { CheckoutKind } from "@/lib/mailbox-status";

type Check =
  | { status: "idle" }
  | { status: "looking" }
  | { status: "invalid"; error: string }
  | { status: "taken"; error: string }
  | { status: "held"; error: string }
  | { status: "free"; local: string };

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
      const data = (await res.json()) as Check & { error?: string; local?: string };
      if (data.status === "free" && data.local) {
        setCheck({ status: "free", local: data.local });
        return;
      }
      if (data.status === "invalid") {
        setCheck({ status: "invalid", error: data.error ?? "not a name." });
        return;
      }
      if (data.status === "held") {
        setCheck({ status: "held", error: data.error ?? "someone’s holding that name." });
        return;
      }
      setCheck({
        status: "taken",
        error: data.error ?? "that name is taken.",
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
        ? "that name is free."
        : check.status === "taken" || check.status === "held" || check.status === "invalid"
          ? check.error
          : slug
            ? "keep typing."
            : "username, then an @lost.pink inbox";

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden"
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
        aliasNote={slug.length >= 2 ? `lost.pink/${slug}` : null}
        idleHero={slug ? null : "pity is a terrible religion"}
        animate
      />
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-baseline justify-between gap-4 p-4 sm:p-8">
        <p className="mark text-sm text-[var(--stage-ink)] sm:text-[15px]">
          lost.pink
        </p>
      </header>

      <div className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-6">
        <div ref={trayRef} className="mx-auto w-full max-w-md">
          {slug ? (
            <p className="mark mb-2 px-0.5 text-[10px] leading-relaxed text-[var(--stage-ink)]/45">
              the inbox stays. the page can wait.
            </p>
          ) : null}
          <form
            className="quiet-tray px-3 py-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              buy("mailbox_subscription");
            }}
          >
            <label htmlFor="name" className="sr-only">
              username
            </label>
            <input
              id="name"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="username"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              autoFocus
              className="quiet-field w-full border-0 bg-transparent pb-1 text-xl text-[var(--ink)] outline-none"
            />
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">{note}</p>
            {error ? (
              <p className="mt-1 text-xs text-[var(--ink-muted)]" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
              {MAILBOX_OFFERS.map((offer) => (
                <button
                  key={offer.kind}
                  type={offer.kind === "mailbox_subscription" ? "submit" : "button"}
                  disabled={pending || check.status !== "free"}
                  onClick={
                    offer.kind === "mailbox_subscription"
                      ? undefined
                      : () => buy(offer.kind)
                  }
                  className="min-h-9 text-left text-[12px] text-[var(--ink)]/80 disabled:opacity-25 sm:text-[13px]"
                >
                  {pending ? "holding…" : offer.label}
                </button>
              ))}
            </div>
          </form>
          <p className="mark mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[10px] text-[var(--stage-ink)]/50">
            <a href={signedIn ? "/you" : "/come"} className="underline-offset-2 hover:underline">
              {signedIn ? "yours" : comeBackLabel()}
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
