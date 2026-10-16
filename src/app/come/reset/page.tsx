import { ResetClient } from "@/components/ResetClient";
import { AuthTray } from "@/components/SiteFrame";
import { getAuthUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ResetPage() {
  const user = await getAuthUser();
  const local = user?.email?.split("@")[0] ?? null;
  const next = local ? `/${local}` : "/settings";

  return (
    <AuthTray
      title="a new password"
      note="this is lost.pink. pick a password for the site, the inbox, and mail apps. at least 8 characters."
    >
      {user ? (
        <ResetClient next={next} />
      ) : (
        <p className="mt-4 text-[13px] leading-relaxed text-[var(--ink)]">
          this link expired.{" "}
          <a href="/come/forgot" className="underline-offset-2 hover:underline">
            ask for another
          </a>
          .
        </p>
      )}
    </AuthTray>
  );
}
