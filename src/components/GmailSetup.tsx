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
          setError(data.error ?? "come back first.");
          return;
        }
        setCreds(data);
      })
      .catch(() => setError("couldn't look."));
  }, [pageId]);

  if (!pageId) {
    return (
      <p className="mt-4 text-[13px] text-[var(--ink-muted)]">
        buy an inbox first. then this page has the keys.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-[var(--ink-muted)]">
      <p>
        IMAP is how another app, like Gmail, reads this inbox. SMTP is how it
        sends as you@lost.pink. lost.pink still keeps its own reading room.
      </p>
      <ol className="list-decimal space-y-2 pl-4">
        <li>In Gmail, open Settings → See all settings → Accounts and Import.</li>
        <li>Check mail from other accounts → Add a mail account.</li>
        <li>Enter the address below. Choose IMAP. Paste the host, port, and password.</li>
        <li>To send as this address, add it under Send mail as, with the SMTP line.</li>
      </ol>
      {error ? <p>{error}</p> : null}
      {creds ? (
        <dl className="space-y-1 text-[12px] text-[var(--ink)]">
          <div>address · {creds.user}</div>
          <div>
            password ·{" "}
            {showPass ? creds.password : "••••••••"}
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
