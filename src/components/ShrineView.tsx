"use client";

import { useEffect, useState } from "react";
import { Generator, type GeneratorPage } from "@/components/Generator";
import { PageActions } from "@/components/PageActions";
import { PinkStage } from "@/components/PinkStage";
import type { Look } from "@/lib/looks";
import { formatLeftHere, JUST_LEFT_KEY } from "@/lib/voice";

type Props = {
  page: GeneratorPage & {
    slug: string;
    expiresAt: string | null;
    foundCount: number;
    createdAt: string;
  };
  look: Look;
  owned: boolean;
  canComeBack: boolean;
};

export function ShrineView({ page, look, owned, canComeBack }: Props) {
  const [ready, setReady] = useState(false);
  const [justLeft, setJustLeft] = useState(false);

  useEffect(() => {
    setJustLeft(sessionStorage.getItem(JUST_LEFT_KEY) === page.slug);
    setReady(true);
  }, [page.slug]);

  if (!ready || justLeft) {
    return (
      <main
        className="relative min-h-[100dvh] overflow-hidden"
        style={{ ["--tray-h" as string]: "8rem" }}
      >
        <PinkStage
          word={page.word}
          look={look}
          line={page.line}
          alias={page.emailLocal}
          bgUrl={page.bgUrl}
          tokenUrl={page.tokenUrl}
          caption={formatLeftHere(page.createdAt)}
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
        {ready ? (
          <PageActions
            pageId={page.id}
            slug={page.slug}
            word={page.word}
            line={page.line}
            look={look}
            bgUrl={page.bgUrl}
            tokenUrl={page.tokenUrl}
            kept={page.kept}
            expiresAt={page.expiresAt}
            foundCount={page.foundCount}
            alias={page.emailLocal}
            owned={owned}
            canComeBack={canComeBack}
            onDismissJustLeft={() => setJustLeft(false)}
          />
        ) : null}
      </main>
    );
  }

  if (owned) {
    return <Generator page={page} />;
  }

  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden"
      style={{ ["--tray-h" as string]: "8rem" }}
    >
      <PinkStage
        word={page.word}
        look={look}
        line={page.line}
        alias={page.emailLocal}
        bgUrl={page.bgUrl}
        tokenUrl={page.tokenUrl}
        caption={formatLeftHere(page.createdAt)}
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
      <PageActions
        pageId={page.id}
        slug={page.slug}
        word={page.word}
        line={page.line}
        look={look}
        bgUrl={page.bgUrl}
        tokenUrl={page.tokenUrl}
        kept={page.kept}
        expiresAt={page.expiresAt}
        foundCount={page.foundCount}
        alias={page.emailLocal}
        owned={owned}
        canComeBack={canComeBack}
      />
    </main>
  );
}
