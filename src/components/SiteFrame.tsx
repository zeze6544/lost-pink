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
  children,
  shortMark = false,
}: {
  title: string;
  note?: ReactNode;
  children: ReactNode;
  /** Login uses the compact `lp.` mark. */
  shortMark?: boolean;
}) {
  return (
    <SiteFrame atmosphere="landing">
      <div className="flex min-h-[100dvh] flex-col">
        <HomeMark
          short={shortMark}
          className="absolute left-5 top-5 z-20 sm:left-8 sm:top-8"
        />
        <p
          className="pointer-events-none absolute inset-x-0 top-[18%] z-0 text-center font-display text-[clamp(2.4rem,8vw,5.5rem)] leading-none tracking-[-0.04em] text-[var(--ink)]/[0.12]"
          aria-hidden
        >
          {LOGIN_WHISPER}
        </p>
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-20">
          <div className="w-full max-w-sm border border-[color-mix(in_srgb,var(--ink)_42%,transparent)] bg-[color-mix(in_srgb,#080808_78%,transparent)] px-5 py-6 backdrop-blur-[8px]">
            <h1 className="font-display text-[2.4rem] leading-none tracking-tight">
              {title}
            </h1>
            {note ? (
              <p className="mt-3 font-mono text-[13px] leading-relaxed text-[var(--ink)]/82">
                {note}
              </p>
            ) : null}
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
  tagline,
  children,
}: {
  title: string;
  tagline?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SiteFrame atmosphere="default">
      <div className="docs-stack flex min-h-[100dvh] flex-col">
        <div className="relative z-10 w-full flex-1 px-8 py-16 sm:px-12 sm:py-20 lg:px-20">
          <HomeMark />
          <h1 className="mt-20 max-w-xl font-display text-[clamp(3.4rem,11vw,6rem)] leading-none tracking-tight text-[var(--ink)] sm:mt-24">
            {title}
          </h1>
          {tagline ? (
            <p className="mt-4 max-w-xl font-mono text-[13px] leading-relaxed text-[var(--ink-muted)]">
              {tagline}
            </p>
          ) : null}
          <div className="mt-10 max-w-xl divide-y divide-[var(--ink)]/12">
            {children}
          </div>
        </div>
        <SiteFooter
          left={
            <a href="/come">you&apos;re back</a>
          }
          center={
            <>
              <a href="/support">support</a>
              <span aria-hidden> · </span>
              <a href="/privacy">privacy</a>
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

/** Shared docs Q&A stack — support, privacy, and terms must use this. */
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

const DOCS_LINKABLE =
  /(support@lost\.pink|privacy@lost\.pink|connect a mail app)/g;

export function DocsAnswer({ text }: { text: string }) {
  const matches = text.match(DOCS_LINKABLE) ?? [];
  const parts = text.split(DOCS_LINKABLE);
  const nodes: ReactNode[] = [];
  parts.forEach((part, index) => {
    if (part) nodes.push(<span key={`t-${index}`}>{part}</span>);
    const token = matches[index];
    if (!token) return;
    if (token.includes("@")) {
      nodes.push(
        <a
          key={`${token}-${index}`}
          href={`mailto:${token}`}
          className="underline underline-offset-2"
        >
          {token}
        </a>,
      );
      return;
    }
    nodes.push(
      <a
        key={`setup-${index}`}
        href="/setup"
        className="underline underline-offset-2"
      >
        {token}
      </a>,
    );
  });
  return <p>{nodes}</p>;
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
          <div className={left ? "w-full max-w-lg" : "w-full"}>
            <h1
              className={`font-display leading-none tracking-tight text-[var(--ink)] ${
                left
                  ? "text-[clamp(2.75rem,8vw,4.5rem)]"
                  : "text-[2.75rem]"
              }`}
            >
              {title}
            </h1>
            <div className="mt-10 w-full space-y-0 text-left">{children}</div>
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
