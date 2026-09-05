import type { ReactNode } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { BrandMark } from "@/components/BrandMark";

export function SiteFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`site-frame relative min-h-[100dvh] text-[var(--ink)] ${className}`}
    >
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <Atmosphere />
      </div>
      <div className="relative z-10">{children}</div>
    </main>
  );
}

export function HomeMark({
  className = "",
}: {
  className?: string;
}) {
  return (
    <BrandMark
      className={`mark text-sm text-[var(--ink)]/80 transition hover:text-[var(--ink)] ${className}`}
    />
  );
}

export function AuthTray({
  title,
  note,
  children,
}: {
  title: string;
  note: ReactNode;
  children: ReactNode;
}) {
  return (
    <SiteFrame>
      <HomeMark className="absolute left-4 top-4 z-20 sm:left-8 sm:top-8" />
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6">
        <div className="quiet-tray w-full max-w-sm px-5 py-6">
          <h1 className="font-display text-3xl tracking-tight">{title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-muted)]">
            {note}
          </p>
          {children}
        </div>
      </div>
    </SiteFrame>
  );
}

export function DocPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <SiteFrame>
      <div className="mx-auto max-w-2xl px-6 py-16 sm:px-8 sm:py-24">
        <HomeMark />
        <h1 className="mt-16 font-display text-[2.75rem] leading-none tracking-tight text-[var(--ink)] sm:mt-20 sm:text-6xl">
          {title}
        </h1>
        <div className="mt-10 max-w-xl divide-y divide-[var(--ink)]/12">
          {children}
        </div>
      </div>
    </SiteFrame>
  );
}

export function DocQuestion({
  q,
  children,
}: {
  q: string;
  children: ReactNode;
}) {
  return (
    <section className="py-6 first:pt-0">
      <h2 className="font-display text-[1.4rem] leading-tight tracking-tight text-[var(--ink)] sm:text-2xl">
        {q}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-7 text-[var(--ink-muted)]">
        {children}
      </div>
    </section>
  );
}

export function AccountShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <SiteFrame>
      <HomeMark className="absolute left-4 top-4 z-20 sm:left-8 sm:top-8" />
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-4 pb-10 pt-20 sm:px-6">
        <h1 className="font-display text-4xl tracking-tight text-[var(--ink)]">
          {title}
        </h1>
        <div className="mt-6 space-y-3">{children}</div>
      </div>
    </SiteFrame>
  );
}
