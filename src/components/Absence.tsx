import { BrandMark } from "@/components/BrandMark";
import { SiteFooter } from "@/components/SiteFrame";

export function Absence({ word }: { word?: string }) {
  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[var(--paper)] text-[var(--ink)]">
      <BrandMark className="absolute left-4 top-4 z-10 text-sm text-[var(--ink)]/85 sm:left-8 sm:top-8" />
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
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
        <a
          href="/"
          className="mt-10 text-sm text-[var(--ink-muted)] underline-offset-2 hover:underline"
        >
          start with a name
        </a>
      </div>
      <SiteFooter
        left={<a href="/come">log in</a>}
        center={
          <>
            <a href="/support">support</a>
            <span aria-hidden> · </span>
            <a href="/privacy">privacy</a>
            <span aria-hidden> · </span>
            <a href="/terms">terms</a>
          </>
        }
      />
    </main>
  );
}
