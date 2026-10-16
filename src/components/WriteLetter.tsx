"use client";

import { useState, useTransition } from "react";
import { HomeMark, SiteFooter, SiteFrame } from "@/components/SiteFrame";
import { displayLostEmail } from "@/lib/slug";

export function WriteLetter({
  slug,
  word,
  alias,
}: {
  slug: string;
  word: string;
  alias: string;
}) {
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/mail/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, from, subject, text }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "couldn't send that.");
        return;
      }
      setSent(true);
    });
  }

  return (
    <SiteFrame>
      <div className="flex min-h-[100dvh] flex-col">
        <HomeMark className="absolute left-4 top-4 z-20 sm:left-8 sm:top-8" />
        <div className="flex flex-1 items-center justify-center px-6 py-24">
          <form
            onSubmit={submit}
            className="quiet-tray w-full max-w-md px-5 py-5"
          >
            <p className="mark text-[11px] tracking-[0.12em] text-[var(--ink-muted)]">
              to {displayLostEmail(alias)}
            </p>
            <h1 className="mt-2 font-display text-3xl tracking-tight">
              write {word}
            </h1>
            {sent ? (
              <div className="mt-10 text-center">
                <p className="font-display text-[2.75rem] leading-none tracking-tight text-[var(--ink)]">
                  sent.
                </p>
                <p className="mark mt-3 text-[12px] tracking-[0.04em] text-[var(--ink-muted)]">
                  message.
                </p>
              </div>
            ) : (
              <>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="name"
                  className="quiet-field mt-4 w-full border border-[var(--rule)] bg-transparent px-3 py-2.5 font-mono text-[14px] outline-none"
                />
                <input
                  type="email"
                  required
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="email"
                  className="quiet-field mt-3 w-full border border-[var(--rule)] bg-transparent px-3 py-2.5 font-mono text-[14px] outline-none"
                />
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="subject"
                  className="quiet-field mt-3 w-full border border-[var(--rule)] bg-transparent px-3 py-2.5 font-mono text-[14px] outline-none"
                />
                <textarea
                  required
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="the letter"
                  rows={8}
                  className="mt-3 w-full resize-none border border-[var(--rule)] bg-transparent px-3 py-2.5 font-mono text-[14px] leading-relaxed outline-none"
                />
                {error ? (
                  <p className="mt-2 text-xs text-[var(--ink-muted)]" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px]">
                  <button
                    type="submit"
                    disabled={pending}
                    className="cursor-pointer border border-[var(--rule)] px-4 py-2 font-mono disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {pending ? "sending…" : "send"}
                  </button>
                  <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                    lands in their inbox — not a chat on your phone.
                  </p>
                </div>
              </>
            )}
          </form>
        </div>
        <SiteFooter left="write" right={<a href={`/${slug}`}>back to page</a>} />
      </div>
    </SiteFrame>
  );
}
