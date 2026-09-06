import { redirect } from "next/navigation";
import { AccountShell } from "@/components/SiteFrame";
import { listOwnedPages, pageHandle } from "@/lib/pages";
import { displayLostEmail } from "@/lib/slug";
import { getAuthUserId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/come?next=/settings");

  const pages = await listOwnedPages(userId);

  return (
    <AccountShell title="yours">
      <div className="flex flex-1 flex-col justify-center">
        {pages.length === 0 ? (
          <div className="border-y border-[var(--rule)] py-6 text-center">
            <p className="font-mono text-[13px] text-[var(--ink-muted)]">
              nothing here yet.
            </p>
            <a
              href="/"
              className="mt-4 inline-block font-mono text-[12px] underline underline-offset-2"
            >
              get an inbox
            </a>
          </div>
        ) : (
          <ul className="mx-auto w-full max-w-xs divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
            {pages.map((page) => {
              const handle = pageHandle(page);
              const inbox = page.email_local
                ? displayLostEmail(page.email_local)
                : `${handle}@lost.pink`;
              return (
                <li key={page.id}>
                  <a
                    href={`/settings/${handle}`}
                    className="group flex items-center justify-between gap-4 py-5 transition hover:bg-white/[0.02]"
                  >
                    <span className="min-w-0">
                      <span className="block font-display text-[1.35rem] leading-none tracking-[-0.02em] text-[var(--ink)]">
                        {page.word || handle}
                      </span>
                      <span className="mt-1.5 block font-mono text-[11px] text-[var(--ink-muted)]">
                        {inbox}
                      </span>
                    </span>
                    <span
                      className="font-mono text-[16px] text-[var(--ink-muted)] transition group-hover:translate-x-1"
                      aria-hidden
                    >
                      →
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
        <form action="/api/auth/signout" method="post" className="mt-12 text-center">
          <button
            type="submit"
            className="cursor-pointer font-mono text-[12px] text-[var(--ink-muted)] underline-offset-2 hover:underline"
          >
            leave
          </button>
        </form>
      </div>
    </AccountShell>
  );
}
