export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[var(--blush)] px-6 text-center text-[var(--ink)]">
      <p className="font-display text-5xl">gone</p>
      <p className="text-sm text-[var(--ink-muted)]">
        That page expired or never existed.
      </p>
      <a
        href="/"
        className="mt-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm text-[var(--blush)]"
      >
        Make a new one
      </a>
    </main>
  );
}
