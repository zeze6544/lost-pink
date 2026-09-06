"use client";

import { useState, useTransition } from "react";

export function DeleteNameClient({
  handle,
  word,
}: {
  handle: string;
  word: string;
}) {
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const label = word || handle;
  const ready = confirm.trim().toLowerCase() === handle.toLowerCase();

  function onDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    startTransition(() => {
      // No silent destroy API yet — open a support request with the typed name.
      const subject = encodeURIComponent(`delete ${handle}`);
      const body = encodeURIComponent(
        `please delete ${handle}.\n\nI understand this removes the page, the inbox, and recovery access.\nMail is kept 7 days after deletion starts, then gone.\nThe name may return to the pool only after that window.\nThis does not refund remaining paid time.\n`,
      );
      window.location.href = `mailto:support@lost.pink?subject=${subject}&body=${body}`;
      setDone(true);
    });
  }

  if (done) {
    return (
      <p className="font-mono text-[13px] text-[var(--ink-muted)]">
        your mail client should open. if it doesn&apos;t, write{" "}
        <a href="mailto:support@lost.pink" className="underline underline-offset-2">
          support@lost.pink
        </a>
        .
      </p>
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
          {pending ? "…" : "delete forever"}
        </button>
        <a
          href={`/settings/${handle}`}
          className="font-display text-[1.1rem] text-[var(--ink-muted)]"
        >
          cancel
        </a>
      </div>

      <p className="mt-10 border-t border-[var(--rule)] pt-4 font-mono text-[11px] text-[var(--ink-muted)]">
        destructive. kept away from devices and billing.
      </p>
    </form>
  );
}
