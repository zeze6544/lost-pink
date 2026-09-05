import { ForgotClient } from "@/components/ForgotClient";
import { AuthTray } from "@/components/SiteFrame";
import { isAuthConfigured } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ email?: string }>;
};

export default async function ForgotPage({ searchParams }: Props) {
  const sp = await searchParams;
  const email = typeof sp.email === "string" ? sp.email : "";

  return (
    <AuthTray
      title="forgot the password"
      note="we email a reset link to your recovery address, not your @lost.pink inbox. the link opens a password form here on lost.pink."
    >
      {isAuthConfigured() ? (
        <ForgotClient initialEmail={email} />
      ) : (
        <p className="mt-4 text-[13px] text-[var(--ink-faint)]">not yet.</p>
      )}
      <p className="mt-5 text-[11px] text-[var(--ink-muted)]">
        <a href="/come" className="underline-offset-2 hover:underline">
          back to log in
        </a>
      </p>
    </AuthTray>
  );
}
