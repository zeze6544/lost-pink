import type { ReactNode } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { BrandMark } from "@/components/BrandMark";
import { LOGIN_WHISPER } from "@/lib/landing-voice";

export function SiteFrame({
  children,
  className = "",
  atmosphere = "default" as "default" | "landing",
}: {
  children: ReactNode;
  className?: string;
  atmosphere?: "default" | "landing";
}) {
  return (
    <main
      className={`site-frame relative min-h-[100dvh] text-[var(--ink)] ${className}`}
    >
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <Atmosphere variant={atmosphere} />
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
      className={`mark text-[13px] tracking-[0.04em] text-[var(--ink)]/85 transition hover:text-[var(--ink)] ${className}`}
    />
  );
}

/** Ruled footer from the approved privacy/terms chrome. */
export function SiteFooter({
  left = "you're back",
  center,
  right,
  className = "",
}: {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <footer className={`site-footer ${className}`}>
      <div className="site-footer__bar">
        <div className="site-footer__cell site-footer__cell--left">{left}</div>
        <div className="site-footer__cell site-footer__cell--center">
          {center ?? (
            <>
              <a href="/support">support</a>
              <span aria-hidden> · </span>
              <a href="/terms">terms</a>
            </>
          )}
        </div>
        <div className="site-footer__cell site-footer__cell--right">
          {right ?? <a href="/">back to lost.pink</a>}
        </div>
      </div>
    </footer>
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
    <SiteFrame atmosphere="landing">
      <div className="flex min-h-[100dvh] flex-col px-0 pb-[max(0px,env(safe-area-inset-bottom))] pt-[max(0px,env(safe-area-inset-top))]">
        <HomeMark className="relative z-20 ml-5 mt-5 shrink-0 self-start sm:absolute sm:left-8 sm:top-8 sm:ml-0 sm:mt-0" />
        <p
          className="pointer-events-none absolute inset-x-0 top-[16%] z-0 hidden text-center font-display text-[clamp(2.4rem,8vw,5.5rem)] leading-none tracking-[-0.04em] text-[var(--ink)]/[0.12] sm:block"
          aria-hidden
        >
          {LOGIN_WHISPER}
        </p>
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-6 sm:py-20">
          <div className="w-full max-w-sm border border-[color-mix(in_srgb,var(--ink)_42%,transparent)] bg-[color-mix(in_srgb,#080808_78%,transparent)] px-5 py-5 sm:px-5 sm:py-6 backdrop-blur-[8px]">
            <h1 className="font-display text-[2.15rem] leading-none tracking-tight sm:text-[2.4rem]">
              {title}
            </h1>
            <p className="mt-3 font-mono text-[13px] leading-relaxed text-[var(--ink)]/82">
              {note}
            </p>
            {children}
          </div>
        </div>
        <SiteFooter
          left="log in"
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
    <SiteFrame atmosphere="default">
      <div className="flex min-h-[100dvh] flex-col">
        <div className="w-full flex-1 px-8 py-16 sm:px-12 sm:py-20 lg:px-20">
          <HomeMark />
          <h1 className="mt-20 max-w-xl font-display text-[clamp(3.4rem,11vw,6rem)] leading-none tracking-tight text-[var(--ink)] sm:mt-24">
            {title}
          </h1>
          <div className="mt-10 max-w-xl space-y-10">{children}</div>
        </div>
        <SiteFooter
          left={
            <a href="/come">you&apos;re back</a>
          }
          center={
            <>
              <a href="/support">support</a>
              <span aria-hidden> · </span>
              <a href="/terms">terms</a>
            </>
          }
          right={<a href="/">back to lost.pink</a>}
        />
      </div>
    </SiteFrame>
  );
}

export function DocSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-[1.65rem] leading-tight tracking-tight text-[var(--ink)]">
        {title}
      </h2>
      <div className="mt-3 space-y-2 font-mono text-[15px] leading-relaxed text-[color-mix(in_srgb,var(--ink)_82%,transparent)]">
        {children}
      </div>
    </section>
  );
}

/** @deprecated Prefer DocSection — kept for older Q&A pages. */
export function DocQuestion({
  q,
  children,
}: {
  q: string;
  children: ReactNode;
}) {
  return <DocSection title={q}>{children}</DocSection>;
}

export function AccountShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <SiteFrame atmosphere="default">
      <div className="flex min-h-[100dvh] flex-col">
        <HomeMark className="absolute left-5 top-5 z-20 sm:left-8 sm:top-8" />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-4 pb-10 pt-24 text-center sm:px-6">
          <h1 className="font-display text-[2.75rem] leading-none tracking-tight text-[var(--ink)]">
            {title}
          </h1>
          <div className="mt-10 w-full space-y-0 text-left">{children}</div>
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
      </div>
    </SiteFrame>
  );
}
