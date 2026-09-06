"use client";

import { useEffect, useState } from "react";
import { MailSetupIcon } from "@/components/MailSetupIcons";
import {
  MAIL_SETUP_CLIENTS,
  MAIL_SETUP_DEFAULTS,
  mailSetupCopy,
  type MailSetupClient,
} from "@/lib/mail-setup";

type Creds = {
  user: string;
  password: string;
  imap: { host: string; port: number; security: string };
  smtp: { host: string; port: number; security: string };
};

export function MailSetupChooser() {
  return (
    <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
      <div className="w-full max-w-xl">
        <h1 className="font-mono text-[clamp(1.6rem,4vw,2.2rem)] leading-tight tracking-[-0.02em] text-[var(--ink)]">
          put it in your mail app
        </h1>

        <ul className="mt-8 space-y-3">
          {MAIL_SETUP_CLIENTS.map((client) => (
            <li key={client.id}>
              <a
                href={client.href}
                className="group flex items-center gap-3 border border-[color-mix(in_srgb,var(--ink)_38%,transparent)] px-4 py-3 transition hover:bg-white/[0.03]"
              >
                <MailSetupIcon id={client.id} />
                <span className="flex-1 font-mono text-[13px] text-[var(--ink)]">
                  {client.label}
                </span>
                <span
                  className="font-mono text-[14px] text-[var(--ink-muted)] transition group-hover:translate-x-0.5"
                  aria-hidden
                >
                  {">"}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-md font-mono text-[12px] leading-relaxed text-[var(--ink-muted)]">
          password is the one you set for you@lost.pink -
          <br />
          not a gmail app password.
        </p>
      </div>

      <div className="relative mx-auto hidden w-full max-w-md lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/mail-setup-portal.png"
          alt=""
          className="mx-auto h-auto w-full max-w-[22rem] object-contain opacity-95"
        />
        <p className="pointer-events-none absolute bottom-0 right-0 font-mono text-[11px] text-[var(--ink-muted)]">
          {MAIL_SETUP_DEFAULTS.imapHost}
        </p>
      </div>

      <p className="font-mono text-[11px] text-[var(--ink-muted)] lg:hidden">
        {MAIL_SETUP_DEFAULTS.imapHost}
      </p>
    </div>
  );
}

export function MailSetupDetail({
  client,
  pageId,
}: {
  client: MailSetupClient;
  pageId: string | null;
}) {
  const [creds, setCreds] = useState<Creds | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const copy = mailSetupCopy(client);

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

  const user = creds?.user ?? "you@lost.pink";
  const imapHost = creds?.imap.host ?? MAIL_SETUP_DEFAULTS.imapHost;
  const imapPort = creds?.imap.port ?? MAIL_SETUP_DEFAULTS.imapPort;
  const imapSec = creds?.imap.security ?? MAIL_SETUP_DEFAULTS.imapSecurity;
  const smtpHost = creds?.smtp.host ?? MAIL_SETUP_DEFAULTS.smtpHost;
  const smtpPort = creds?.smtp.port ?? MAIL_SETUP_DEFAULTS.smtpPort;
  const smtpSec = creds?.smtp.security ?? MAIL_SETUP_DEFAULTS.smtpSecurity;

  return (
    <div className="w-full max-w-lg">
      <p className="font-mono text-[12px] text-[var(--ink-muted)]">
        <a href="/setup" className="underline-offset-2 hover:underline">
          mail apps
        </a>
        <span aria-hidden> / </span>
        {copy.title}
      </p>
      <h1 className="mt-3 font-display text-[clamp(2.2rem,6vw,3.2rem)] leading-none tracking-tight text-[var(--ink)]">
        {copy.title}
      </h1>

      {!pageId ? (
        <p className="mt-4 font-mono text-[13px] text-[var(--ink-muted)]">
          buy an inbox first. then this page has the keys.
        </p>
      ) : null}

      <div className="mt-6 border border-[var(--rule)] bg-[color-mix(in_srgb,#080808_70%,transparent)] px-5 py-5 sm:px-6 sm:py-6">
        <ol className="space-y-5 font-mono text-[12px] leading-relaxed">
          {copy.steps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-[var(--rule)] text-[10px] text-[var(--ink)]">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="tracking-[0.08em] text-[var(--ink)]">
                  {step.title}
                </p>
                <p className="mt-2 text-[var(--ink-muted)]">{step.body}</p>
              </div>
            </li>
          ))}
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-[var(--rule)] text-[10px] text-[var(--ink)]">
              {copy.steps.length + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="tracking-[0.08em] text-[var(--ink)]">YOUR KEYS</p>
              <dl className="mt-2 space-y-1 text-[var(--ink-muted)]">
                <div className="grid grid-cols-[5.5rem_1fr] gap-2">
                  <dt>user</dt>
                  <dd className="text-[var(--ink)]">{user}</dd>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-2">
                  <dt>imap</dt>
                  <dd className="text-[var(--ink)]">
                    {imapHost}:{imapPort} · {imapSec}
                  </dd>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-2">
                  <dt>smtp</dt>
                  <dd className="text-[var(--ink)]">
                    {smtpHost}:{smtpPort} · {smtpSec}
                  </dd>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-2">
                  <dt>password</dt>
                  <dd className="text-[var(--ink)]">
                    {creds ? (
                      <>
                        {showPass ? creds.password : "••••••••••••"}{" "}
                        <button
                          type="button"
                          className="underline underline-offset-2"
                          onClick={() => setShowPass((v) => !v)}
                        >
                          {showPass ? "hide" : "show"}
                        </button>
                      </>
                    ) : (
                      copy.passwordNote
                    )}
                  </dd>
                </div>
              </dl>
              {error ? (
                <p className="mt-2 text-[var(--ink-muted)]">{error}</p>
              ) : null}
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}
