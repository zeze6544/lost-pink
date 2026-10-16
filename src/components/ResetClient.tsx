"use client";

import { useState, useTransition } from "react";

export function ResetClient({ next }: { next: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("those don't match.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "couldn't update the password.");
        return;
      }
      window.location.href = next;
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4">
      <label htmlFor="new-password" className="sr-only">
        new password
      </label>
      <input
        id="new-password"
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="new password"
        autoComplete="new-password"
        className="quiet-field w-full border-0 bg-transparent pb-1 text-base text-[var(--ink)] outline-none"
      />
      <label htmlFor="confirm-password" className="sr-only">
        confirm password
      </label>
      <input
        id="confirm-password"
        type="password"
        required
        minLength={8}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="once more"
        autoComplete="new-password"
        className="quiet-field mt-3 w-full border-0 bg-transparent pb-1 text-base text-[var(--ink)] outline-none"
      />
      {error ? (
        <p className="mt-2 text-xs text-[var(--ink-muted)]" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || password.length < 8 || confirm.length < 8}
        className="mt-3 cursor-pointer text-[13px] text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-30"
      >
        {pending ? "saving…" : "set the password"}
      </button>
    </form>
  );
}
