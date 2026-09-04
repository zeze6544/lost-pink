export function Absence({ word }: { word?: string }) {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[var(--paper)] text-[var(--ink)]">
      <a
        href="/"
        className="mark absolute left-4 top-4 text-sm text-[var(--ink)]/85 sm:left-8 sm:top-8"
      >
        lost.pink
      </a>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
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
        className="absolute bottom-8 left-0 right-0 text-center text-sm text-[var(--ink-muted)]"
      >
        start with a name
      </a>
    </main>
  );
}
