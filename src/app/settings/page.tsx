import { redirect } from "next/navigation";
import { AccountShell } from "@/components/SiteFrame";
import { listMailboxesByPageIds } from "@/lib/mailbox-store";
import { listOwnedPages, pageHandle } from "@/lib/pages";
import { NAMES_ARE_FIXED, nameIsPageAndAddress } from "@/lib/product-rules";
import { displayLostEmail } from "@/lib/slug";
import { getAuthUserId } from "@/lib/supabase/server";
import { formatPaidThrough } from "@/lib/voice";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/come?next=/settings");

  const pages = await listOwnedPages(userId);
  const mailboxes = await listMailboxesByPageIds(pages.map((page) => page.id));

  return (
    <AccountShell title="yours" align="left">
      {NAMES_ARE_FIXED ? (
        <p className="mb-8 font-mono text-[12px] text-[var(--ink-muted)]">
          {nameIsPageAndAddress()}
        </p>
      ) : null}
      {pages.length === 0 ? (
        <div className="border-y border-[var(--rule)] py-6">
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
        <ul className="w-full max-w-md divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
          {pages.map((page) => {
            const handle = pageHandle(page);
            const inbox = page.email_local
              ? displayLostEmail(page.email_local)
              : `${handle}@lost.pink`;
            const paid =
              mailboxes.get(page.id)?.paid_through ?? page.mailbox_expires_at;
            return (
              <li key={page.id}>
                <a
                  href={`/settings/${handle}`}
                  className="group flex items-center justify-between gap-6 py-5 transition hover:opacity-80"
                >
                  <span className="min-w-0">
                    <span className="block font-display text-[1.45rem] leading-none tracking-[-0.02em] text-[var(--ink)]">
                      {page.word || handle}
                    </span>
                    {paid ? (
                      <span className="mark mt-2 block text-[11px] text-[var(--ink-muted)]">
                        {formatPaidThrough(paid)}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex min-w-0 items-center gap-2 font-mono text-[12px] text-[var(--ink-muted)]">
                    <span className="truncate">{inbox}</span>
                    <span
                      className="text-[16px] transition group-hover:translate-x-0.5"
                      aria-hidden
                    >
                      →
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      <form action="/api/auth/signout" method="post" className="mt-14">
        <button
          type="submit"
          className="cursor-pointer font-mono text-[12px] text-[var(--ink-muted)] underline-offset-2 hover:underline"
        >
          leave
        </button>
      </form>
    </AccountShell>
  );
}
