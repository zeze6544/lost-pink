"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { SiteFooter } from "@/components/SiteFrame";
import { Stage } from "@/components/Stage";
import {
  DEFAULT_LOOK,
  FONTS,
  FONT_META,
  LINE_MAX,
  MOTIFS,
  PALETTE_COLORS,
  PALETTE_LABELS,
  PALETTES,
  TITLE_MAX,
  TREATMENTS,
  defaultLookForSlug,
  stageStyle,
  type FontId,
  type Look,
  type Motif,
  type Palette,
  type Treatment,
} from "@/lib/looks";
import { displayLostEmail, normalizeEmailLocal } from "@/lib/slug";
import { type PublicMailboxLabel } from "@/lib/mailbox-status";
import type { OwnerMailboxView } from "@/lib/mailbox-view";
import { publicPagePath } from "@/lib/site";
import {
  JUST_LEFT_KEY,
  holdCountdownCopy,
  keepLabel,
  shareOrCopy,
} from "@/lib/voice";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type GeneratorPage = {
  id: string;
  slug: string;
  word: string;
  line: string | null;
  look: Look;
  bgUrl: string | null;
  tokenUrl: string | null;
  emailLocal: string | null;
  kept: boolean;
  mailboxStatus?: PublicMailboxLabel;
  mailboxExpiresAt?: string | null;
  mailbox?: OwnerMailboxView | null;
};

type Picked = {
  palette: boolean;
  treatment: boolean;
  motif: boolean;
  font: boolean;
};

type Panel = "title" | "style" | "photo" | "line" | null;
type StylePane = "color" | "type" | "font" | "motif";

