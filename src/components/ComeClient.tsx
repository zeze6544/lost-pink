"use client";

import { useState, useTransition } from "react";

export function ComeClient({ next }: { next: string }) {
  const [inbox, setInbox] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inbox, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "that didn't open.");
        return;
      }
      window.location.href = next;
    });
  }

  return (
    <div className="mt-5">
      <form onSubmit={onPassword} className="space-y-3">
        <p className="field-label">INBOX AND PASSWORD</p>
        <label htmlFor="inbox-email" className="sr-only">
          lost.pink inbox
        </label>
        <div className="lp-boxed-field flex items-center gap-2 border border-[color-mix(in_srgb,var(--ink)_40%,transparent)] px-3 py-2.5">
          <span className="text-[13px] text-[var(--ink-muted)]" aria-hidden>
            @
          </span>
          <input
            id="inbox-email"
            type="text"
            required
            value={inbox}
            onChange={(e) => setInbox(e.target.value)}
            placeholder="you@lost.pink"
            autoComplete="username"
            className="w-full border-0 bg-transparent font-mono text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)]"
          />
        </div>
        <label htmlFor="password" className="sr-only">
          password
        </label>
        <div className="lp-boxed-field flex items-center gap-2 border border-[color-mix(in_srgb,var(--ink)_40%,transparent)] px-3 py-2.5">
          <span className="text-[var(--ink-muted)]" aria-hidden>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2.5" y="5.5" width="7" height="5" stroke="currentColor" strokeWidth="1" />
              <path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" stroke="currentColor" strokeWidth="1" />
            </svg>
          </span>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            autoComplete="current-password"
            className="w-full border-0 bg-transparent font-mono text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)]"
          />
        </div>
        {error ? (
          <p className="text-xs text-[var(--ink-muted)]" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending || !inbox.trim() || !password}
          className="lp-boxed-field w-full cursor-pointer border border-[color-mix(in_srgb,var(--ink)_48%,transparent)] bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] py-2.5 font-mono text-[13px] text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          {pending ? "opening…" : "open"}
        </button>
      </form>
      <p className="mt-3 text-center font-mono text-[12px] text-[var(--ink)]/88">
        <a
          href={`/come/forgot${inbox.trim() ? `?email=${encodeURIComponent(inbox.trim())}` : ""}`}
          className="underline underline-offset-2"
        >
          forgot the password
        </a>
      </p>
      <p className="mt-5 text-center font-mono text-[12px] leading-relaxed text-[var(--ink)]/78">
        left a page without an inbox?{" "}
        <a href="/come/forgot" className="underline underline-offset-2">
          we&apos;ll send a sign-in link
        </a>
        .
      </p>
    </div>
  );
}
