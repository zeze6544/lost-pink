"use client";

import { useEffect, useState } from "react";

type Creds = {
  user: string;
  password: string;
  imap: { host: string; port: number; security: string };
  smtp: { host: string; port: number; security: string };
};

export function GmailSetup({ pageId }: { pageId: string | null }) {
  const [creds, setCreds] = useState<Creds | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!pageId) return;
    fetch(`/api/mail/credentials?pageId=${encodeURIComponent(pageId)}`)
      .then(async (res) => {
        const data = (await res.json()) as Creds & { error?: string };
        if (!res.ok) {
          setError(data.error ?? "sign in first.");
          return;
        }
        setCreds(data);
      })
      .catch(() => setError("couldn't load credentials."));
  }, [pageId]);

  if (!pageId) {
    return (
      <p className="mt-4 font-mono text-[13px] text-[var(--ink-muted)]">
        buy an inbox first. then this page has the keys.
      </p>
    );
  }

  if (error && !creds) {
    return (
      <p className="mt-4 font-mono text-[13px] text-[var(--ink-muted)]">{error}</p>
    );
  }

  if (!creds) {
    return (
      <p className="mt-4 font-mono text-[13px] text-[var(--ink-muted)]">
        looking…
      </p>
    );
  }

  const user = creds.user;
  const imapHost = creds.imap.host;
  const imapPort = creds.imap.port;
  const imapSec = creds.imap.security;
  const smtpHost = creds.smtp.host;
  const smtpPort = creds.smtp.port;
  const smtpSec = creds.smtp.security;

  return (
    <div className="border border-[var(--rule)] bg-[color-mix(in_srgb,#080808_70%,transparent)] px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="font-mono text-[14px] tracking-[0.04em] text-[var(--ink)]">
        gmail
      </h2>
      <div className="mt-3 border-t border-[var(--rule)]" aria-hidden />

      <ol className="mt-5 space-y-5 font-mono text-[12px] leading-relaxed">
        <Step n={1} title="ENABLE IMAP">
          <p className="text-[var(--ink-muted)]">
            Turn on IMAP in your Google Account settings.
          </p>
        </Step>
        <Step n={2} title="INCOMING MAIL (IMAP)">
          <Rows
            rows={[
              ["Server", imapHost],
              ["Port", String(imapPort)],
              ["Security", imapSec],
            ]}
          />
        </Step>
        <Step n={3} title="OUTGOING MAIL (SMTP)">
          <Rows
            rows={[
              ["Server", smtpHost],
              ["Port", String(smtpPort)],
              ["Security", smtpSec],
            ]}
          />
        </Step>
        <Step n={4} title="USERNAME">
          <p className="text-[var(--ink-muted)]">{user}</p>
        </Step>
        <Step n={5} title="PASSWORD">
          <p className="text-[var(--ink-muted)]">
            {showPass ? creds.password : "••••••••••••"}{" "}
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => setShowPass((v) => !v)}
            >
              {showPass ? "hide" : "show"}
            </button>
          </p>
        </Step>
      </ol>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-[var(--rule)] text-[10px] text-[var(--ink)]">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="tracking-[0.08em] text-[var(--ink)]">{title}</p>
        <div className="mt-2">{children}</div>
      </div>
    </li>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="space-y-1 text-[var(--ink-muted)]">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[5.5rem_1fr] gap-2">
          <dt>{k}</dt>
          <dd className="text-[var(--ink)]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
