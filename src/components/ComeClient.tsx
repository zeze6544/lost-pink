"use client";

import { useState, useTransition } from "react";

export function ComeClient({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "couldn’t send that.");
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="mt-4 text-[13px] text-[var(--ink)]">
        check your mail. the link is quiet, and it expires.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4">
      <label htmlFor="email" className="sr-only">
        email
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your email"
        autoComplete="email"
        className="w-full border-0 bg-transparent text-base text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
      />
      {error ? (
        <p className="mt-2 text-xs text-[var(--ink-muted)]" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || !email.trim()}
        className="mt-3 text-[13px] text-[var(--ink)] disabled:opacity-30"
      >
        {pending ? "sending…" : "send the link"}
      </button>
    </form>
  );
}
