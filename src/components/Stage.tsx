"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import {
  displayWord,
  FONT_META,
  PALETTE_COLORS,
  type Look,
} from "@/lib/looks";
import { displayLostEmail } from "@/lib/slug";
import { Atmosphere } from "@/components/Atmosphere";
import { SafeLine } from "@/components/SafeLine";

type Props = {
  word: string;
  look: Look;
  atmosphereText?: string | null;
  atmosphereVariant?: "default" | "landing";
  line?: string | null;
  bgUrl?: string | null;
  tokenUrl?: string | null;
  alias?: string | null;
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
  atmosphereText = null,
  atmosphereVariant = "default",
  line,
  bgUrl,
  tokenUrl,
  alias = null,
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
  const titleRef = useRef<HTMLHeadingElement>(null);
  const address = alias ? displayLostEmail(alias) : null;

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const fit = () => {
      el.style.fontSize = "";
      const computed = parseFloat(getComputedStyle(el).fontSize);
      if (!Number.isFinite(computed)) return;
      const maxW = parent.clientWidth;
      const maxH = Math.min(window.innerHeight * 0.42, 440);
      let lo = 18;
      let hi = computed;
      let best = 18;
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2;
        el.style.fontSize = `${mid}px`;
        if (el.scrollWidth <= maxW + 1 && el.scrollHeight <= maxH) {
          best = mid;
          lo = mid;
        } else {
          hi = mid;
        }
      }
      el.style.fontSize = `${best}px`;
      parent.style.setProperty("--stage-title-size", `${best}px`);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [shown, look.treatment, look.font]);

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
        } as CSSProperties
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
      <Atmosphere
        wash={bgUrl ? 0.55 : 1}
        variant={atmosphereVariant}
      />
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
        <div className="relative flex w-full max-w-[min(92vw,40rem)] items-center justify-center">
          {look.motif === "echo" && shown ? (
            <>
              <span
                aria-hidden
                className={`pointer-events-none absolute ${wordClass} stage-word stage-word-echo text-center opacity-[0.08] echo-a`}
              >
                {shown}
              </span>
              <span
                aria-hidden
                className={`pointer-events-none absolute ${wordClass} stage-word stage-word-echo text-center opacity-[0.045] echo-b`}
              >
                {shown}
              </span>
            </>
          ) : null}
          {shown ? (
            <h1
              ref={titleRef}
              className={`relative z-[1] w-full text-center stage-word ${wordClass}`}
            >
              {shown}
            </h1>
          ) : atmosphereText ? (
            <p
              aria-hidden="true"
              className="stage-idle-hero pointer-events-none relative z-[1] whitespace-pre-line text-center"
            >
              {atmosphereText}
            </p>
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
        {address ? (
          <p className="mark relative z-[1] mt-5 text-[12px] tracking-[0.04em] text-[var(--stage-ink)]/70">
            {writeHref ? (
              <a
                href={writeHref}
                className="pointer-events-auto underline-offset-2 hover:underline"
              >
                {address}
              </a>
            ) : (
              address
            )}
          </p>
        ) : null}
        {line ? (
          <SafeLine
            text={line}
            className="stage-line relative z-[1] mt-4 max-w-md text-center text-sm leading-relaxed tracking-[0.04em] text-[var(--stage-ink)]/55 sm:text-[15px]"
          />
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
