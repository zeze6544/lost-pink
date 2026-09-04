"use client";

import {
  displayWord,
  FONT_META,
  PALETTE_COLORS,
  type Look,
} from "@/lib/looks";
import { displayLostEmail } from "@/lib/slug";
import { SafeLine } from "@/components/SafeLine";

type Props = {
  word: string;
  look: Look;
  line?: string | null;
  bgUrl?: string | null;
  tokenUrl?: string | null;
  alias?: string | null;
  aliasNote?: string | null;
  caption?: string | null;
  kicker?: string | null;
  kickerTitle?: string | null;
  writeHref?: string | null;
  animate?: boolean;
  className?: string;
};

export function Stage({
  word,
  look,
  line,
  bgUrl,
  tokenUrl,
  alias = null,
  aliasNote = null,
  caption = null,
  kicker = null,
  kickerTitle = null,
  writeHref = null,
  animate = false,
  className = "",
}: Props) {
  const colors = PALETTE_COLORS[look.palette];
  const shown = displayWord(word, look.treatment);
  const wordClass =
    look.treatment === "whisper"
      ? "stage-word-whisper"
      : look.treatment === "shout"
        ? "stage-word-shout"
        : "stage-word-display";
  const clusterClass =
    look.treatment === "whisper"
      ? "stage-cluster-whisper"
      : look.treatment === "shout"
        ? "stage-cluster-shout"
        : "stage-cluster-display";

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={
        {
          "--stage-a": colors.a,
          "--stage-b": colors.b,
          "--stage-c": colors.c,
          "--stage-ink": colors.ink,
          "--stage-font": `var(${FONT_META[look.font].cssVar}), Georgia, serif`,
        } as React.CSSProperties
      }
    >
      {bgUrl ? (
        // User-chosen still; blob: preview URLs are not valid for next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bgUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div
        className="stage-wash absolute inset-0"
        style={{ opacity: bgUrl ? 0.55 : 1 }}
      />
      <div className="stage-grid-whisper pointer-events-none absolute inset-0" />
      {look.motif === "grain" ? (
        <div className="stage-grain absolute inset-0 opacity-[0.18] mix-blend-soft-light" />
      ) : null}
      {look.motif === "grid" ? (
        <div className="stage-grid pointer-events-none absolute inset-0" />
      ) : null}
      <div
        className={`stage-cluster absolute inset-0 flex flex-col items-center justify-center px-6 ${clusterClass} ${
          animate ? "word-rise" : ""
        }`}
      >
        {tokenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tokenUrl}
            alt=""
            className="mb-6 h-[7.25rem] w-[5.5rem] object-cover sm:mb-8 sm:h-[9rem] sm:w-[6.75rem]"
          />
        ) : null}
        <div className="relative flex max-w-[90vw] items-center justify-center">
          {look.motif === "echo" && shown ? (
            <>
              <span
                aria-hidden
                className={`pointer-events-none absolute ${wordClass} stage-word text-center break-all text-[var(--stage-ink)] opacity-[0.08] echo-a`}
              >
                {shown}
              </span>
              <span
                aria-hidden
                className={`pointer-events-none absolute ${wordClass} stage-word text-center break-all text-[var(--stage-ink)] opacity-[0.045] echo-b`}
              >
                {shown}
              </span>
            </>
          ) : null}
          {shown ? (
            <h1
              className={`relative z-[1] max-w-[90vw] text-center break-all text-[var(--stage-ink)] stage-word ${wordClass}`}
            >
              {shown}
            </h1>
          ) : kickerTitle || kicker ? (
            <div className="relative z-[1] max-w-md text-center">
              {kickerTitle ? (
                <p className="font-display text-[1.85rem] leading-tight tracking-tight text-[var(--stage-ink)]/90 sm:text-4xl">
                  {kickerTitle}
                </p>
              ) : null}
              {kicker ? (
                <p className="mark mt-3 text-[11px] leading-relaxed text-[var(--stage-ink)]/45 sm:text-xs">
                  {kicker}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        {line ? (
          <SafeLine
            text={line}
            className="stage-line relative z-[1] mt-5 max-w-md text-center text-sm leading-relaxed tracking-[0.04em] text-[var(--stage-ink)]/70 sm:text-base"
          />
        ) : null}
        {alias || aliasNote ? (
          <p className="mark relative z-[1] mt-3 text-[10px] text-[var(--stage-ink)]/40">
            {alias ? displayLostEmail(alias) : null}
            {alias && aliasNote ? (
              <span className="mx-2 opacity-40">·</span>
            ) : null}
            {aliasNote ? (
              writeHref ? (
                <a
                  href={writeHref}
                  className="pointer-events-auto opacity-80 underline-offset-2 hover:underline"
                >
                  {aliasNote}
                </a>
              ) : (
                <span className={alias ? "opacity-70" : undefined}>
                  {aliasNote}
                </span>
              )
            ) : null}
          </p>
        ) : null}
      </div>
      {caption ? (
        <p className="mark stage-caption pointer-events-none absolute left-0 right-0 text-center text-[10px] text-[var(--stage-ink)]/35">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
