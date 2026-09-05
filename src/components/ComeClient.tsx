"use client";

import { useState, useTransition } from "react";

export function ComeClient({ next }: { next: string }) {
  const [inbox, setInbox] = useState("");
  const [password, setPassword] = useState("");
  const [pageEmail, setPageEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [forgotNote, setForgotNote] = useState<string | null>(null);

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
        setError(data.error ?? "that didn’t open.");
        return;
      }
      window.location.href = next;
    });
  }

  function onLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pageEmail, next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "couldn’t send that.");
        return;
      }
      setSent(true);
    });
  }

  async function onForgot() {
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inbox }),
    });
    setForgotNote("if we know that inbox, we wrote the recovery address.");
  }

  if (sent) {
    return (
      <p className="mt-4 text-[13px] text-[var(--ink)]">
        check your email for the sign-in link. it expires soon.
      </p>
    );
  }

  return (
    <div className="mt-5">
      <form onSubmit={onPassword}>
        <p className="field-label">inbox and password</p>
        <label htmlFor="inbox-email" className="sr-only">
          lost.pink inbox
        </label>
        <input
          id="inbox-email"
          type="text"
          required
          value={inbox}
          onChange={(e) => setInbox(e.target.value)}
          placeholder="you@lost.pink"
          autoComplete="username"
          className="quiet-field mt-2 w-full border-0 bg-transparent pb-1 text-base text-[var(--ink)] outline-none"
        />
        <label htmlFor="password" className="sr-only">
          password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          autoComplete="current-password"
          className="quiet-field mt-3 w-full border-0 bg-transparent pb-1 text-base text-[var(--ink)] outline-none"
        />
        {error ? (
          <p className="mt-2 text-xs text-[var(--ink-muted)]" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending || !inbox.trim() || !password}
          className="mt-3 cursor-pointer text-[13px] text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          {pending ? "opening…" : "open"}
        </button>
      </form>

      <p className="mt-3 text-[11px] text-[var(--ink-muted)]">
        <button
          type="button"
          onClick={onForgot}
          className="underline-offset-2 hover:underline"
        >
          {forgotNote ?? "forgot the password"}
        </button>
      </p>

      <form
        onSubmit={onLink}
        className="mt-6 border-t border-[var(--ink)]/10 pt-4"
      >
        <p className="field-label">page sign-in link</p>
        <p className="mb-3 mt-2 text-[11px] leading-relaxed text-[var(--ink-muted)]">
          left a page without an inbox? enter the email you used and we will
          send a sign-in link.
        </p>
        <label htmlFor="link-email" className="sr-only">
          email used for the page
        </label>
        <input
          id="link-email"
          type="email"
          required
          value={pageEmail}
          onChange={(e) => setPageEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="quiet-field w-full border-0 bg-transparent pb-1 text-base text-[var(--ink)] outline-none"
        />
        <button
          type="submit"
          disabled={pending || !pageEmail.trim()}
          className="mt-3 cursor-pointer text-[13px] text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          {pending ? "sending…" : "send sign-in link"}
        </button>
      </form>
    </div>
  );
}
