"use client";

import { useEffect, useState, useTransition } from "react";

type Step = "name" | "recovery" | "password" | "done";

const STEP_COPY: Record<Exclude<Step, "done">, { title: string; note: string }> = {
  name: { title: "your name", note: "how you sign letters." },
  recovery: { title: "if you lose the key", note: "an email that isn’t @lost.pink." },
  password: {
    title: "a password for the inbox",
    note: "one password for lost.pink, your inbox, and mail apps like Apple Mail or Gmail.",
  },
};

export function JoinClient({
  mailboxId,
  checkoutId,
}: {
  mailboxId: string | null;
  checkoutId: string | null;
}) {
  const [step, setStep] = useState<Step>("name");
  const [paid, setPaid] = useState<boolean | null>(null);
  const [boxId, setBoxId] = useState(mailboxId);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [recovery, setRecovery] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const q = new URLSearchParams();
    if (mailboxId) q.set("mailbox", mailboxId);
    if (checkoutId) q.set("checkout_id", checkoutId);
    fetch(`/api/join/status?${q.toString()}`)
      .then(async (res) => {
        const data = (await res.json()) as {
          paid?: boolean;
          email?: string;
          mailboxId?: string;
          ready?: boolean;
          error?: string;
        };
        if (data.ready && data.email) {
          window.location.assign(`/${data.email.split("@")[0]}`);
          return;
        }
        setPaid(Boolean(data.paid));
        if (data.mailboxId) setBoxId(data.mailboxId);
        if (data.email) setEmail(data.email);
        if (!data.paid) setError(data.error ?? "that payment isn’t here.");
      })
      .catch(() => {
        setPaid(false);
        setError("that payment isn’t here.");
      });
  }, [mailboxId, checkoutId]);

  function body() {
    return {
      mailbox: boxId,
      checkout_id: checkoutId,
      name,
      recovery,
      password,
    };
  }

  function nextName() {
    if (name.trim().length < 2) {
      setError("we need a name.");
      return;
    }
    setError(null);
    setStep("recovery");
  }

  function nextRecovery() {
    const value = recovery.trim().toLowerCase();
    if (!value.includes("@") || value.endsWith("@lost.pink")) {
      setError("use a recovery email that isn’t @lost.pink.");
      return;
    }
    setError(null);
    setStep("password");
  }

  function finish() {
    if (password.length < 8) {
      setError("make the password at least 8 characters.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/join/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body()),
      });
      const data = (await res.json()) as { slug?: string; error?: string };
      if (!res.ok || !data.slug) {
        setError(data.error ?? "couldn't open the inbox.");
        return;
      }
      setStep("done");
      window.location.assign(`/${data.slug}`);
    });
  }

  function continueStep() {
    if (step === "name") nextName();
    else if (step === "recovery") nextRecovery();
    else if (step === "password") finish();
  }

  function back() {
    setError(null);
    if (step === "recovery") setStep("name");
    else if (step === "password") setStep("recovery");
  }

  if (paid === null) {
    return (
      <div>
        <h1 className="font-display text-3xl tracking-tight">looking</h1>
        <p className="mt-2 text-[13px] text-[var(--ink-muted)]">a moment.</p>
      </div>
    );
  }
  if (!paid) {
    return (
      <div>
        <h1 className="font-display text-3xl tracking-tight">not yet</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-muted)]">
          {error ?? "that payment isn’t here."}
        </p>
        <a
          href="/"
          className="mt-4 inline-block text-[13px] text-[var(--ink)] underline-offset-2 hover:underline"
        >
          start with a name
        </a>
      </div>
    );
  }

  const copy = step === "done" ? null : STEP_COPY[step];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        continueStep();
      }}
    >
      {copy ? (
        <>
          <h1 className="font-display text-3xl tracking-tight">{copy.title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-muted)]">
            {copy.note}
          </p>
        </>
      ) : (
        <p className="text-[13px] text-[var(--ink-muted)]">opening…</p>
      )}
      {email ? (
        <p className="mt-3 text-[11px] tracking-[0.12em] text-[var(--ink-muted)]">
          {email}
        </p>
      ) : null}

      <div className="mt-4">
        {step === "name" ? (
          <Field
            id="name"
            label="your name"
            value={name}
            onChange={setName}
            placeholder="how you sign letters"
          />
        ) : null}
        {step === "recovery" ? (
          <Field
            id="recovery"
            label="recovery email"
            value={recovery}
            onChange={setRecovery}
            placeholder="not @lost.pink"
            type="email"
          />
        ) : null}
        {step === "password" ? (
          <Field
            id="password"
            label="password"
            value={password}
            onChange={setPassword}
            placeholder="at least 8 characters"
            type="password"
            autoComplete="new-password"
          />
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 text-xs text-[var(--ink-muted)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex items-center gap-4">
        {step !== "name" && step !== "done" ? (
          <button
            type="button"
            disabled={pending}
            onClick={back}
            className="text-[13px] text-[var(--ink-muted)] disabled:opacity-30"
          >
            back
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending || step === "done"}
          className="text-[13px] text-[var(--ink)] disabled:opacity-30"
        >
          {pending
            ? "working…"
            : step === "password"
              ? "open the inbox"
              : "continue"}
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete = "off",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus
        className="quiet-field w-full border-0 bg-transparent pb-1 text-base text-[var(--ink)] outline-none"
      />
    </div>
  );
}
