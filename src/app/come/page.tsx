import { redirect } from "next/navigation";
import { ComeClient } from "@/components/ComeClient";
import { AuthTray } from "@/components/SiteFrame";
import { CLAIM_COOKIE, parseClaimCookie } from "@/lib/claim";
import { isAuthConfigured, safeNextPath } from "@/lib/site";
import { getAuthUserId } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function ComePage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next, "/settings");
  const userId = await getAuthUserId();
  if (userId) {
    const cookieStore = await cookies();
    const parsed = parseClaimCookie(cookieStore.get(CLAIM_COOKIE)?.value);
    if (parsed) {
      // RSC cannot clear cookies — finish route claims + clears Secure cookie.
      redirect(`/api/claim/finish?next=${encodeURIComponent(next)}`);
    }
    redirect(next === "/come" ? "/settings" : next);
  }

  return (
    <AuthTray title="log in">
      {isAuthConfigured() ? (
        <ComeClient next={next} linkError={sp.error === "link"} />
      ) : (
        <p className="mt-4 text-[13px] text-[var(--ink-faint)]">not yet.</p>
      )}
    </AuthTray>
  );
}
