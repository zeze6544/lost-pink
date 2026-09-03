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
  footer?: boolean;
  animate?: boolean;
  className?: string;
};

export function PinkStage({
  word,
  look,
  line,
  bgUrl,
  tokenUrl,
  footer = true,
  animate = false,
  className = "",
}: Props) {
  const colors = PALETTE_COLORS[look.palette];
  const shown = displayWord(word, look.treatment);
  const fontFamily = `var(${FONT_META[look.font].cssVar}), Georgia, serif`;
  const wordClass =
    look.treatment === "whisper"
      ? "stage-word-whisper"
      : look.treatment === "shout"
        ? "stage-word-shout"
        : "stage-word-display";

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={
        {
          "--stage-a": colors.a,
          "--stage-b": colors.b,
          "--stage-c": colors.c,
          "--stage-ink": colors.ink,
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
        <div className="pink-grain absolute inset-0 opacity-40 mix-blend-soft-light" />
      ) : null}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center px-6 ${
          animate ? "word-rise" : ""
        }`}
      >
        {tokenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tokenUrl}
            alt=""
            className="mb-5 h-24 w-24 rounded-2xl object-cover shadow-[0_12px_40px_rgba(40,10,24,0.28)] sm:mb-7 sm:h-32 sm:w-32"
          />
        ) : null}
        <div className="relative flex max-w-[90vw] items-center justify-center">
          {look.motif === "heart" ? (
            <HeartMark className="pointer-events-none absolute left-1/2 top-1/2 h-[min(70vw,22rem)] w-[min(70vw,22rem)] -translate-x-1/2 -translate-y-[46%] text-[var(--stage-ink)] opacity-[0.14]" />
          ) : null}
          {look.motif === "echo" ? (
            <>
              <span
                aria-hidden
                className={`pointer-events-none absolute ${wordClass} text-center break-all text-[var(--stage-ink)] opacity-[0.18]`}
                style={{
                  fontFamily,
                  transform: "translate(0.55em, -0.45em)",
                }}
              >
                {shown}
              </span>
              <span
                aria-hidden
                className={`pointer-events-none absolute ${wordClass} text-center break-all text-[var(--stage-ink)] opacity-[0.1]`}
                style={{
                  fontFamily,
                  transform: "translate(-0.7em, 0.55em)",
                }}
              >
                {shown}
              </span>
            </>
          ) : null}
          <h1
            className={`relative z-[1] max-w-[90vw] text-center break-all text-[var(--stage-ink)] ${wordClass}`}
            style={{ fontFamily }}
          >
            {shown}
          </h1>
        </div>
        {line ? (
          <p
            className="relative z-[1] mt-5 max-w-md text-center text-sm leading-relaxed tracking-[0.04em] text-[var(--stage-ink)]/70 sm:text-base"
            style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
          >
            {line}
          </p>
        ) : null}
      </div>
      {footer ? (
        <p className="absolute bottom-6 left-0 right-0 text-center text-sm tracking-wide text-[var(--stage-ink)]/55">
          made on lost.pink
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
