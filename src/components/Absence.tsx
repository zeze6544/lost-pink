import type { CSSProperties } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { BrandMark } from "@/components/BrandMark";
import { PhraseBackdrop } from "@/components/PhraseBackdrop";
import { DEFAULT_LOOK, stageStyle } from "@/lib/looks";
import { presetForKey } from "@/lib/phrase-presets";

export function Absence({ word }: { word?: string }) {
  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden text-[var(--ink)]"
      style={stageStyle(DEFAULT_LOOK) as CSSProperties}
    >
      <Atmosphere variant="landing" />
      <PhraseBackdrop preset={presetForKey(word ?? "gone")} variant="site" />
      <BrandMark className="absolute left-4 top-4 z-20 text-sm text-[var(--ink)]/85 sm:left-8 sm:top-8" />
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
        {word ? (
          <>
            <p className="font-display text-[clamp(2.75rem,14vw,6.5rem)] leading-none tracking-tight">
              {word}
            </p>
            <p className="mt-5 text-sm text-[var(--ink-muted)]">
              {word} was here for a little while.
            </p>
          </>
        ) : (
          <p className="font-display text-5xl">gone</p>
        )}
      </div>
      <a
        href="/"
        className="absolute bottom-8 left-0 right-0 z-20 text-center text-sm text-[var(--ink-muted)]"
      >
        start with a name
      </a>
    </main>
  );
}
