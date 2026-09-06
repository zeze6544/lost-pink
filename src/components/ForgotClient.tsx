"use client";

import { useState, useTransition } from "react";

export function ForgotClient({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="mt-4 text-[13px] text-[var(--ink)]">
        if we know that inbox, we wrote the recovery address.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4">
      <label htmlFor="forgot-email" className="field-label">
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
