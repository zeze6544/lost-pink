"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PinkStage } from "@/components/PinkStage";
import {
  DEFAULT_LOOK,
  FONTS,
  FONT_META,
  LINE_MAX,
  MOTIFS,
  PALETTE_COLORS,
  PALETTES,
  TREATMENTS,
  defaultLookForSlug,
  type FontId,
  type Look,
  type Motif,
  type Palette,
  type Treatment,
} from "@/lib/looks";
import { displayLostEmail, normalizeEmailLocal, normalizeWord } from "@/lib/slug";
import { JUST_LEFT_KEY, keepLabel, shareOrCopy } from "@/lib/voice";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type GeneratorPage = {
  id: string;
  word: string;
  line: string | null;
  look: Look;
  bgUrl: string | null;
  tokenUrl: string | null;
  emailLocal: string | null;
  kept: boolean;
};

type Picked = {
  palette: boolean;
  treatment: boolean;
  motif: boolean;
  font: boolean;
};

type Panel = "word" | "style" | "photo" | "line" | null;
type StylePane = "color" | "type" | "font" | "motif";

export function Generator({ page }: { page?: GeneratorPage }) {
  const editing = Boolean(page);
  const router = useRouter();
  const trayRef = useRef<HTMLDivElement>(null);
  const [trayH, setTrayH] = useState(88);
  const [raw, setRaw] = useState(page?.word ?? "");
  const [line, setLine] = useState(page?.line ?? "");
  const [emailLocal, setEmailLocal] = useState(page?.emailLocal ?? "");
  const [look, setLook] = useState<Look>(page?.look ?? DEFAULT_LOOK);
  const [panel, setPanel] = useState<Panel>("word");
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
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const slug = useMemo(() => normalizeWord(raw), [raw]);
  const display = slug || "you";

  useEffect(() => {
    const hashed = defaultLookForSlug(slug);
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
  }, [panel, stylePane, error, bgFile, tokenFile]);

  function togglePanel(next: Exclude<Panel, null>) {
    setPanel((prev) => (prev === next ? null : next));
  }

  function pickPalette(palette: Palette) {
    setPicked((p) => ({ ...p, palette: true }));
    setLook((l) => ({ ...l, palette }));
    setPanel(null);
  }

  function pickTreatment(treatment: Treatment) {
    setPicked((p) => ({ ...p, treatment: true }));
    setLook((l) => ({ ...l, treatment }));
    setPanel(null);
  }

  function pickMotif(motif: Motif) {
    setPicked((p) => ({ ...p, motif: true }));
    setLook((l) => ({ ...l, motif }));
    setPanel(null);
  }

  function pickFont(font: FontId) {
    setPicked((p) => ({ ...p, font: true }));
    setLook((l) => ({ ...l, font }));
    setPanel(null);
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
          word: raw,
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
          setError(data.error ?? (editing ? "couldn't tend it." : "couldn't leave it."));
          return;
        }
        if (data.slug) {
          if (!editing) sessionStorage.setItem(JUST_LEFT_KEY, data.slug);
          if (editing && data.slug !== slug) {
            router.replace(`/${data.slug}`);
            return;
          }
          router.push(`/${data.slug}`);
          if (editing) router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "couldn't leave it.");
      }
    });
  }

  async function share() {
    const url = `${window.location.origin}/${slug || page?.word || ""}`;
    const result = await shareOrCopy(url, `lost.pink/${slug}`);
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
      style={{ ["--tray-h" as string]: `${trayH}px` }}
    >
      <PinkStage
        word={display}
        look={look}
        line={line.trim() || null}
        alias={normalizeEmailLocal(emailLocal) || null}
        bgUrl={bgPreview}
        tokenUrl={tokenPreview}
        animate
      />
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-baseline justify-between gap-4 p-4 sm:p-8">
        <p className="font-display text-xl tracking-tight text-[var(--ink)]/80 sm:text-2xl">
          lost.pink
        </p>
        <p className="hidden max-w-[11rem] text-right text-[11px] leading-relaxed text-[var(--ink)]/40 sm:block">
          {editing ? "yours to tend." : "A shrine you leave. Frozen when you publish."}
        </p>
      </header>

      <div className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-6">
        <div ref={trayRef} className="mx-auto w-full max-w-md">
          <form onSubmit={onSubmit} className="quiet-tray px-3 py-2.5">
            {panel === "word" ? (
              <div className="mb-2">
                <label htmlFor="word" className="sr-only">
                  a name, a word, a feeling
                </label>
                <input
                  id="word"
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  placeholder="a name, a word, a feeling"
                  autoComplete="off"
                  autoFocus
                  className="w-full border-0 bg-transparent font-display text-xl text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
                />
                {slug.length >= 2 ? (
                  <p className="mt-1 text-[11px] text-[var(--ink-faint)]">
                    lost.pink/{slug}
                  </p>
                ) : null}
                <label htmlFor="alias" className="sr-only">
                  optional alias
                </label>
                <input
                  id="alias"
                  value={emailLocal}
                  onChange={(e) => setEmailLocal(e.target.value.slice(0, 24))}
                  placeholder="optional · you@lost.pink"
                  autoComplete="off"
                  className="mt-2 w-full border-0 bg-transparent text-[12px] text-[var(--ink)]/70 outline-none placeholder:text-[var(--ink-faint)]"
                />
                {normalizeEmailLocal(emailLocal) ? (
                  <p className="mt-0.5 text-[11px] text-[var(--ink-faint)]">
                    {displayLostEmail(normalizeEmailLocal(emailLocal))}
                    <span className="ml-1 opacity-70">display only</span>
                  </p>
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
                      className={`px-2 py-0.5 text-[11px] tracking-wide ${
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
                  <div className="flex flex-wrap gap-2 px-1">
                    {PALETTES.map((palette) => (
                      <button
                        key={palette}
                        type="button"
                        title={palette}
                        aria-label={palette}
                        aria-pressed={look.palette === palette}
                        onClick={() => pickPalette(palette)}
                        className={`h-6 w-6 rounded-full border transition ${
                          look.palette === palette
                            ? "border-[var(--ink)]"
                            : "border-[var(--ink)]/15"
                        }`}
                        style={{ background: PALETTE_COLORS[palette].swatch }}
                      />
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
                        className={`py-1 text-xs tracking-wide ${
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
                        className={`py-1 text-left text-[11px] leading-tight ${
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
                        className={`snap-start shrink-0 py-1 text-[12px] ${
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
                        className={`py-1 text-xs tracking-wide ${
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
                  label="token"
                  file={tokenFile}
                  preview={tokenPreview}
                  onChange={(file) => onFile("token", file)}
                />
              </div>
            ) : null}

            {error ? (
              <p className="mb-2 text-xs text-[var(--ink-muted)]" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex items-center gap-0.5">
              <TrayTab
                active={panel === "word"}
                onClick={() => togglePanel("word")}
              >
                word
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
                disabled={pending || slug.length < 2}
                className="ml-auto min-h-9 px-2.5 py-1 text-[13px] text-[var(--ink)] transition enabled:hover:opacity-70 disabled:opacity-30"
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
          </form>
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[10px] text-[var(--ink)]/35">
            {editing ? (
              <>
                <button type="button" onClick={() => void share()}>
                  {copied ? "copied" : "share"}
                </button>
                {page && !page.kept ? (
                  <button type="button" onClick={keepIt} disabled={pending}>
                    {keepLabel(display)}
                  </button>
                ) : null}
                <a href="/you" className="underline-offset-2 hover:underline">
                  yours
                </a>
              </>
            ) : (
              <>
                <span>frozen when published</span>
                <a href="/come" className="underline-offset-2 hover:underline">
                  come back
                </a>
              </>
            )}
            <a href="/privacy" className="underline-offset-2 hover:underline">
              privacy
            </a>
            <a href="/terms" className="underline-offset-2 hover:underline">
              terms
            </a>
          </p>
        </div>
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
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 px-2 py-1 text-[12px] tracking-wide ${
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
          <span>+ {label}</span>
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
          className="text-[11px] text-[var(--ink-faint)]"
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
