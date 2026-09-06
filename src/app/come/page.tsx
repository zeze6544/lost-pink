import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ComeClient } from "@/components/ComeClient";
import { SiteFrame } from "@/components/SiteFrame";
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
    <SiteFrame>
      <div className="relative flex min-h-[100dvh] flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <a
          href="/"
          className="mark relative z-20 shrink-0 self-start text-[15px] text-[var(--ink)]/90 sm:text-base"
        >
          lost.pink
        </a>
        <div className="flex flex-1 flex-col items-center justify-center py-10 sm:py-14">
          <div className="quiet-tray w-full max-w-sm px-5 py-5 sm:px-6 sm:py-6">
            <h1 className="font-display text-3xl tracking-tight sm:text-[2rem]">
              come back
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink)]/75">
              sign in with you@lost.pink and your password. a shrine you left
              without an inbox still uses a quiet link.
            </p>
            {isAuthConfigured() ? (
              <ComeClient next={next} />
            ) : (
              <p className="mt-4 text-[13px] text-[var(--ink-faint)]">not yet.</p>
            )}
          </div>
        </div>
      </div>
    </SiteFrame>
  );
}
