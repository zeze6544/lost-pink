"use client";

import { useState } from "react";
import { PinkStage } from "@/components/PinkStage";
import { downloadLockScreen } from "@/lib/export-png";
import type { Look } from "@/lib/looks";

type Props = {
  slug: string;
  word: string;
  line: string | null;
  look: Look;
  bgUrl: string | null;
  tokenUrl: string | null;
};

export function ThanksClient({
  slug,
  word,
  line,
  look,
  bgUrl,
  tokenUrl,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!slug) return;
    await navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      <PinkStage
        word={word || "kept"}
        look={look}
        line={line}
        bgUrl={bgUrl}
        tokenUrl={tokenUrl}
        footer={false}
        animate
      />
      <div className="absolute inset-0 z-10 flex items-end justify-center p-6 sm:p-10">
        <div className="w-full max-w-md rounded-2xl border border-[var(--ink)]/10 bg-[var(--paper)]/85 p-6 backdrop-blur-md">
          <p className="font-display text-3xl text-[var(--ink)]">Kept.</p>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            {slug
              ? `lost.pink/${slug} is yours forever. Save the 9:16 and send the link.`
              : "Payment received. If your page isn’t here yet, wait a few seconds and open your slug again."}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            {slug ? (
              <>
                <button
                  type="button"
                  onClick={copyLink}
                  className="h-11 rounded-full border border-[var(--ink)]/15 bg-white/60 text-sm text-[var(--ink)]"
                >
                  {copied ? "Copied" : "Copy link"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void downloadLockScreen({
                      word: word || slug,
                      look,
                      line,
                      bgUrl,
                      tokenUrl,
                      watermark: false,
                    })
                  }
                  className="h-11 rounded-full bg-[var(--ink)] text-sm text-[var(--blush)]"
                >
                  Save 9:16
                </button>
                <a
                  href={`/${slug}`}
                  className="flex h-11 items-center justify-center rounded-full text-sm text-[var(--ink-muted)] underline-offset-4 hover:underline"
                >
                  Open page
                </a>
              </>
            ) : (
              <a
                href="/"
                className="flex h-11 items-center justify-center rounded-full bg-[var(--ink)] text-sm text-[var(--blush)]"
              >
                Back home
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
