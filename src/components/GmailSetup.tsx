"use client";

import { useEffect, useState } from "react";

type Creds = {
  user: string;
  password: string;
  imap: { host: string; port: number; security: string };
  smtp: { host: string; port: number; security: string };
};

type Device = "ios" | "android" | "desktop";

function detectDevice(): Device {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const coarse =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Macintosh/i.test(ua) && coarse) return "ios";
  return "desktop";
}

export function GmailSetup({ pageId }: { pageId: string | null }) {
  const [creds, setCreds] = useState<Creds | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");

  useEffect(() => {
    setDevice(detectDevice());
  }, []);

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
      <p className="mt-4 text-[13px] text-[var(--ink-muted)]">
        buy an inbox first. then this page has the keys.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4 text-[13px] leading-relaxed text-[var(--ink-muted)]">
      <p>
        IMAP is how another app reads this inbox. SMTP is how it sends as
        you@lost.pink. lost.pink still has its own inbox in the browser.
      </p>
      <div className="flex flex-wrap gap-2">
        {(["ios", "android", "desktop"] as const).map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={device === id}
            className={`tray-btn ${device === id ? "is-on" : ""}`}
            onClick={() => setDevice(id)}
          >
            {id === "ios" ? "iPhone" : id === "android" ? "Android" : "computer"}
          </button>
        ))}
      </div>
      <Tutorial device={device} />
      {error ? <p>{error}</p> : null}
      {creds ? (
        <dl className="space-y-1 text-[12px] text-[var(--ink)]">
          <div>address · {creds.user}</div>
          <div>
            password · {showPass ? creds.password : "••••••••"}
            <button
              type="button"
              className="ml-2 cursor-pointer text-[var(--ink-faint)]"
              onClick={() => setShowPass((v) => !v)}
            >
              {showPass ? "hide" : "show"}
            </button>
          </div>
          <div>
            IMAP · {creds.imap.host} · {creds.imap.port} · {creds.imap.security}
          </div>
          <div>
            SMTP · {creds.smtp.host} · {creds.smtp.port} · {creds.smtp.security}
          </div>
        </dl>
      ) : (
        <p>looking…</p>
      )}
    </div>
  );
}

function Tutorial({ device }: { device: Device }) {
  if (device === "ios") {
    return (
      <div className="space-y-3">
        <p className="text-[var(--ink)]">iPhone / iPad · Mail</p>
        <ol className="list-decimal space-y-2 pl-4">
          <li>Open Settings → Apps → Mail → Mail Accounts.</li>
          <li>Tap Add Account → Other → Add Mail Account.</li>
          <li>Enter the address and password below, then tap Next.</li>
          <li>
            Choose IMAP. Incoming: imap.migadu.com, port 993, SSL/TLS. Outgoing:
            smtp.migadu.com, port 465, SSL/TLS. Username is the full address.
          </li>
        </ol>
        <p className="text-[var(--ink)]">or the Gmail app</p>
        <ol className="list-decimal space-y-2 pl-4">
          <li>Open Gmail. At the top right, in the search bar, tap Profile.</li>
          <li>Tap Add another account → Other.</li>
          <li>Enter your full email address, then tap Next.</li>
          <li>Select Personal (IMAP).</li>
          <li>
            Enter the password, tap Next, then paste IMAP and SMTP from the
            block below.
          </li>
        </ol>
      </div>
    );
  }
  if (device === "android") {
    return (
      <div className="space-y-3">
        <p className="text-[var(--ink)]">Android · Gmail app</p>
        <ol className="list-decimal space-y-2 pl-4">
          <li>Open the Gmail app.</li>
          <li>At the top right, in the search bar, tap Profile.</li>
          <li>Tap Add another account → Other.</li>
          <li>Enter your full email address, then tap Next.</li>
          <li>Select Personal (IMAP).</li>
          <li>
            Enter the password, tap Next, then the IMAP host, port, and SSL/TLS
            from the block below. SMTP is smtp.migadu.com, port 465, SSL/TLS.
          </li>
        </ol>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-[var(--ink)]">computer</p>
      <p>
        Gmail in the browser no longer adds a third-party inbox. Google removed
        “Check mail from other accounts” (Settings → See all settings →
        Accounts and Import) for new setups in 2026. Use a mail app, or add
        the account in the Gmail app on a phone.
      </p>
      <p className="text-[var(--ink)]">Apple Mail on a Mac</p>
      <ol className="list-decimal space-y-2 pl-4">
        <li>Mail → Add Account → Other Mail Account…</li>
        <li>Enter the address and password below.</li>
        <li>
          Incoming Mail Server: imap.migadu.com. Outgoing: smtp.migadu.com.
          Username is the full address. IMAP 993 SSL/TLS, SMTP 465 SSL/TLS.
        </li>
      </ol>
      <p className="text-[var(--ink)]">Outlook or Thunderbird</p>
      <p>
        Add an existing IMAP account and paste the host, port, and password
        from the block below. Do not use POP.
      </p>
    </div>
  );
}
