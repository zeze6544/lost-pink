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
  const next = safeNextPath(sp.next, "/settings");
  const userId = await getAuthUserId();
  if (userId) {
    const cookieStore = await cookies();
    const parsed = parseClaimCookie(cookieStore.get(CLAIM_COOKIE)?.value);
    if (parsed) {
      const claimed = await claimPage(parsed.pageId, userId, parsed.token);
      if (claimed) redirect(`/${claimed.slug}`);
    }
    redirect(next === "/come" ? "/settings" : next);
  }

  return (
    <AuthTray
      title="log in"
      shortMark
      below={
        isAuthConfigured() ? (
          <>
            left a page without an inbox?
            <br />
            <a href="/come/forgot" className="underline underline-offset-2">
              we&apos;ll send a sign-in link.
            </a>
          </>
        ) : null
      }
    >
      {isAuthConfigured() ? (
        <ComeClient next={next} />
      ) : (
        <p className="mt-4 text-[13px] text-[var(--ink-faint)]">not yet.</p>
      )}
    </AuthTray>
  );
}
