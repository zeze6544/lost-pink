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
    <div className="mt-12 space-y-10">
      <form id="password" onSubmit={changePassword} className="scroll-mt-28 space-y-2">
        <label htmlFor="new-password" className="field-label">
          password
        </label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="at least 8 characters"
          autoComplete="new-password"
          className="quiet-field w-full border-0 bg-transparent py-2 font-mono text-[14px] outline-none"
        />
        <button
          type="submit"
          disabled={pending || password.length < 8}
          className="tray-btn"
        >
          {pending ? "saving…" : "update password"}
        </button>
        {inbox ? (
          <p className="pt-1">
            <a
              href="/come/forgot"
              className="font-mono text-[12px] text-[var(--ink-muted)] underline underline-offset-2"
            >
              forgot password
            </a>
          </p>
        ) : null}
      </form>
      <form id="recovery" onSubmit={changeRecovery} className="scroll-mt-28 space-y-2">
        <label htmlFor="recovery-email" className="field-label">
          recovery
        </label>
        <input
          id="recovery-email"
          type="email"
          value={recovery}
          onChange={(e) => setRecovery(e.target.value)}
          placeholder="not @lost.pink"
          autoComplete="email"
          className="quiet-field w-full border-0 bg-transparent py-2 font-mono text-[14px] outline-none"
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
      {error ? (
        <p className="text-[12px] text-[var(--ink-muted)]" role="alert">
          {error}
        </p>
      ) : null}
      {note ? <p className="text-[12px] text-[var(--ink-faint)]">{note}</p> : null}
    </div>
  );
}
