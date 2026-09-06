import type { ReactNode } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { BrandMark } from "@/components/BrandMark";
import { LOGIN_WHISPER_LINES } from "@/lib/landing-voice";

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
  short = false,
}: {
  className?: string;
  short?: boolean;
}) {
  return (
    <BrandMark
      short={short}
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
  below,
  children,
  shortMark = false,
}: {
  title: string;
  note?: ReactNode;
  /** Quiet note under the tray (master login places the sign-in line here). */
  below?: ReactNode;
  children: ReactNode;
  /** Login uses the compact `lp.` mark. */
  shortMark?: boolean;
}) {
  return (
    <SiteFrame atmosphere="landing">
      <div className="relative flex min-h-[100dvh] flex-col">
        <HomeMark
          short={shortMark}
          className="absolute left-5 top-5 z-20 sm:left-8 sm:top-8"
        />
        <div
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
          aria-hidden
        >
          <p className="text-center font-display text-[clamp(2.4rem,8vw,5.5rem)] leading-[0.92] tracking-[-0.04em] text-[var(--ink)]/[0.07]">
            {LOGIN_WHISPER_LINES.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        </div>
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-20">
          <div className="w-full max-w-sm border border-[color-mix(in_srgb,var(--ink)_42%,transparent)] bg-[color-mix(in_srgb,#080808_78%,transparent)] px-5 py-6 backdrop-blur-[8px]">
            <h1 className="text-center font-display text-[2.4rem] leading-none tracking-tight">
              {title}
            </h1>
            {note ? (
              <p className="mt-3 text-center font-mono text-[13px] leading-relaxed text-[var(--ink)]/82">
                {note}
              </p>
            ) : null}
            {children}
          </div>
          {below ? (
            <div className="mt-8 max-w-sm text-center font-mono text-[12px] leading-relaxed text-[var(--ink-muted)]">
              {below}
            </div>
          ) : null}
        </div>
      </div>
    </SiteFrame>
  );
}

export function DocPage({
  title,
  tagline,
  wide = false,
  children,
}: {
  title: string;
  tagline?: ReactNode;
  wide?: boolean;
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
          {tagline ? (
            <p className="mt-4 max-w-xl font-display text-[1.05rem] italic leading-snug tracking-[-0.01em] text-[var(--ink-muted)]">
              {tagline}
            </p>
          ) : null}
          <div
            className={`mt-10 ${wide ? "max-w-5xl" : "max-w-xl"} space-y-10`}
          >
            {children}
          </div>
        </div>
        <footer className="px-8 pb-8 font-mono text-[12px] text-[var(--ink-muted)] sm:px-12 lg:px-20">
          <a href="/come" className="hover:text-[var(--ink)]">
            you&apos;re back
          </a>
          <span aria-hidden> · </span>
          <a href="/support" className="hover:text-[var(--ink)]">
            support
          </a>
          <span aria-hidden> · </span>
          <a href="/privacy" className="hover:text-[var(--ink)]">
            privacy
          </a>
          <span aria-hidden> · </span>
          <a href="/terms" className="hover:text-[var(--ink)]">
            terms
          </a>
        </footer>
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
      <h2 className="font-mono text-[12px] tracking-[0.08em] text-[var(--ink)]">
        {title}
      </h2>
      <div className="mt-3 space-y-1.5 font-mono text-[12px] leading-relaxed text-[var(--ink-muted)]">
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
  align = "center",
  whisper,
}: {
  title: string;
  children: ReactNode;
  /** Left-anchored account pages (yours, name settings, billing, delete). */
  align?: "center" | "left";
  /** Bottom-left ruled whisper (delete / sparse account pages). */
  whisper?: ReactNode;
}) {
  const left = align === "left";
  return (
    <SiteFrame atmosphere="default">
      <div className="flex min-h-[100dvh] flex-col">
        <HomeMark className="absolute left-5 top-5 z-20 sm:left-8 sm:top-8" />
        <div
          className={
            left
              ? "flex w-full flex-1 flex-col justify-start px-8 pb-16 pt-28 text-left sm:px-12 sm:pt-32 lg:px-20"
              : "mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-4 pb-10 pt-24 text-center sm:px-6"
          }
        >
          <div className={left ? "flex w-full max-w-lg flex-1 flex-col" : "w-full"}>
            <h1
              className={`font-display leading-none tracking-tight text-[var(--ink)] ${
                left
                  ? "text-[clamp(2.75rem,8vw,4.5rem)]"
                  : "text-[2.75rem]"
              }`}
            >
              {title}
            </h1>
            <div className="mt-10 flex w-full flex-1 flex-col space-y-0 text-left">
              {children}
            </div>
          </div>
        </div>
        {whisper ? (
          <div className="px-8 pb-8 sm:px-12 lg:px-20">
            <div className="max-w-lg border-t border-[var(--rule)] pt-4 font-mono text-[11px] text-[var(--ink-muted)]">
              {whisper}
            </div>
          </div>
        ) : null}
      </div>
    </SiteFrame>
  );
}
