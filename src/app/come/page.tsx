import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Atmosphere } from "@/components/Atmosphere";
import { ComeClient } from "@/components/ComeClient";
import { PhraseBackdrop } from "@/components/PhraseBackdrop";
import { CLAIM_COOKIE, parseClaimCookie } from "@/lib/claim";
import { claimPage } from "@/lib/pages";
import { isAuthConfigured, safeNextPath } from "@/lib/site";
import { getAuthUserId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function ComePage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next, "/you");
  const userId = await getAuthUserId();
  if (userId) {
    const cookieStore = await cookies();
    const parsed = parseClaimCookie(cookieStore.get(CLAIM_COOKIE)?.value);
    if (parsed) {
      const claimed = await claimPage(parsed.pageId, userId, parsed.token);
      if (claimed) redirect(`/${claimed.slug}`);
    }
    redirect(next === "/come" ? "/you" : next);
  }

  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden bg-[#050505] text-[var(--ink)]"
      style={
        {
          "--stage-a": "#161616",
          "--stage-b": "#242422",
          "--stage-c": "#0c0c0c",
          "--stage-ink": "#eceae4",
        } as React.CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0">
        <Atmosphere variant="landing" wash={1} />
        <PhraseBackdrop preset="fear-repetition" variant="site" />
      </div>

      <a
        href="/"
        className="brand-mark mark absolute left-4 top-4 z-20 inline-flex items-center gap-2 text-[13px] text-[var(--stage-ink)]/85 sm:left-8 sm:top-8"
      >
        <span className="brand-glyph" aria-hidden />
        lost.pink
      </a>

      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 py-20 sm:px-6">
        <div className="auth-card w-full max-w-sm px-5 py-6">
          <h1 className="font-display text-[2rem] leading-none tracking-tight text-[var(--ink)]">
            log in
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--ink-muted)]">
            sign in to your inbox with you@lost.pink and your password. left a
            page without an inbox? use a sign-in link instead.
          </p>
          {isAuthConfigured() ? (
            <ComeClient next={next} />
          ) : (
            <p className="mt-4 text-[13px] text-[var(--ink-faint)]">not yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
