"use client";

import { useState, useTransition } from "react";

type Phase = "confirm" | "deleting" | "deleted" | "error";

export function DeleteNameClient({
  handle,
  word,
  pageId,
}: {
  handle: string;
  word: string;
  pageId: string;
}) {
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>("confirm");
  const [error, setError] = useState<string | null>(null);
  const label = word || handle;
  const ready = confirm.trim().toLowerCase() === handle.toLowerCase();

  function onDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || pending) return;
    setError(null);
    setPhase("deleting");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/pages/${encodeURIComponent(pageId)}/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: handle }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "couldn't delete.");
          setPhase("error");
          return;
        }
        setPhase("deleted");
      } catch {
        setError("couldn't delete.");
        setPhase("error");
      }
    });
  }

  if (phase === "deleting") {
    return (
      <p className="font-mono text-[13px] text-[var(--ink-muted)]">
        deleting {label}…
      </p>
    );
  }

  if (phase === "deleted") {
    return (
      <div className="mx-auto w-full max-w-md text-left">
        <p className="font-display text-[clamp(2rem,6vw,2.8rem)] leading-none tracking-tight text-[var(--ink)]">
          deleted.
        </p>
        <p className="mt-4 font-mono text-[13px] leading-relaxed text-[var(--ink-muted)]">
          the page is gone. the inbox is dark. mail is kept 7 days, then gone.
          the name may return to the pool after that window.
        </p>
        <p className="mt-8">
          <a
            href="/settings"
            className="font-mono text-[12px] text-[var(--ink-muted)] underline-offset-2 hover:underline"
          >
            back to yours
          </a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onDelete} className="mx-auto w-full max-w-md text-left">
      <div className="space-y-3 font-mono text-[13px] leading-relaxed text-[var(--ink-muted)]">
        <p>this removes the page, the inbox, and recovery access.</p>
        <p>mail is kept 7 days after deletion starts, then gone.</p>
        <p>the name may return to the pool only after that window.</p>
        <p>this does not refund remaining paid time.</p>
      </div>

      <label htmlFor="confirm-name" className="sr-only">
        type {handle} to confirm
      </label>
      <input
        id="confirm-name"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={`type ${handle} to confirm`}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        className="mt-8 w-full border border-[color-mix(in_srgb,var(--ink)_40%,transparent)] bg-transparent px-3 py-2.5 font-mono text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)]"
      />

      <div className="mt-6 flex items-center gap-5">
        <button
          type="submit"
          disabled={!ready || pending}
          className="cursor-pointer border border-[color-mix(in_srgb,var(--ink)_45%,transparent)] px-5 py-2 font-display text-[1.1rem] text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          delete forever
        </button>
        <a
          href={`/settings/${handle}`}
          className="font-display text-[1.1rem] text-[var(--ink-muted)]"
        >
          cancel
        </a>
      </div>

      {error ? (
        <p className="mt-4 font-mono text-[12px] text-[var(--ink-muted)]" role="alert">
          {error}
        </p>
      ) : null}

      <p className="mt-10 border-t border-[var(--rule)] pt-4 font-mono text-[11px] text-[var(--ink-muted)]">
        destructive. kept away from devices and billing.
      </p>
    </form>
  );
}
