"use client";

import {
  displayWord,
  FONT_META,
  PALETTE_COLORS,
  type Look,
} from "@/lib/looks";

type Props = {
  word: string;
  look: Look;
  line?: string | null;
  bgUrl?: string | null;
  tokenUrl?: string | null;
  caption?: string | null;
  animate?: boolean;
  className?: string;
};

export function PinkStage({
  word,
  look,
  line,
  bgUrl,
  tokenUrl,
  caption = null,
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
        className="pink-wash absolute inset-0"
        style={{ opacity: bgUrl ? 0.45 : 1 }}
      />
      {look.motif === "grain" ? (
        <div className="pink-grain absolute inset-0 opacity-[0.22] mix-blend-soft-light" />
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
            className="mb-6 h-[7.25rem] w-[5.5rem] rotate-[-1.5deg] rounded-[3px] object-cover shadow-[0_6px_18px_rgba(40,10,24,0.14)] sm:mb-8 sm:h-[9rem] sm:w-[6.75rem]"
          />
        ) : null}
        <div className="relative flex max-w-[90vw] items-center justify-center">
          {look.motif === "heart" ? (
            <HeartMark className="pointer-events-none absolute left-1/2 top-1/2 h-[min(92vw,36rem)] w-[min(92vw,36rem)] -translate-x-1/2 -translate-y-[48%] text-[var(--stage-ink)] opacity-[0.055]" />
          ) : null}
          {look.motif === "echo" ? (
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
          <h1
            className={`relative z-[1] max-w-[90vw] text-center break-all text-[var(--stage-ink)] stage-word ${wordClass}`}
          >
            {shown}
          </h1>
        </div>
        {line ? (
          <p className="stage-line relative z-[1] mt-5 max-w-md text-center text-sm leading-relaxed tracking-[0.04em] text-[var(--stage-ink)]/70 sm:text-base">
            {line}
          </p>
        ) : null}
      </div>
      {caption ? (
        <p className="stage-caption pointer-events-none absolute left-0 right-0 text-center text-[10px] tracking-[0.14em] text-[var(--stage-ink)]/35">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

function HeartMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 21s-6.8-4.2-9.4-8.6C.3 8.8 2.4 4.2 6.7 4.2c2.1 0 3.5 1.2 4.3 2.7.8-1.5 2.2-2.7 4.3-2.7 4.3 0 6.4 4.6 4.1 8.2C18.8 16.8 12 21 12 21z" />
    </svg>
  );
}
