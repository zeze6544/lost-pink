import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ComeClient } from "@/components/ComeClient";
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
    <main className="relative min-h-[100dvh] overflow-hidden bg-[var(--blush)] text-[var(--ink)]">
      <a
        href="/"
        className="absolute left-4 top-4 font-display text-lg text-[var(--ink)]/70 sm:left-8 sm:top-8"
      >
        lost.pink
      </a>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <div className="quiet-tray w-full max-w-sm px-5 py-5">
          <h1 className="font-display text-3xl tracking-tight">come back</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-muted)]">
            a quiet link, so you can tend what you left. this is not keep — keep
            preserves the name from fading.
          </p>
          {isAuthConfigured() ? (
            <ComeClient next={next} />
          ) : (
            <p className="mt-4 text-[13px] text-[var(--ink-faint)]">
              not yet.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
