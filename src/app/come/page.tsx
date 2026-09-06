import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ComeClient } from "@/components/ComeClient";
import { AuthTray } from "@/components/SiteFrame";
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
    <AuthTray
      title="log in"
      note="sign in to your inbox with you@lost.pink and your password. left a page without an inbox? use a sign-in link instead."
    >
      {isAuthConfigured() ? (
        <ComeClient next={next} />
      ) : (
        <p className="mt-4 text-[13px] text-[var(--ink-faint)]">not yet.</p>
      )}
    </AuthTray>
  );
}
