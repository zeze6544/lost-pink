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
    <div className="space-y-4 text-[13px] leading-relaxed text-[var(--ink-muted)]">
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
              className="ml-2 text-[var(--ink-faint)]"
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
      <ol className="list-decimal space-y-2 pl-4">
        <li>Settings → Apps → Mail → Mail Accounts → Add Account → Other.</li>
        <li>Add Mail Account. Name, you@lost.pink, and the password below.</li>
        <li>Incoming: imap host and 993. Outgoing: smtp host and 465. SSL on both.</li>
      </ol>
    );
  }
  if (device === "android") {
    return (
      <ol className="list-decimal space-y-2 pl-4">
        <li>Open Gmail → add another account → Other.</li>
        <li>Enter you@lost.pink. Choose personal IMAP.</li>
        <li>Paste the IMAP and SMTP lines below. SSL, ports 993 and 465.</li>
      </ol>
    );
  }
  return (
    <ol className="list-decimal space-y-2 pl-4">
      <li>In Apple Mail, Thunderbird, or Outlook, add an IMAP account.</li>
      <li>Username is you@lost.pink. Password is the same one as lost.pink.</li>
      <li>IMAP 993 SSL, SMTP 465 SSL, hosts below.</li>
    </ol>
  );
}
