"use client";

import { useState, useTransition } from "react";

export function ComeClient({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const typed = email.trim().toLowerCase();
  const inboxLogin =
    typed.endsWith("@lost.pink") || (typed.length > 0 && !typed.includes("@"));

  function onPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "that password didn’t work.");
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
        body: JSON.stringify({ email, next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "couldn’t send the link.");
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="mt-4 text-[13px] text-[var(--ink)]">
        check your email — we sent a sign-in link. it won’t last forever.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <form onSubmit={inboxLogin ? onPassword : onLink}>
        <label htmlFor="email" className="sr-only">
          email
        </label>
        <input
          id="email"
          type="text"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@lost.pink"
          autoComplete="username"
          className="quiet-field w-full border-0 bg-transparent pb-1 text-base text-[var(--ink)] outline-none"
        />
        {inboxLogin ? (
          <>
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
          </>
        ) : null}
        {error ? (
          <p className="mt-2 text-xs text-[var(--ink-muted)]" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending || !email.trim() || (inboxLogin && !password)}
          className="mt-3 text-[13px] text-[var(--ink)] disabled:opacity-30"
        >
          {pending ? "opening…" : inboxLogin ? "open" : "send the link"}
        </button>
      </form>
      <p className="mt-4 text-[11px] text-[var(--ink-muted)]">
        old shrines still use a quiet link. type that other email and we’ll send
        it. <ForgotLink email={email} />
      </p>
    </div>
  );
}

function ForgotLink({ email }: { email: string }) {
  const [note, setNote] = useState<string | null>(null);
  return (
    <button
      type="button"
      className="underline-offset-2 hover:underline"
      onClick={async () => {
        await fetch("/api/auth/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        setNote("if we know that inbox, we wrote the recovery address.");
      }}
    >
      {note ?? "forgot the password"}
    </button>
  );
}
