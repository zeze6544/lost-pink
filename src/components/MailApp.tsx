"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { BrandMark } from "@/components/BrandMark";
import { Generator, type GeneratorPage } from "@/components/Generator";
import { PhraseBackdrop } from "@/components/PhraseBackdrop";
import { Stage } from "@/components/Stage";
import type { Look } from "@/lib/looks";
import { stageStyle } from "@/lib/looks";
import type { MailListItem } from "@/lib/mail-types";
import { presetForKey } from "@/lib/phrase-presets";
import { displayLostEmail } from "@/lib/slug";
import { displayFrom, formatMailWhen } from "@/lib/voice";

type Folder = "inbox" | "sent" | "trash";
type Pane = "list" | "letter" | "compose" | "page";

type Letter = MailListItem & { text: string; html: string | null };

export function MailApp({
  page,
  look,
  status,
}: {
  page: GeneratorPage & { slug: string; createdAt: string };
  look: Look;
  status: "live" | "arriving" | "dark";
}) {
  const [folder, setFolder] = useState<Folder>("inbox");
  const [pane, setPane] = useState<Pane>("list");
  const [items, setItems] = useState<MailListItem[]>([]);
  const [letter, setLetter] = useState<Letter | null>(null);
  const [images, setImages] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gmailHint, setGmailHint] = useState(true);
  const [leaveAsk, setLeaveAsk] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const leaveThen = useRef<(() => void) | null>(null);
  const [pending, startTransition] = useTransition();
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const composeDirty = Boolean(to.trim() || subject.trim() || text.trim());

  const load = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const res = await fetch(
        `/api/mail/list?pageId=${encodeURIComponent(page.id)}&folder=${folder}`,
      );
      const data = (await res.json()) as { items?: MailListItem[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "couldn't look.");
        setLoaded(true);
        return;
      }
      setItems(data.items ?? []);
      setLoaded(true);
    });
  }, [folder, page.id]);

  useEffect(() => {
    if (status === "live" && pane !== "page") load();
  }, [load, pane, status]);

  useEffect(() => {
    if (sessionStorage.getItem(`lost.pink:gmail:${page.slug}`) === "1") {
      setGmailHint(false);
    }
  }, [page.slug]);

  useEffect(() => {
    if (pane !== "compose" || !composeDirty) return;
    const onLeave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [pane, composeDirty]);

  function requestLeave(then: () => void) {
    if (pane === "compose" && composeDirty) {
      leaveThen.current = then;
      setLeaveAsk(true);
      return;
    }
    then();
  }

  function confirmLeave() {
    const then = leaveThen.current;
    leaveThen.current = null;
    setLeaveAsk(false);
    then?.();
  }

  function openLetter(item: MailListItem) {
    startTransition(async () => {
      setError(null);
      const res = await fetch(
        `/api/mail/get?pageId=${encodeURIComponent(page.id)}&folder=${folder}&uid=${item.uid}${images ? "&images=1" : ""}`,
      );
      const data = (await res.json()) as Letter & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "couldn't look.");
        return;
      }
      setLetter(data);
      setPane("letter");
    });
  }

  function compose(reply?: Letter) {
    if (reply) {
      setTo(reply.from);
      setSubject(
        reply.subject.toLowerCase().startsWith("re:")
          ? reply.subject
          : `re: ${reply.subject}`,
      );
      setReplyTo(reply.messageId);
      setText("");
    } else {
      setTo("");
      setSubject("");
      setReplyTo(null);
      setText("");
    }
    setShowCc(false);
    setCc("");
    setLeaveAsk(false);
    setPane("compose");
  }

  function send() {
    startTransition(async () => {
      setError(null);
      setNote(null);
      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: page.id,
          to,
          cc: showCc ? cc : undefined,
          subject,
          text,
          inReplyTo: replyTo,
          references: replyTo,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "couldn't send that.");
        return;
      }
      setNote("sent.");
      setTo("");
      setSubject("");
      setText("");
      setPane("list");
      setFolder("sent");
    });
  }

  function trash(item: MailListItem) {
    startTransition(async () => {
      await fetch("/api/mail/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: page.id, folder, uid: item.uid }),
      });
      setPane("list");
      setLetter(null);
      load();
    });
  }

  const stageVars = stageStyle(look) as React.CSSProperties;

  if (pane === "page") {
    return (
      <div className="relative min-h-[100dvh]" style={stageVars}>
        <Generator page={page} />
        <button
          type="button"
          onClick={() => setPane("list")}
          className="mark absolute right-4 top-4 z-30 cursor-pointer text-sm text-[var(--stage-ink)] sm:right-8 sm:top-8"
        >
          inbox
        </button>
      </div>
    );
  }

  if (status !== "live") {
    return (
      <main className="relative min-h-[100dvh] overflow-hidden" style={stageVars}>
        <Atmosphere variant="landing" />
        <PhraseBackdrop
          preset={presetForKey(page.slug)}
          variant="site"
        />
        <Stage word={page.word} look={look} alias={page.emailLocal} animate />
        <Shell
          slug={page.slug}
          address={displayLostEmail(page.emailLocal || page.slug)}
          onWash
        />
        <p className="absolute inset-x-0 bottom-24 z-20 text-center text-[13px] text-[var(--stage-ink)]/70">
          {status === "dark" ? "this inbox went dark." : "the inbox is still arriving."}
        </p>
      </main>
    );
  }

  const empty = loaded && items.length === 0 && pane === "list";

  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden text-[var(--ink)]"
      style={stageVars}
    >
      <Atmosphere variant="landing" />
      <PhraseBackdrop preset={presetForKey(page.slug)} variant="site" />
      <Shell
        slug={page.slug}
        address={displayLostEmail(page.emailLocal || page.slug)}
      />

      <div className="absolute inset-x-0 top-[7.25rem] bottom-[4.75rem] z-10 mx-auto flex w-full max-w-5xl flex-col gap-3 overflow-hidden px-3 sm:top-[8.25rem] sm:bottom-20 sm:flex-row sm:px-6">
          {pane !== "compose" ? (
            <aside
              className={`${pane === "letter" ? "hidden sm:flex" : "flex"} min-h-0 w-full flex-col sm:w-80 sm:shrink-0`}
            >
              <div className="quiet-tray mb-2 flex flex-wrap items-center gap-1 p-1.5">
                {(["inbox", "sent", "trash"] as const).map((name) => (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={folder === name}
                    onClick={() => {
                      setFolder(name);
                      setPane("list");
                      setLetter(null);
                    }}
                    className={`tray-btn ${folder === name ? "is-on" : ""}`}
                  >
                    {name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={load}
                  className="tray-btn ml-auto"
                >
                  {pending ? "refreshing…" : "refresh"}
                </button>
              </div>
              <ul className="quiet-tray min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-2 pb-6">
                {items.map((item) => {
                  const active = letter?.uid === item.uid && pane === "letter";
                  return (
                    <li key={item.uid}>
                      <button
                        type="button"
                        onClick={() => openLetter(item)}
                        className={`block w-full cursor-pointer py-1.5 text-left ${active ? "opacity-100" : ""}`}
                      >
                        <span className="flex items-baseline justify-between gap-3">
                          <span
                            className={`block min-w-0 truncate text-[13px] ${
                              item.seen ? "text-[var(--ink-muted)]" : "text-[var(--ink)]"
                            }`}
                          >
                            {displayFrom(item.from)}
                          </span>
                          <span className="shrink-0 text-[10px] tracking-wide text-[var(--ink-muted)]">
                            {formatMailWhen(item.date)}
                          </span>
                        </span>
                        <span
                          className={`block truncate text-[12px] ${
                            item.seen ? "text-[var(--ink-muted)]" : "text-[var(--ink)]"
                          }`}
                        >
                          {item.subject || "no subject"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>
          ) : null}

          <section className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            {pane === "letter" && letter ? (
              <article className="quiet-tray px-4 py-4 pb-16 sm:px-5">
                <h1 className="font-display text-3xl">{letter.subject || "no subject"}</h1>
                <p className="mt-2 text-[12px] text-[var(--ink-muted)]">
                  {displayFrom(letter.from)}
                  {formatMailWhen(letter.date) ? ` · ${formatMailWhen(letter.date)}` : ""}
                </p>
                {letter.html ? (
                  <div
                    className="mail-letter mt-6 text-[14px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: letter.html }}
                  />
                ) : (
                  <pre className="mt-6 whitespace-pre-wrap font-sans text-[14px] leading-relaxed">
                    {letter.text}
                  </pre>
                )}
                {letter.html ? (
                  <button
                    type="button"
                    className="mt-4 cursor-pointer text-[11px] text-[var(--ink-muted)]"
                    onClick={() => {
                      setImages(true);
                      openLetter(letter);
                    }}
                  >
                    {images ? "images are on." : "show images"}
                  </button>
                ) : null}
                <div className="mt-6 flex gap-4 text-[12px]">
                  <button type="button" onClick={() => compose(letter)}>
                    reply
                  </button>
                  <button type="button" onClick={() => trash(letter)}>
                    trash
                  </button>
                  <button type="button" onClick={() => setPane("list")}>
                    back
                  </button>
                </div>
              </article>
            ) : null}

            {pane === "compose" ? (
              <form
                className="quiet-tray px-4 py-4 pb-16 sm:px-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <p className="mark text-[11px] tracking-[0.12em] text-[var(--ink-muted)]">
                  from {displayLostEmail(page.emailLocal || page.slug)}
                </p>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="to"
                  className="quiet-field mt-4 w-full border-0 bg-transparent py-2 text-[14px] outline-none"
                />
                {showCc ? (
                  <input
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc"
                    className="quiet-field w-full border-0 bg-transparent py-2 text-[14px] outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="mt-2 cursor-pointer text-[11px] text-[var(--ink-muted)]"
                  >
                    more
                  </button>
                )}
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="subject"
                  className="quiet-field w-full border-0 bg-transparent py-2 text-[14px] outline-none"
                />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="the letter"
                  rows={12}
                  className="mt-4 w-full resize-none border-0 bg-transparent text-[15px] leading-relaxed outline-none"
                />
                <div className="mt-4 flex gap-4 text-[13px]">
                  <button type="submit" disabled={pending}>
                    {pending ? "sending…" : "send"}
                  </button>
                  <button
                    type="button"
                    onClick={() => requestLeave(() => setPane("list"))}
                  >
                    leave
                  </button>
                </div>
              </form>
            ) : null}

            {pane === "list" && items.length === 0 ? (
              <div className="quiet-tray flex flex-1 items-center justify-center px-6 py-8 text-center text-[13px] text-[var(--ink-muted)]">
                {!loaded ? "looking." : "nothing in here yet."}
              </div>
            ) : null}
          </section>
      </div>

      {gmailHint && empty ? (
        <p className="absolute inset-x-0 bottom-24 z-20 flex flex-wrap items-center justify-center gap-2 px-6 text-center text-[12px] text-[var(--ink-muted)]">
          <a href="/setup/gmail" className="tray-btn inline-flex items-center">
            connect a mail app
          </a>
          <button
            type="button"
            className="text-[var(--ink-faint)]"
            onClick={() => {
              sessionStorage.setItem(`lost.pink:gmail:${page.slug}`, "1");
              setGmailHint(false);
            }}
          >
            later
          </button>
        </p>
      ) : null}

      {leaveAsk ? (
        <p className="absolute inset-x-0 bottom-20 z-30 text-center text-[12px] text-[var(--ink-muted)]">
          leave this letter?
          <button type="button" className="ml-3 text-[var(--ink)]" onClick={confirmLeave}>
            leave
          </button>
          <button
            type="button"
            className="ml-3"
            onClick={() => {
              leaveThen.current = null;
              setLeaveAsk(false);
            }}
          >
            stay
          </button>
        </p>
      ) : error || note ? (
        <p className="absolute inset-x-0 bottom-20 z-30 text-center text-[12px] text-[var(--ink-muted)]">
          {error ?? note}
        </p>
      ) : null}

      <nav className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-4">
        <div className="quiet-tray mx-auto flex w-full max-w-5xl items-center justify-center gap-4 px-2 py-1.5 sm:gap-5">
          <button
            type="button"
            onClick={() => {
              if (pane === "compose") return;
              compose();
            }}
            className="cursor-pointer text-[12px] tracking-wide text-[var(--ink)]/80"
          >
            write
          </button>
          <button
            type="button"
            onClick={() => requestLeave(() => setPane("page"))}
            className="cursor-pointer text-[12px] tracking-wide text-[var(--ink)]/80"
          >
            the page
          </button>
          <a href="/setup/gmail" className="text-[12px] tracking-wide text-[var(--ink)]/80">
            mail app
          </a>
          <a href="/you" className="text-[12px] tracking-wide text-[var(--ink)]/80">
            yours
          </a>
        </div>
      </nav>
    </main>
  );
}

function Shell({
  slug,
  address,
  onWash = false,
}: {
  slug: string;
  address: string;
  onWash?: boolean;
}) {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-baseline justify-between gap-4 p-4 sm:p-8">
      <BrandMark
        className={`text-sm ${
          onWash ? "text-[var(--stage-ink)]/80" : "text-[var(--ink)]/85"
        }`}
      />
      <p
        className={`font-display text-lg ${
          onWash ? "text-[var(--stage-ink)]" : "text-[var(--ink)]"
        }`}
      >
        {slug}
      </p>
      <p
        className={`hidden text-[11px] tracking-[0.12em] sm:block ${
          onWash ? "text-[var(--stage-ink)]/55" : "text-[var(--ink-muted)]"
        }`}
      >
        {address}
      </p>
    </header>
  );
}
