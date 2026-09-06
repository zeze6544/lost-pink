import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/SettingsClient";
import { AccountShell } from "@/components/SiteFrame";
import { getMailboxByOwnerId } from "@/lib/mailbox-store";
import { listOwnedPages, pageHandle } from "@/lib/pages";
import { displayLostEmail } from "@/lib/slug";
import { getAuthUserId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/come?next=/settings");

  const pages = await listOwnedPages(userId);
  const mailbox = await getMailboxByOwnerId(userId);
  const primary = pages.find((p) => p.id === mailbox?.page_id) ?? pages[0] ?? null;
  const handle = primary ? pageHandle(primary) : null;
  const inbox = primary?.email_local
    ? displayLostEmail(primary.email_local)
    : handle
      ? `${handle}@lost.pink`
      : null;

  return (
    <AccountShell title="yours">
      <div className="flex flex-1 flex-col justify-center gap-10">
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
              const h = pageHandle(page);
              const address = page.email_local
                ? displayLostEmail(page.email_local)
                : `${h}@lost.pink`;
              return (
                <li key={page.id}>
                  <a
                    href={`/${h}`}
                    className="flex items-center justify-between gap-4 py-5 transition hover:bg-white/[0.02]"
                  >
                    <span className="min-w-0">
                      <span className="block font-display text-[1.35rem] leading-none tracking-[-0.02em] text-[var(--ink)]">
                        {page.word || h}
                      </span>
                      <span className="mt-1.5 block font-mono text-[11px] text-[var(--ink-muted)]">
                        {address}
                      </span>
                    </span>
                    <span
                      className="font-mono text-[16px] text-[var(--ink-muted)]"
                      aria-hidden
                    >
                      {">"}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mx-auto w-full max-w-xs">
          <SettingsClient
            inbox={inbox}
            mailboxId={mailbox?.id ?? null}
            recoveryEmail={mailbox?.recovery_email ?? null}
          />
          <div className="mt-6 flex flex-wrap justify-center gap-4 font-mono text-[12px] text-[var(--ink-muted)]">
            <a href="/subscription" className="underline-offset-2 hover:underline">
              subscription
            </a>
            <a href="/receipts" className="underline-offset-2 hover:underline">
              receipts
            </a>
            {handle ? (
              <a
                href={`/${handle}`}
                className="underline-offset-2 hover:underline"
              >
                open inbox
              </a>
            ) : null}
          </div>
        </div>

        <form action="/api/auth/signout" method="post" className="text-center">
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
