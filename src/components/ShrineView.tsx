"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { Generator, type GeneratorPage } from "@/components/Generator";
import { PageActions } from "@/components/PageActions";
import { Stage } from "@/components/Stage";
import type { Look } from "@/lib/looks";
import { stageStyle } from "@/lib/looks";
import type { OwnerMailboxView } from "@/lib/mailbox-view";
import { JUST_LEFT_KEY } from "@/lib/voice";

type Props = {
  page: GeneratorPage & {
    slug: string;
    expiresAt: string | null;
    foundCount: number;
    createdAt: string;
    mailbox?: OwnerMailboxView | null;
  };
  look: Look;
  owned: boolean;
  canComeBack: boolean;
};

export function ShrineView({ page, look, owned, canComeBack }: Props) {
  const [ready, setReady] = useState(false);
  const [justLeft, setJustLeft] = useState(false);
  const [trayH, setTrayH] = useState(168);
  const writeHref =
    page.mailboxStatus === "open" ? `/${page.slug}/write` : null;

  useEffect(() => {
    setJustLeft(sessionStorage.getItem(JUST_LEFT_KEY) === page.slug);
    setReady(true);
  }, [page.slug]);

  if (!ready || justLeft) {
    return (
      <main
        className="relative min-h-[100dvh] overflow-hidden"
        style={
          {
            "--tray-h": `${trayH}px`,
            ...stageStyle(look),
          } as React.CSSProperties
        }
      >
        <Stage
          word={page.word}
          look={look}
          line={page.line}
          alias={page.emailLocal}
          writeHref={writeHref}
          bgUrl={page.bgUrl}
          tokenUrl={page.tokenUrl}
          animate
        />
        <div className="absolute left-4 top-4 z-20 sm:left-8 sm:top-8">
          <BrandMark
            glyph
            className="text-sm text-[var(--stage-ink)]/80 transition hover:text-[var(--stage-ink)]"
          />
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
            mailboxStatus={page.mailboxStatus}
            mailbox={page.mailbox}
            onDismissJustLeft={() => setJustLeft(false)}
            onTrayHeight={setTrayH}
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
      style={
        {
          "--tray-h": `${trayH}px`,
          ...stageStyle(look),
        } as React.CSSProperties
      }
    >
      <Stage
        word={page.word}
        look={look}
        line={page.line}
        alias={page.emailLocal}
        writeHref={writeHref}
        bgUrl={page.bgUrl}
        tokenUrl={page.tokenUrl}
        animate
      />
      <div className="absolute left-4 top-4 z-20 sm:left-8 sm:top-8">
        <BrandMark
          glyph
          className="text-sm text-[var(--stage-ink)]/80 transition hover:text-[var(--stage-ink)]"
        />
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
        mailboxStatus={page.mailboxStatus}
        mailbox={page.mailbox}
        onTrayHeight={setTrayH}
      />
    </main>
  );
}
