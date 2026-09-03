"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PinkStage } from "@/components/PinkStage";
import {
  DEFAULT_LOOK,
  FONTS,
  FONT_META,
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
import { normalizeWord } from "@/lib/slug";

const MAX_LINE = 80;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

type Picked = {
  palette: boolean;
  treatment: boolean;
  motif: boolean;
  font: boolean;
};

export function Generator() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [line, setLine] = useState("");
  const [look, setLook] = useState<Look>(DEFAULT_LOOK);
  const [picked, setPicked] = useState<Picked>({
    palette: false,
    treatment: false,
    motif: false,
    font: false,
  });
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [tokenFile, setTokenFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [tokenPreview, setTokenPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  function onFile(
    kind: "bg" | "token",
    file: File | null,
  ) {
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
        const bg_url = bgFile ? await uploadImage(bgFile) : null;
        const token_url = tokenFile ? await uploadImage(tokenFile) : null;
        const res = await fetch("/api/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word: raw,
            line,
            palette: look.palette,
            treatment: look.treatment,
            motif: look.motif,
            font: look.font,
            bg_url,
            token_url,
          }),
        });
        const data = (await res.json()) as { slug?: string; error?: string };
        if (!res.ok) {
          setError(data.error ?? "Could not publish.");
          return;
        }
        router.push(`/${data.slug}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not publish.");
      }
    });
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <PinkStage
        word={display}
        look={look}
        line={line.trim() || null}
        bgUrl={bgPreview}
        tokenUrl={tokenPreview}
        footer={false}
        animate
      />
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-8">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-display text-2xl tracking-tight text-[var(--ink)] sm:text-3xl">
            lost.pink
          </p>
          <p className="max-w-[12rem] text-right text-xs leading-relaxed text-[var(--ink-muted)] sm:max-w-xs sm:text-sm">
            A shrine you gift. Frozen when you publish.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="mx-auto mt-6 w-full max-w-xl max-h-[min(62vh,40rem)] overflow-y-auto rounded-2xl border border-[var(--ink)]/10 bg-[var(--paper)]/78 p-4 shadow-[0_20px_60px_rgba(60,20,40,0.12)] backdrop-blur-md sm:p-5"
        >
          <label htmlFor="word" className="sr-only">
            A name, a word, a feeling
          </label>
          <input
            id="word"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="a name, a word, a feeling"
            autoComplete="off"
            autoFocus
            className="w-full border-0 bg-transparent font-display text-3xl text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] sm:text-4xl"
          />
          <label htmlFor="line" className="sr-only">
            Optional line
          </label>
          <input
            id="line"
            value={line}
            onChange={(e) => setLine(e.target.value.slice(0, MAX_LINE))}
            placeholder="one optional line (no links)"
            autoComplete="off"
            maxLength={MAX_LINE}
            className="mt-2 w-full border-0 bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
          />
          <p className="mt-1 text-right text-[10px] text-[var(--ink-faint)]">
            {line.length}/{MAX_LINE}
          </p>

          <Row label="Color">
            <div className="flex flex-wrap gap-2">
              {PALETTES.map((palette) => (
                <button
                  key={palette}
                  type="button"
                  title={palette}
                  aria-label={palette}
                  aria-pressed={look.palette === palette}
                  onClick={() => pickPalette(palette)}
                  className={`h-7 w-7 rounded-full border transition ${
                    look.palette === palette
                      ? "scale-110 ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--paper)]"
                      : "border-[var(--ink)]/20"
                  }`}
                  style={{ background: PALETTE_COLORS[palette].swatch }}
                />
              ))}
            </div>
          </Row>

          <Row label="Type">
            <div className="flex flex-wrap gap-1.5">
              {TREATMENTS.map((treatment) => (
                <button
                  key={treatment}
                  type="button"
                  aria-pressed={look.treatment === treatment}
                  onClick={() => pickTreatment(treatment)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    look.treatment === treatment
                      ? "bg-[var(--ink)] text-[var(--blush)]"
                      : "bg-white/50 text-[var(--ink-muted)] hover:bg-white/80"
                  }`}
                >
                  {treatment === "display"
                    ? "Aa display"
                    : treatment === "whisper"
                      ? "aa whisper"
                      : "AA shout"}
                </button>
              ))}
            </div>
          </Row>

          <Row label="Font">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {FONTS.map((font) => (
                <button
                  key={font}
                  type="button"
                  aria-pressed={look.font === font}
                  onClick={() => pickFont(font)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs transition ${
                    look.font === font
                      ? "bg-[var(--ink)] text-[var(--blush)]"
                      : "bg-white/50 text-[var(--ink-muted)] hover:bg-white/80"
                  }`}
                  style={{
                    fontFamily: `var(${FONT_META[font].cssVar}), Georgia, serif`,
                  }}
                >
                  {FONT_META[font].label}
                </button>
              ))}
            </div>
          </Row>

          <Row label="Motif">
            <div className="flex flex-wrap gap-1.5">
              {MOTIFS.map((motif) => (
                <button
                  key={motif}
                  type="button"
                  aria-pressed={look.motif === motif}
                  onClick={() => pickMotif(motif)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    look.motif === motif
                      ? "bg-[var(--ink)] text-[var(--blush)]"
                      : "bg-white/50 text-[var(--ink-muted)] hover:bg-white/80"
                  }`}
                >
                  {motif}
                </button>
              ))}
            </div>
          </Row>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <FilePick
              label="Background"
              file={bgFile}
              onChange={(file) => onFile("bg", file)}
            />
            <FilePick
              label="Token"
              file={tokenFile}
              onChange={(file) => onFile("token", file)}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--ink-muted)]">
              {slug ? (
                <>
                  becomes{" "}
                  <span className="text-[var(--ink)]">lost.pink/{slug}</span>
                </>
              ) : (
                "Free for 48 hours. Keep the name for $5."
              )}
            </p>
            <button
              type="submit"
              disabled={pending || slug.length < 2}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--ink)] px-6 text-sm font-medium text-[var(--blush)] transition enabled:hover:opacity-90 disabled:opacity-40"
            >
              {pending ? "Publishing…" : "Make it pink"}
            </button>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-[#8a2f45]" role="alert">
              {error}
            </p>
          ) : null}
        </form>

        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-[var(--ink-muted)] sm:justify-start">
          <span>No account. Looks freeze at publish.</span>
          <a href="/privacy" className="underline-offset-2 hover:underline">
            Privacy
          </a>
          <a href="/terms" className="underline-offset-2 hover:underline">
            Terms
          </a>
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">
        {label}
      </p>
      {children}
    </div>
  );
}

function FilePick({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="flex cursor-pointer flex-col rounded-xl border border-dashed border-[var(--ink)]/15 bg-white/40 px-3 py-2 text-xs text-[var(--ink-muted)]">
      <span className="uppercase tracking-[0.14em] text-[10px] text-[var(--ink-faint)]">
        {label}
      </span>
      <span className="mt-1 truncate text-[var(--ink)]">
        {file ? file.name : "jpeg / png / webp"}
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <button
          type="button"
          className="mt-1 self-start text-[10px] underline-offset-2 hover:underline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange(null);
          }}
        >
          Remove
        </button>
      ) : null}
    </label>
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
    throw new Error(data.error ?? "Photo upload failed.");
  }
  return data.url;
}
