"use client";

import { useState } from "react";
import { PinkStage } from "@/components/PinkStage";
import { downloadLockScreen } from "@/lib/export-png";
import type { Look } from "@/lib/looks";
import { shareOrCopy } from "@/lib/voice";

type Props = {
  slug: string;
  word: string;
  line: string | null;
  look: Look;
  bgUrl: string | null;
  tokenUrl: string | null;
  alias?: string | null;
  caption?: string | null;
};

export function ThanksClient({
  slug,
  word,
  line,
  look,
  bgUrl,
  tokenUrl,
  alias = null,
  caption = null,
}: Props) {
  const [copied, setCopied] = useState(false);
  const shown = word || slug || "kept";

  async function share() {
    if (!slug) return;
    const url = `${window.location.origin}/${slug}`;
    const result = await shareOrCopy(url, `lost.pink/${slug}`);
    if (result === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden"
      style={{ ["--tray-h" as string]: "7.5rem" }}
    >
      <PinkStage
        word={shown}
        look={look}
        line={line}
        alias={alias}
        bgUrl={bgUrl}
        tokenUrl={tokenUrl}
        caption={caption}
        animate
      />
      <div className="absolute left-4 top-4 z-20 sm:left-8 sm:top-8">
        <a
          href="/"
          className="font-display text-lg text-[var(--ink)]/70 transition hover:text-[var(--ink)]"
        >
          lost.pink
        </a>
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-6">
        <div className="quiet-tray mx-auto w-full max-w-md px-3.5 py-3">
          {slug ? (
            <>
              <p className="text-sm text-[var(--ink)]">kept.</p>
              <p className="mt-0.5 text-[13px] text-[var(--ink-muted)]">
                {shown} isn&apos;t going anywhere.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[var(--ink)]">
                <button type="button" onClick={() => void share()}>
                  {copied ? "copied" : "share"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void downloadLockScreen({
                      word: shown,
                      look,
                      line,
                      alias,
                      bgUrl,
                      tokenUrl,
                      watermark: false,
                    })
                  }
                >
                  save 9:16
                </button>
                <a href={`/${slug}`} className="ml-auto text-[var(--ink-muted)]">
                  open {shown} →
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--ink)]">kept.</p>
              <p className="mt-1 text-[12px] text-[var(--ink-muted)]">
                if it isn&apos;t here yet, wait a moment and open the link again.
              </p>
              <a
                href="/"
                className="mt-2 inline-block text-[13px] text-[var(--ink-muted)]"
              >
                back
              </a>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