export function Generator({
  page,
  onInbox,
}: {
  page?: GeneratorPage;
  onInbox?: () => void;
}) {
  const editing = Boolean(page);
  const router = useRouter();
  const trayRef = useRef<HTMLDivElement>(null);
  const aliasRef = useRef<HTMLInputElement>(null);
  const [trayH, setTrayH] = useState(88);
  const [title, setTitle] = useState(page?.word ?? "");
  const [line, setLine] = useState(page?.line ?? "");
  const [emailLocal, setEmailLocal] = useState(page?.emailLocal ?? "");
  const [look, setLook] = useState<Look>(page?.look ?? DEFAULT_LOOK);
  const [panel, setPanel] = useState<Panel>("title");
  const [stylePane, setStylePane] = useState<StylePane>("color");
  const [picked, setPicked] = useState<Picked>({
    palette: Boolean(page),
    treatment: Boolean(page),
    motif: Boolean(page),
    font: Boolean(page),
  });
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [tokenFile, setTokenFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(page?.bgUrl ?? null);
  const [tokenPreview, setTokenPreview] = useState<string | null>(
    page?.tokenUrl ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [nameConflict, setNameConflict] = useState<ReactNode>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const mailboxStatus = page?.mailboxStatus ?? "none";
  const mailbox = page?.mailbox ?? null;
  const aliasLocked = Boolean(
    mailbox &&
      (mailbox.status === "live" ||
        mailbox.status === "provisioning" ||
        mailbox.status === "failed" ||
        mailbox.status === "dark" ||
        (mailbox.status === "checkout_started" && !mailbox.checkoutAbandoned)),
  );
  const alias = normalizeEmailLocal(emailLocal);
  const slug = page?.slug ?? "";
  const handle = slug || alias;
  const display = title.trim() || slug || "you";

  useEffect(() => {
    const hashed = defaultLookForSlug(slug || "you");
    setLook((prev) => ({
      palette: picked.palette ? prev.palette : hashed.palette,
      treatment: picked.treatment ? prev.treatment : hashed.treatment,
      motif: picked.motif ? prev.motif : hashed.motif,
      font: picked.font ? prev.font : hashed.font,
    }));
  }, [slug, picked.palette, picked.treatment, picked.motif, picked.font]);

  useEffect(() => {
    return () => {
      if (bgPreview) URL.revokeObjectURL(bgPreview);
    };
  }, [bgPreview]);

  useEffect(() => {
    return () => {
      if (tokenPreview) URL.revokeObjectURL(tokenPreview);
    };
  }, [tokenPreview]);

  useEffect(() => {
    const el = trayRef.current;
    if (!el) return;
    const apply = () => setTrayH(el.offsetHeight + 28);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [panel, stylePane, error, nameConflict, bgFile, tokenFile]);

  useEffect(() => {
    if (!editing || !page) {
      setNameConflict(null);
      return;
    }
    const inboxChanged =
      Boolean(alias) &&
      alias !== normalizeEmailLocal(page.emailLocal ?? "") &&
      !aliasLocked;
    if (!inboxChanged) {
      setNameConflict(null);
      return;
    }
    const t = window.setTimeout(async () => {
      const res = await fetch(
        `/api/alias/available?q=${encodeURIComponent(alias)}&except=${encodeURIComponent(page.id)}`,
      );
      const data = (await res.json()) as {
        status?: string;
        slug?: string;
        until?: string | null;
      };
      if (data.status === "taken") {
        const viewSlug = data.slug || alias;
        setNameConflict(
          <>
            that inbox name is taken.{" "}
            <a
              href={`/${viewSlug}`}
              className="cursor-pointer underline underline-offset-2"
            >
              view their page
            </a>
          </>,
        );
        return;
      }
      if (data.status === "held") {
        setNameConflict(
          data.until
            ? holdCountdownCopy(data.until)
            : "someone is holding that name.",
        );
        return;
      }
      setNameConflict(null);
    }, 280);
    return () => window.clearTimeout(t);
  }, [alias, aliasLocked, editing, page]);

  function togglePanel(next: Exclude<Panel, null>) {
    setPanel((prev) => (prev === next ? null : next));
  }

  function pickPalette(palette: Palette) {
    setPicked((p) => ({ ...p, palette: true }));
    setLook((l) => ({ ...l, palette }));
  }

  function pickTreatment(treatment: Treatment) {
    setPicked((p) => ({ ...p, treatment: true }));
    setLook((l) => ({ ...l, treatment }));
  }

  function pickMotif(motif: Motif) {
    setPicked((p) => ({ ...p, motif: true }));
    setLook((l) => ({ ...l, motif }));
  }

  function pickFont(font: FontId) {
    setPicked((p) => ({ ...p, font: true }));
    setLook((l) => ({ ...l, font }));
  }

  function onFile(kind: "bg" | "token", file: File | null) {
    setError(null);
    if (!file) {
      if (kind === "bg") {
        if (bgPreview) URL.revokeObjectURL(bgPreview);
        setBgFile(null);
        setBgPreview(null);
      } else {
        if (tokenPreview) URL.revokeObjectURL(tokenPreview);
        setTokenFile(null);
        setTokenPreview(null);
      }
      return;
    }
    const problem = validateImageFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    const url = URL.createObjectURL(file);
    if (kind === "bg") {
      if (bgPreview) URL.revokeObjectURL(bgPreview);
      setBgFile(file);
      setBgPreview(url);
    } else {
      if (tokenPreview) URL.revokeObjectURL(tokenPreview);
      setTokenFile(file);
      setTokenPreview(url);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const bg_url = bgFile
          ? await uploadImage(bgFile)
          : bgPreview && !bgPreview.startsWith("blob:")
            ? bgPreview
            : null;
        const token_url = tokenFile
          ? await uploadImage(tokenFile)
          : tokenPreview && !tokenPreview.startsWith("blob:")
            ? tokenPreview
            : null;
        const alias = normalizeEmailLocal(emailLocal);
        const payload = {
          title,
          word: title,
          line,
          palette: look.palette,
          treatment: look.treatment,
          motif: look.motif,
          font: look.font,
          bg_url,
          token_url,
          email_local: alias || null,
        };
        const res = await fetch(
          editing && page ? `/api/pages/${page.id}` : "/api/publish",
          {
            method: editing ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const data = (await res.json()) as { slug?: string; error?: string };
        if (!res.ok) {
          setError(data.error ?? (editing ? "couldn't save." : "couldn't leave it."));
          return;
        }
        if (data.slug) {
          if (!editing) sessionStorage.setItem(JUST_LEFT_KEY, data.slug);
          if (editing) {
            if (data.slug !== slug) {
              router.replace(`/${data.slug}`);
              return;
            }
            router.refresh();
            return;
          }
          router.push(`/${data.slug}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "couldn't leave it.");
      }
    });
  }

  async function share() {
    const url = `${window.location.origin}/${handle || page?.slug || ""}`;
    const result = await shareOrCopy(url, `lost.pink/${handle}`);
    if (result === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }

  function keepIt() {
    if (!page) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: page.id }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "couldn't keep it.");
        return;
      }
      window.location.href = data.url;
    });
  }

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden"
      style={
        {
          "--tray-h": `${trayH}px`,
          ...stageStyle(look),
        } as React.CSSProperties
      }
    >
      <Stage
        word={display}
        look={look}
        line={line.trim() || null}
        alias={editing ? null : alias || null}
        writeHref={
          mailboxStatus === "open" && handle ? `/${handle}/write` : null
        }
        bgUrl={bgPreview}
        tokenUrl={tokenPreview}
        animate
      />
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-baseline justify-between gap-4 p-4 sm:p-8">
        <BrandMark className="pointer-events-auto text-sm text-[var(--stage-ink)] sm:text-[15px]" />
        {onInbox ? (
          <button
            type="button"
            onClick={onInbox}
            className="pointer-events-auto mark text-sm text-[var(--stage-ink)] sm:text-[15px]"
          >
            inbox
          </button>
        ) : editing ? null : (
          <p className="mark hidden max-w-[14rem] text-right text-[10px] leading-relaxed text-[var(--stage-ink)]/50 sm:block">
            an @lost.pink inbox
          </p>
        )}
      </header>

      <div className="absolute inset-x-0 bottom-0 z-20 pb-[var(--site-footer-h,2.75rem)] p-3 sm:p-6">
        <div ref={trayRef} className="mx-auto w-full max-w-md">
          <form onSubmit={onSubmit} className="quiet-tray px-3 py-2.5">
            {panel === "title" ? (
              <div className="mb-2 space-y-2">
                <div>
                  <label htmlFor="title" className="field-label">
                    title
                  </label>
                  <input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                    placeholder="hate this song"
                    autoComplete="off"
                    autoFocus
                    maxLength={TITLE_MAX}
                    className="quiet-field w-full border-0 bg-transparent pb-1 text-xl text-[var(--ink)] outline-none"
                  />
                  {handle ? (
                    <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                      lost.pink/{handle}
                      {editing ? (
                        <span className="mt-0.5 block text-[var(--ink-faint)]">
                          title can be several words. the url stays this handle.
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                  {editing && alias ? (
                    <p className="mt-2 mark text-[12px] text-[var(--ink)]">
                      {displayLostEmail(alias)}
                    </p>
                  ) : null}
                </div>
                {!editing ? (
                  <div>
                    <label htmlFor="alias" className="field-label">
                      inbox
                    </label>
                    <input
                      id="alias"
                      ref={aliasRef}
                      value={emailLocal}
                      onChange={(e) => setEmailLocal(e.target.value.slice(0, 24))}
                      placeholder="@"
                      autoComplete="off"
                      className="quiet-field mt-0.5 w-full border-0 bg-transparent text-[12px] text-[var(--ink)]/80 outline-none placeholder:text-[var(--ink-faint)]"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {panel === "line" ? (
              <div className="mb-2">
                <label htmlFor="line" className="sr-only">
                  optional line
                </label>
                <input
                  id="line"
                  value={line}
                  onChange={(e) => setLine(e.target.value.slice(0, LINE_MAX))}
                  placeholder="one optional line"
                  autoComplete="off"
                  maxLength={LINE_MAX}
                  autoFocus
                  className="w-full border-0 bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
                />
              </div>
            ) : null}

            {panel === "style" ? (
              <div className="mb-2">
                <div className="mb-2 flex gap-1">
                  {(["color", "type", "font", "motif"] as const).map((pane) => (
                    <button
                      key={pane}
                      type="button"
                      onClick={() => setStylePane(pane)}
                      className={`cursor-pointer px-2 py-0.5 text-[11px] tracking-wide ${
                        stylePane === pane
                          ? "text-[var(--ink)]"
                          : "text-[var(--ink-faint)]"
                      }`}
                    >
                      {pane}
                    </button>
                  ))}
                </div>
                {stylePane === "color" ? (
                  <div className="grid grid-cols-4 gap-2 px-1 sm:grid-cols-6">
                    {PALETTES.map((palette) => (
                      <button
                        key={palette}
                        type="button"
                        title={PALETTE_LABELS[palette]}
                        aria-label={PALETTE_LABELS[palette]}
                        aria-pressed={look.palette === palette}
                        onClick={() => pickPalette(palette)}
                        className="flex cursor-pointer flex-col items-center gap-1"
                      >
                        <span
                          className={`h-7 w-7 border transition ${
                            look.palette === palette
                              ? "border-[var(--ink)]"
                              : "border-[var(--ink)]/20"
                          }`}
                          style={{ background: PALETTE_COLORS[palette].swatch }}
                        />
                        <span
                          className={`text-[10px] tracking-wide ${
                            look.palette === palette
                              ? "text-[var(--ink)]"
                              : "text-[var(--ink-faint)]"
                          }`}
                        >
                          {PALETTE_LABELS[palette]}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
                {stylePane === "type" ? (
                  <div className="flex gap-3 px-1">
                    {TREATMENTS.map((treatment) => (
                      <button
                        key={treatment}
                        type="button"
                        aria-pressed={look.treatment === treatment}
                        onClick={() => pickTreatment(treatment)}
                      className={`py-1 text-xs tracking-wide cursor-pointer ${
                          look.treatment === treatment
                            ? "text-[var(--ink)]"
                            : "text-[var(--ink-faint)]"
                        }`}
                      >
                        {treatment === "display"
                          ? "display"
                          : treatment === "whisper"
                            ? "whisper"
                            : "SHOUT"}
                      </button>
                    ))}
                  </div>
                ) : null}
                {stylePane === "font" ? (
                  <div className="hidden grid-cols-4 gap-x-2 gap-y-1 sm:grid">
                    {FONTS.map((font) => (
                      <button
                        key={font}
                        type="button"
                        aria-pressed={look.font === font}
                        onClick={() => pickFont(font)}
                        className={`cursor-pointer py-1 text-left text-[11px] leading-tight ${
                          look.font === font
                            ? "text-[var(--ink)]"
                            : "text-[var(--ink-faint)]"
                        }`}
                        style={{
                          fontFamily: `var(${FONT_META[font].cssVar}), Georgia, serif`,
                        }}
                      >
                        {FONT_META[font].label}
                      </button>
                    ))}
                  </div>
                ) : null}
                {stylePane === "font" ? (
                  <div className="hide-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto sm:hidden">
                    {FONTS.map((font) => (
                      <button
                        key={font}
                        type="button"
                        aria-pressed={look.font === font}
                        onClick={() => pickFont(font)}
                        className={`snap-start shrink-0 cursor-pointer py-1 text-[12px] ${
                          look.font === font
                            ? "text-[var(--ink)]"
                            : "text-[var(--ink-faint)]"
                        }`}
                        style={{
                          fontFamily: `var(${FONT_META[font].cssVar}), Georgia, serif`,
                        }}
                      >
                        {FONT_META[font].label}
                      </button>
                    ))}
                  </div>
                ) : null}
                {stylePane === "motif" ? (
                  <div className="flex gap-3 px-1">
                    {MOTIFS.map((motif) => (
                      <button
                        key={motif}
                        type="button"
                        aria-pressed={look.motif === motif}
                        onClick={() => pickMotif(motif)}
                      className={`py-1 text-xs tracking-wide cursor-pointer ${
                          look.motif === motif
                            ? "text-[var(--ink)]"
                            : "text-[var(--ink-faint)]"
                        }`}
                      >
                        {motif}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {panel === "photo" ? (
              <div className="mb-2 flex gap-4 px-1">
                <PhotoPick
                  label="background"
                  file={bgFile}
                  preview={bgPreview}
                  onChange={(file) => onFile("bg", file)}
                />
                <PhotoPick
                  label="profile picture"
                  file={tokenFile}
                  preview={tokenPreview}
                  onChange={(file) => onFile("token", file)}
                />
              </div>
            ) : null}

            {nameConflict ? (
              <p className="mb-2 text-xs text-[var(--ink-muted)]" role="status">
                {nameConflict}
              </p>
            ) : null}
            {error ? (
              <p className="mb-2 text-xs text-[var(--ink-muted)]" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex items-center gap-0.5">
              <TrayTab
                active={panel === "title"}
                onClick={() => togglePanel("title")}
              >
                title
              </TrayTab>
              <TrayTab
                active={panel === "style"}
                onClick={() => togglePanel("style")}
              >
                style
              </TrayTab>
              <TrayTab
                active={panel === "photo"}
                onClick={() => togglePanel("photo")}
              >
                photo
              </TrayTab>
              <TrayTab
                active={panel === "line"}
                onClick={() => togglePanel("line")}
              >
                line
              </TrayTab>
              <button
                type="submit"
                disabled={
                  pending || !title.trim() || Boolean(nameConflict)
                }
                className="ml-auto min-h-9 cursor-pointer px-2.5 py-1 text-[13px] text-[var(--ink)] transition enabled:hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {pending
                  ? editing
                    ? "saving…"
                    : "leaving…"
                  : editing
                    ? "save it here"
                    : "leave it here"}
              </button>
            </div>
            {editing && handle ? (
              <div className="mt-2 flex items-center justify-between gap-3">
                {page && !page.kept ? (
                  <button
                    type="button"
                    className="cursor-pointer text-[11px] text-[var(--ink-muted)]"
                    onClick={keepIt}
                    disabled={pending}
                  >
                    {keepLabel(display)}
                  </button>
                ) : (
                  <span />
                )}
                <a href={publicPagePath(handle)} className="tray-btn inline-flex items-center">
                  view live page
                </a>
              </div>
            ) : null}
          </form>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20">
        <SiteFooter
          left={
            editing ? (
              <a href="/settings">settings</a>
            ) : (
              <a href="/come">log in</a>
            )
          }
          center={
            <>
              <a href="/support">support</a>
              <span aria-hidden> · </span>
              <a href="/privacy">privacy</a>
              <span aria-hidden> · </span>
              <a href="/terms">terms</a>
            </>
          }
          right={
            editing ? (
              <button
                type="button"
                className="cursor-pointer"
                aria-live="polite"
                onClick={() => void share()}
              >
                {copied ? "copied" : "share"}
              </button>
            ) : (
              <span>an inbox you keep</span>
            )
          }
        />
      </div>
    </div>
  );
}

function TrayTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 cursor-pointer px-2 py-1 text-[12px] tracking-wide ${
        active ? "text-[var(--ink)]" : "text-[var(--ink-faint)]"
      }`}
    >
      {children}
    </button>
  );
}

function PhotoPick({
  label,
  file,
  preview,
  onChange,
}: {
  label: string;
  file: File | null;
  preview: string | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--ink)]">
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt=""
              className="h-8 w-6 rounded-[2px] object-cover"
            />
            <span>replace</span>
          </>
        ) : (
          <span>{label}</span>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
      {preview || file ? (
        <button
          type="button"
          className="cursor-pointer text-[11px] text-[var(--ink-faint)]"
          onClick={() => onChange(null)}
        >
          remove
        </button>
      ) : null}
    </div>
  );
}

function validateImageFile(file: File): string | null {
  if (file.size > MAX_IMAGE_BYTES) return "Each photo must be under 2MB.";
  const typeOk = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
  const nameOk = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!typeOk && !nameOk) return "jpeg, png, or webp only.";
  if (/\.(svg|gif)$/i.test(file.name)) return "No SVG or GIF.";
  return null;
}

async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "couldn't add that photo.");
  }
  return data.url;
}
