export function SiteFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`site-frame relative min-h-[100dvh] overflow-hidden text-[var(--ink)] ${className}`}
    >
      <div className="site-wash pointer-events-none absolute inset-0" aria-hidden />
      <div className="site-depth pointer-events-none absolute inset-0" aria-hidden />
      <div className="site-horizon pointer-events-none absolute inset-0" aria-hidden />
      <div className="site-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="site-grain pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-10 min-h-[100dvh]">{children}</div>
    </main>
  );
}

export function DocPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <SiteFrame>
      <div className="mx-auto max-w-2xl px-6 py-16 sm:px-8 sm:py-24">
        <a
          href="/"
          className="mark text-sm text-[var(--ink)]/80 transition hover:text-[var(--ink)]"
        >
          lost.pink
        </a>
        <h1 className="mt-16 font-display text-[2.75rem] leading-none tracking-tight text-[var(--ink)] sm:mt-20 sm:text-6xl">
          {title}
        </h1>
        <div className="mt-8 max-w-xl space-y-5 text-[15px] leading-7 text-[var(--ink-muted)]">
          {children}
        </div>
      </div>
    </SiteFrame>
  );
}
