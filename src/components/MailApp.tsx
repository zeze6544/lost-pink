"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Generator, type GeneratorPage } from "@/components/Generator";
import { Stage } from "@/components/Stage";
import type { Look } from "@/lib/looks";
import { stageStyle } from "@/lib/looks";
import type { MailListItem } from "@/lib/mail-types";
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
  status: "live" | "arriving" | "dark" | "failed";
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
  const letterReq = useRef(0);
  const [query, setQuery] = useState("");
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const composeDirty = Boolean(to.trim() || subject.trim() || text.trim());

  const draftKey = `lost.pink:draft:${page.id}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        to?: string;
        cc?: string;
        subject?: string;
        text?: string;
        showCc?: boolean;
      };
      if (draft.to || draft.subject || draft.text) {
        setTo(draft.to ?? "");
        setCc(draft.cc ?? "");
        setSubject(draft.subject ?? "");
        setText(draft.text ?? "");
        setShowCc(Boolean(draft.showCc || draft.cc));
        setDraftNote("restored a draft.");
      }
    } catch {
      // ignore bad drafts
    }
    // only on mount / page change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id]);

  useEffect(() => {
    if (pane !== "compose") return;
    const t = window.setTimeout(() => {
      const payload = { to, cc, subject, text, showCc };
      if (!to.trim() && !subject.trim() && !text.trim()) {
        localStorage.removeItem(draftKey);
        return;
      }
      localStorage.setItem(draftKey, JSON.stringify(payload));
    }, 400);
    return () => window.clearTimeout(t);
  }, [pane, to, cc, subject, text, showCc, draftKey]);

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

  function openLetter(item: MailListItem, withImages = images) {
    const req = ++letterReq.current;
    startTransition(async () => {
      setError(null);
      if (withImages) setImages(true);
      const res = await fetch(
        `/api/mail/get?pageId=${encodeURIComponent(page.id)}&folder=${folder}&uid=${item.uid}${withImages ? "&images=1" : ""}`,
      );
      const data = (await res.json()) as Letter & { error?: string };
      if (req !== letterReq.current) return;
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
      localStorage.removeItem(draftKey);
      setDraftNote(null);
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
          className="absolute right-4 top-4 z-30 text-[12px] text-[var(--stage-ink)]/55 sm:right-8 sm:top-8"
        >
          mail
        </button>
      </div>
    );
  }

  if (status !== "live") {
    return (
      <main className="relative min-h-[100dvh] overflow-hidden" style={stageVars}>
        <Stage word={page.word} look={look} alias={page.emailLocal} animate />
        <Shell
          slug={page.slug}
          address={displayLostEmail(page.emailLocal || page.slug)}
          onWash
        />
        <div className="absolute inset-x-0 bottom-24 z-20 px-6 text-center">
          <p className="text-[13px] text-[var(--stage-ink)]/70">
            {status === "dark"
              ? "this inbox went dark."
              : status === "failed"
                ? "couldn't open the inbox."
                : "the inbox is still arriving."}
          </p>
          {status === "failed" ? (
            <button
              type="button"
              className="mt-3 text-[12px] text-[var(--stage-ink)] underline-offset-2 hover:underline"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  setError(null);
                  const res = await fetch("/api/mailbox/retry", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pageId: page.id }),
                  });
                  const data = (await res.json()) as { error?: string };
                  if (!res.ok) {
                    setError(data.error ?? "couldn't try again.");
                    return;
                  }
                  window.location.reload();
                });
              }}
            >
              {pending ? "trying…" : "try again"}
            </button>
          ) : null}
          {error ? (
            <p className="mt-2 text-[12px] text-[var(--stage-ink)]/55" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </main>
    );
  }


  const q = query.trim().toLowerCase();
  const filteredItems = q
    ? items.filter((item) => {
        const hay = `${item.from} ${item.subject}`.toLowerCase();
        return hay.includes(q);
      })
    : items;
  const empty = loaded && filteredItems.length === 0 && pane === "list";

  return (
    <main
      className="site-frame relative min-h-[100dvh] overflow-hidden text-[var(--ink)]"
      style={stageVars}
    >
      <div className="site-wash pointer-events-none absolute inset-0" aria-hidden />
      <div className="site-depth pointer-events-none absolute inset-0" aria-hidden />
      <div className="site-horizon pointer-events-none absolute inset-0" aria-hidden />
      <div className="site-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="site-grain pointer-events-none absolute inset-0" aria-hidden />
      <Shell
        slug={page.slug}
        address={displayLostEmail(page.emailLocal || page.slug)}
      />

      <div className="absolute inset-x-0 top-16 bottom-[4.75rem] z-10 mx-auto flex w-full max-w-5xl flex-col px-4 sm:bottom-16 sm:flex-row sm:px-8">
          {pane !== "compose" ? (
            <aside
              className={`${pane === "letter" ? "hidden sm:flex" : "flex"} min-h-0 w-full flex-col sm:w-72 sm:shrink-0`}
            >
              <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] tracking-wide">
                {(["inbox", "sent", "trash"] as const).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setFolder(name);
                      setPane("list");
                      setLetter(null);
                    }}
                    className={`min-h-11 sm:min-h-0 ${
                      folder === name ? "text-[var(--ink)]" : "text-[var(--ink-muted)]"
                    }`}
                  >
                    {name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={load}
                  className="ml-auto min-h-11 text-[var(--ink-muted)] sm:min-h-0"
                >
                  {pending ? "looking" : "look"}
                </button>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="find"
                className="mb-3 w-full border-0 border-b border-[var(--ink)]/15 bg-transparent py-1.5 text-[12px] outline-none placeholder:text-[var(--ink-muted)]"
              />
              <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-6">
                {filteredItems.map((item) => {
                  const active = letter?.uid === item.uid && pane === "letter";
                  return (
                    <li key={item.uid}>
                      <button
                        type="button"
                        onClick={() => openLetter(item)}
                        className={`block w-full text-left ${active ? "opacity-100" : ""}`}
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

          <section className="min-h-0 min-w-0 flex-1 overflow-y-auto sm:pl-10">
            {pane === "letter" && letter ? (
              <article className="pb-16">
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
                    className="mt-4 text-[11px] text-[var(--ink-muted)]"
                    onClick={() => {
                      openLetter(letter, true);
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
                className="pb-16"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <p className="text-[11px] tracking-[0.12em] text-[var(--ink-muted)]">
                  from {displayLostEmail(page.emailLocal || page.slug)}
                  {draftNote ? ` · ${draftNote}` : ""}
                </p>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="to"
                  className="mt-4 w-full border-0 border-b border-[var(--ink)]/18 bg-transparent py-2 text-[14px] outline-none"
                />
                {showCc ? (
                  <input
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc"
                    className="w-full border-0 border-b border-[var(--ink)]/18 bg-transparent py-2 text-[14px] outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="mt-2 text-[11px] text-[var(--ink-muted)]"
                  >
                    more
                  </button>
                )}
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="subject"
                  className="w-full border-0 border-b border-[var(--ink)]/18 bg-transparent py-2 text-[14px] outline-none"
                />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      send();
                    }
                  }}
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

            {pane === "list" ? (
              <p className="pt-8 text-[13px] text-[var(--ink-muted)]">
                {!loaded
                  ? "looking."
                  : items.length === 0
                    ? "nothing in here yet. write one."
                    : "a letter, when you want it."}
              </p>
            ) : null}
          </section>
      </div>

      {gmailHint && empty ? (
        <p className="absolute inset-x-0 bottom-24 z-20 px-6 text-center text-[12px] text-[var(--ink-muted)]">
          <a href="/setup/gmail" className="underline-offset-2 hover:underline">
            put it in gmail
          </a>
          <button
            type="button"
            className="ml-3 text-[var(--ink-faint)]"
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

      <nav
        className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-5 p-4 text-[12px] tracking-wide text-[var(--ink)]/70"
      >
        <button
          type="button"
          onClick={() => {
            if (pane === "compose") return;
            compose();
          }}
        >
          write
        </button>
        <button
          type="button"
          onClick={() => requestLeave(() => setPane("page"))}
        >
          the page
        </button>
        <a href="/setup/gmail">gmail</a>
        <a href="/you">yours</a>
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
      <a
        href="/"
        className={`mark text-sm ${
          onWash ? "text-[var(--stage-ink)]/80" : "text-[var(--ink)]/85"
        }`}
      >
        lost.pink
      </a>
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
