"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { BrandMark } from "@/components/BrandMark";
import { Generator, type GeneratorPage } from "@/components/Generator";
import { Stage } from "@/components/Stage";
import {
  ATTACH_ACCEPT,
  ATTACH_MAX_FILES,
  attachProblem,
} from "@/lib/mail-attach";
import type { Look } from "@/lib/looks";
import { stageStyle } from "@/lib/looks";
import type {
  MailDownloadAttachment,
  MailListItem,
} from "@/lib/mail-types";
import { displayLostEmail } from "@/lib/slug";
import { displayFrom, formatMailWhen } from "@/lib/voice";

type Folder = "inbox" | "sent" | "trash";
type Pane = "list" | "letter" | "compose" | "page";

type Letter = MailListItem & {
  text: string;
  html: string | null;
  attachments: MailDownloadAttachment[];
};

const FOLDERS: { id: Folder; label: string }[] = [
  { id: "inbox", label: "inbox" },
  { id: "sent", label: "sent" },
  { id: "trash", label: "trash" },
];

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
  const [refreshing, setRefreshing] = useState(false);
  const [skipped, setSkipped] = useState(0);
  const leaveThen = useRef<(() => void) | null>(null);
  const reqId = useRef(0);
  const [pending, startTransition] = useTransition();
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const composeDirty = Boolean(
    to.trim() || subject.trim() || text.trim() || files.length,
  );
  const address = displayLostEmail(page.emailLocal || page.slug);
  const stageVars = stageStyle(look) as React.CSSProperties;

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      const id = ++reqId.current;
      if (!opts?.silent) setRefreshing(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/mail/list?pageId=${encodeURIComponent(page.id)}&folder=${folder}&fast=1`,
          { cache: "no-store" },
        );
        const data = (await res.json()) as {
          items?: MailListItem[];
          partial?: boolean;
          skipped?: number;
          error?: string;
        };
        if (id !== reqId.current) return;
        if (!res.ok) {
          setError(data.error ?? "couldn't load mail.");
          setSkipped(0);
          setLoaded(true);
          return;
        }
        setItems(data.items ?? []);
        setSkipped(data.partial ? Math.max(1, data.skipped ?? 0) : 0);
        setLoaded(true);
      } catch {
        if (id !== reqId.current) return;
        setError("couldn't load mail.");
        setLoaded(true);
      } finally {
        if (id === reqId.current && !opts?.silent) setRefreshing(false);
      }
    },
    [folder, page.id],
  );

  useEffect(() => {
    if (status === "live" && pane !== "page" && pane !== "compose") {
      void load();
    }
  }, [load, pane, status]);

  useEffect(() => {
    if (status !== "live" || pane === "page" || pane === "compose") return;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      void load({ silent: true });
    };
    const id = window.setInterval(tick, 12_000);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load, pane, status]);

  useEffect(() => {
    if (sessionStorage.getItem(`lost.pink:gmail:${page.slug}`) === "1") {
      setGmailHint(false);
    }
  }, [page.slug]);

  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(null), 2400);
    return () => window.clearTimeout(id);
  }, [note]);

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
        { cache: "no-store" },
      );
      const data = (await res.json()) as Letter & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "couldn't open that letter.");
        return;
      }
      setLetter({ ...data, attachments: data.attachments ?? [] });
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
    setFiles([]);
    setLeaveAsk(false);
    setPane("compose");
  }

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    const next = [...files];
    for (const file of Array.from(list)) {
      const problem = attachProblem(file, next);
      if (problem) {
        setError(problem);
        break;
      }
      next.push(file);
      if (next.length >= ATTACH_MAX_FILES) break;
    }
    setFiles(next);
    if (fileRef.current) fileRef.current.value = "";
  }

  function send() {
    startTransition(async () => {
      setError(null);
      setNote(null);
      const body = new FormData();
      body.append("pageId", page.id);
      body.append("to", to);
      if (showCc && cc.trim()) body.append("cc", cc);
      body.append("subject", subject);
      body.append("text", text);
      if (replyTo) {
        body.append("inReplyTo", replyTo);
        body.append("references", replyTo);
      }
      for (const file of files) body.append("files", file);
      const res = await fetch("/api/mail/send", {
        method: "POST",
        body,
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
      setFiles([]);
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
      void load();
    });
  }

  function goFolder(name: Folder) {
    setFolder(name);
    setPane("list");
    setLetter(null);
    setLeaveAsk(false);
    if (name !== folder) {
      setItems([]);
      setSkipped(0);
      setLoaded(false);
    }
  }

  if (pane === "page") {
    return (
      <div className="relative min-h-[100dvh]" style={stageVars}>
        <Generator page={page} onInbox={() => setPane("list")} />
      </div>
    );
  }

  if (status !== "live") {
    return (
      <main className="relative min-h-[100dvh] overflow-hidden" style={stageVars}>
        <Stage word={page.word} look={look} alias={page.emailLocal} animate />
        <Chrome page={page} address={address} onWash />
        <p className="absolute inset-x-0 bottom-24 z-20 text-center text-[13px] text-[var(--stage-ink)]/70">
          {status === "dark"
            ? "this inbox went dark."
            : "the inbox is still being set up."}
        </p>
        <BottomNav
          onCompose={() => undefined}
          onPage={() => undefined}
          composeDisabled
          pageDisabled
        />
      </main>
    );
  }

  const empty = loaded && items.length === 0 && pane === "list";
  const showList = pane === "list" || pane === "letter";

  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden text-[var(--ink)]"
      style={stageVars}
    >
      <Atmosphere />
      <Chrome page={page} address={address} />

      <div className="absolute inset-x-0 top-[7.25rem] bottom-[4.75rem] z-10 mx-auto flex w-full max-w-5xl flex-col gap-3 overflow-hidden px-3 sm:top-[8.25rem] sm:bottom-20 sm:flex-row sm:px-6">
        {showList ? (
          <aside
            className={`${pane === "letter" ? "hidden sm:flex" : "flex"} min-h-0 w-full flex-col sm:w-80 sm:shrink-0`}
          >
            <div className="quiet-tray mb-2 flex flex-wrap items-center gap-1 p-1.5">
              {FOLDERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={folder === item.id}
                  onClick={() => goFolder(item.id)}
                  className={`tray-btn ${folder === item.id ? "is-on" : ""}`}
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void load()}
                className="tray-btn ml-auto"
              >
                {refreshing ? "refreshing…" : "refresh"}
              </button>
            </div>
            {error || note ? (
              <p
                className="mb-2 px-1 text-[11px] text-[var(--ink-muted)]"
                role={error ? "alert" : "status"}
              >
                {error ?? note}
              </p>
            ) : null}
            {skipped ? (
              <p
                className="mb-2 px-1 text-[11px] text-[var(--ink-muted)]"
                role="status"
              >
                some mail couldn&apos;t be shown.
              </p>
            ) : null}
            <div className="quiet-tray min-h-0 flex-1 overflow-y-auto px-3 py-2">
              {items.length === 0 ? (
                <div className="space-y-3 py-6 text-[13px] text-[var(--ink-muted)]">
                  <p>
                    {!loaded
                      ? "loading…"
                      : empty
                        ? "nothing in here yet."
                        : "loading…"}
                  </p>
                  {gmailHint && empty && folder === "inbox" ? (
                    <p className="flex flex-wrap gap-2">
                      <a
                        href="/setup/gmail"
                        className="tray-btn inline-flex items-center"
                      >
                        connect a mail app
                      </a>
                      <button
                        type="button"
                        className="tray-btn"
                        onClick={() => {
                          sessionStorage.setItem(
                            `lost.pink:gmail:${page.slug}`,
                            "1",
                          );
                          setGmailHint(false);
                        }}
                      >
                        not now
                      </button>
                    </p>
                  ) : null}
                </div>
              ) : (
                <ul className="space-y-0">
                  {items.map((item) => {
                    const active = letter?.uid === item.uid && pane === "letter";
                    return (
                      <li key={item.uid}>
                        <button
                          type="button"
                          onClick={() => openLetter(item)}
                          className={`block w-full cursor-pointer border-b border-[var(--ink)]/10 py-2.5 text-left ${
                            active ? "opacity-100" : "opacity-90"
                          }`}
                        >
                          <span className="flex items-baseline justify-between gap-3">
                            <span
                              className={`block min-w-0 truncate text-[13px] ${
                                item.seen
                                  ? "text-[var(--ink-muted)]"
                                  : "text-[var(--ink)]"
                              }`}
                            >
                              {displayFrom(item.from)}
                            </span>
                            <span className="mark shrink-0 text-[10px] text-[var(--ink-muted)]">
                              {formatMailWhen(item.date)}
                            </span>
                          </span>
                          <span
                            className={`block truncate text-[12px] ${
                              item.seen
                                ? "text-[var(--ink-muted)]"
                                : "text-[var(--ink)]"
                            }`}
                          >
                            {item.subject || "no subject"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
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
              {letter.attachments.length ? (
                <div className="mt-6">
                  <p className="field-label">attachments</p>
                  <ul className="mt-2 space-y-1">
                    {letter.attachments.map((attachment) => (
                      <li key={attachment.partId}>
                        <a
                          href={attachment.url}
                          download={attachment.name}
                          className="text-[12px] text-[var(--ink-muted)] underline decoration-[var(--ink)]/20 underline-offset-2"
                        >
                          {attachment.name} · {formatFileSize(attachment.size)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
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
              <div className="mt-6 flex flex-wrap gap-2">
                <button type="button" className="tray-btn" onClick={() => compose(letter)}>
                  reply
                </button>
                <button type="button" className="tray-btn" onClick={() => trash(letter)}>
                  trash
                </button>
                <button
                  type="button"
                  className="tray-btn"
                  onClick={() => setPane("list")}
                >
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
              <p className="field-label">from</p>
              <p className="mark text-[12px] text-[var(--ink)]">{address}</p>
              <label htmlFor="mail-to" className="field-label mt-4 block">
                to
              </label>
              <input
                id="mail-to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="name@example.com"
                className="quiet-field w-full border-0 bg-transparent py-2 text-[14px] outline-none"
              />
              {showCc ? (
                <>
                  <label htmlFor="mail-cc" className="field-label mt-2 block">
                    cc
                  </label>
                  <input
                    id="mail-cc"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc"
                    className="quiet-field w-full border-0 bg-transparent py-2 text-[14px] outline-none"
                  />
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="mt-2 cursor-pointer text-[11px] text-[var(--ink-muted)]"
                >
                  add cc
                </button>
              )}
              <label htmlFor="mail-subject" className="field-label mt-2 block">
                subject
              </label>
              <input
                id="mail-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="subject"
                className="quiet-field w-full border-0 bg-transparent py-2 text-[14px] outline-none"
              />
              <label htmlFor="mail-body" className="sr-only">
                message
              </label>
              <textarea
                id="mail-body"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="write your message"
                rows={12}
                className="mt-4 w-full resize-none border-0 bg-transparent text-[15px] leading-relaxed outline-none"
              />
              {files.length ? (
                <ul className="mt-3 space-y-1">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex items-baseline justify-between gap-3 text-[12px] text-[var(--ink-muted)]"
                    >
                      <span className="min-w-0 truncate">{file.name}</span>
                      <button
                        type="button"
                        className="shrink-0 cursor-pointer text-[11px] text-[var(--ink-faint)]"
                        onClick={() =>
                          setFiles((prev) => prev.filter((_, i) => i !== index))
                        }
                      >
                        remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {leaveAsk ? (
                <p className="mt-4 text-[12px] text-[var(--ink-muted)]">
                  leave this letter?
                  <button
                    type="button"
                    className="tray-btn ml-2"
                    onClick={confirmLeave}
                  >
                    leave
                  </button>
                  <button
                    type="button"
                    className="tray-btn ml-2"
                    onClick={() => {
                      leaveThen.current = null;
                      setLeaveAsk(false);
                    }}
                  >
                    stay
                  </button>
                </p>
              ) : error ? (
                <p className="mt-4 text-[12px] text-[var(--ink-muted)]" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button type="submit" disabled={pending} className="tray-btn">
                  {pending ? "sending…" : "send"}
                </button>
                <button
                  type="button"
                  className="tray-btn"
                  onClick={() => requestLeave(() => setPane("list"))}
                >
                  cancel
                </button>
                <button
                  type="button"
                  className="tray-icon"
                  aria-label="attach a file"
                  title="attach a photo, video, or file"
                  disabled={files.length >= ATTACH_MAX_FILES}
                  onClick={() => fileRef.current?.click()}
                >
                  <AttachMark />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept={ATTACH_ACCEPT}
                  multiple
                  className="sr-only"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>
            </form>
          ) : null}

          {pane === "list" ? (
            <div className="hidden min-h-[12rem] sm:flex">
              <div className="quiet-tray flex flex-1 items-center justify-center px-6 text-center text-[13px] text-[var(--ink-muted)]">
                {empty
                  ? "nothing in here yet."
                  : "open a letter from the list."}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <BottomNav
        onCompose={() => {
          if (pane === "compose") return;
          compose();
        }}
        onPage={() => requestLeave(() => setPane("page"))}
      />
    </main>
  );
}

function Chrome({
  page,
  address,
  onWash = false,
}: {
  page: { slug: string; word: string };
  address: string;
  onWash?: boolean;
}) {
  const ink = onWash ? "text-[var(--stage-ink)]" : "text-[var(--ink)]";
  const muted = onWash
    ? "text-[var(--stage-ink)]/55"
    : "text-[var(--ink-muted)]";
  return (
    <header className="absolute inset-x-0 top-0 z-20 p-3 sm:p-6">
      <div className="quiet-tray mx-auto flex w-full max-w-5xl items-end justify-between gap-3 px-3 py-2">
        <BrandMark className={`shrink-0 text-sm ${ink}`} />
        <div className="min-w-0 text-center">
          <p className="field-label">page</p>
          <p className={`font-display truncate text-base leading-tight sm:text-lg ${ink}`}>
            {page.word}
          </p>
          <p className={`mark truncate text-[10px] ${muted}`}>
            lost.pink/{page.slug}
          </p>
        </div>
        <div className="min-w-0 shrink-0 text-right">
          <p className="field-label">inbox</p>
          <p className={`mark truncate text-[11px] sm:text-[12px] ${ink}`}>
            {address}
          </p>
        </div>
      </div>
    </header>
  );
}

function BottomNav({
  onCompose,
  onPage,
  composeDisabled = false,
  pageDisabled = false,
}: {
  onCompose: () => void;
  onPage: () => void;
  composeDisabled?: boolean;
  pageDisabled?: boolean;
}) {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-4">
      <div className="quiet-tray mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-2 py-1.5 sm:justify-center sm:gap-3">
        <button
          type="button"
          disabled={composeDisabled}
          onClick={onCompose}
          className="tray-btn"
        >
          compose
        </button>
        <button
          type="button"
          disabled={pageDisabled}
          onClick={onPage}
          className="tray-btn"
        >
          page
        </button>
        <a href="/setup/gmail" className="tray-btn inline-flex items-center">
          gmail
        </a>
        <a href="/settings" className="tray-btn inline-flex items-center">
          settings
        </a>
      </div>
    </nav>
  );
}

function AttachMark() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.2 4.4 3.6 8a2.55 2.55 0 0 0 3.6 3.6l5.1-5.1a1.7 1.7 0 0 0-2.4-2.4L5 9.8" />
    </svg>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
