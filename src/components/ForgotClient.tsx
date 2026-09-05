"use client";

import { useState, useTransition } from "react";

export function ForgotClient({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "couldn't write that.");
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="mt-4 text-[13px] leading-relaxed text-[var(--ink)]">
        if we know that inbox, we emailed your recovery address. the link opens
        here so you can set a new password.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4">
      <label htmlFor="forgot-email" className="sr-only">
        inbox
      </label>
      <input
        id="forgot-email"
        type="text"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@lost.pink"
        autoComplete="username"
        className="quiet-field w-full border-0 bg-transparent pb-1 text-base text-[var(--ink)] outline-none"
      />
      {error ? (
        <p className="mt-2 text-xs text-[var(--ink-muted)]" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || !email.trim()}
        className="mt-3 cursor-pointer text-[13px] text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-30"
      >
        {pending ? "writing…" : "write the recovery email"}
      </button>
    </form>
  );
}
