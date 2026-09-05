"use client";

import { useState, useTransition } from "react";
import { validRecoveryEmail } from "@/lib/slug";

export function SettingsClient({
  inbox,
  mailboxId,
  recoveryEmail,
}: {
  inbox: string | null;
  mailboxId: string | null;
  recoveryEmail: string | null;
}) {
  const [password, setPassword] = useState("");
  const [recovery, setRecovery] = useState(recoveryEmail ?? "");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const recoveryNeedsOther = Boolean(
    recoveryEmail && !validRecoveryEmail(recoveryEmail),
  );

  function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNote(null);
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
      setPassword("");
      setNote("password updated.");
    });
  }

  function changeRecovery(e: React.FormEvent) {
    e.preventDefault();
    if (!mailboxId) return;
    setError(null);
    setNote(null);
    startTransition(async () => {
      const res = await fetch("/api/mailbox/recovery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailboxId, email: recovery }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "couldn't save that email.");
        return;
      }
      setNote("recovery email saved. reset links will go there.");
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={changeRecovery} className="space-y-2">
        <label htmlFor="recovery-email" className="field-label">
          recovery email
        </label>
        <input
          id="recovery-email"
          type="email"
          value={recovery}
          onChange={(e) => setRecovery(e.target.value)}
          placeholder="not @lost.pink"
          autoComplete="email"
          className="quiet-field w-full border-0 bg-transparent py-2 text-[14px] outline-none"
        />
        {recoveryNeedsOther ? (
          <p className="text-[12px] text-[var(--ink-muted)]">
            this has to be a different email. we cannot write the inbox you
            cannot open.
          </p>
        ) : (
          <p className="text-[12px] text-[var(--ink-faint)]">
            reset links go here, not to your @lost.pink inbox.
          </p>
        )}
        <button
          type="submit"
          disabled={pending || !mailboxId || !validRecoveryEmail(recovery)}
          className="tray-btn"
        >
          {pending ? "saving…" : "save recovery email"}
        </button>
      </form>
      <form onSubmit={changePassword} className="space-y-2">
        <label htmlFor="new-password" className="field-label">
          change password
        </label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="at least 8 characters"
          autoComplete="new-password"
          className="quiet-field w-full border-0 bg-transparent py-2 text-[14px] outline-none"
        />
        <button
          type="submit"
          disabled={pending || password.length < 8}
          className="tray-btn"
        >
          {pending ? "saving…" : "update password"}
        </button>
      </form>
      {inbox ? (
        <a href="/come/forgot" className="tray-btn inline-flex items-center">
          forgot password
        </a>
      ) : null}
      {error ? (
        <p className="text-[12px] text-[var(--ink-muted)]" role="alert">
          {error}
        </p>
      ) : null}
      {note ? <p className="text-[12px] text-[var(--ink-faint)]">{note}</p> : null}
    </div>
  );
}
