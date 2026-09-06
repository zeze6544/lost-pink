import { notFound, redirect } from "next/navigation";
import { AccountShell } from "@/components/SiteFrame";
import { SettingsClient } from "@/components/SettingsClient";
import { getMailboxByPageId } from "@/lib/mailbox-store";
import { listOwnedPages, pageHandle } from "@/lib/pages";
import { displayLostEmail } from "@/lib/slug";
import { getAuthUserId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function NameSettingsPage({ params }: Props) {
  const { slug } = await params;
  const userId = await getAuthUserId();
  if (!userId) redirect(`/come?next=/settings/${encodeURIComponent(slug)}`);

  const pages = await listOwnedPages(userId);
  const page = pages.find((p) => pageHandle(p) === slug);
  if (!page) notFound();

  const handle = pageHandle(page);
  const mailbox = await getMailboxByPageId(page.id);
  const inbox = page.email_local
    ? displayLostEmail(page.email_local)
    : `${handle}@lost.pink`;

  const links = [
    { href: `/${handle}`, label: "page" },
    {
      href: page.email_local ? `/${handle}/mail` : `/${handle}`,
      label: "inbox",
    },
    { href: "/setup", label: "devices" },
    { href: "/billing", label: "billing" },
  ] as const;

  return (
    <AccountShell title={page.word || handle}>
      <div className="mx-auto w-full max-w-sm text-left">
        <p className="font-mono text-[12px] text-[var(--ink-muted)]">
          lost.pink/{handle}
        </p>
        <p className="mt-1 font-mono text-[12px] text-[var(--ink-muted)]">
          {inbox}
        </p>

        <ul className="mt-10 space-y-4">
          {links.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="font-display text-[1.45rem] leading-none tracking-[-0.02em] text-[var(--ink)] transition hover:opacity-80"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-12 border-t border-[var(--rule)] pt-8">
          <p className="mb-6 font-mono text-[11px] tracking-[0.08em] text-[var(--ink-muted)]">
            password · recovery
          </p>
          <SettingsClient
            inbox={inbox}
            mailboxId={mailbox?.id ?? null}
            recoveryEmail={mailbox?.recovery_email ?? null}
          />
        </div>

        <div className="mt-12 border-t border-[var(--rule)] pt-8">
          <a
            href={`/settings/${handle}/delete`}
            className="font-display text-[1.45rem] leading-none tracking-[-0.02em] text-[var(--ink)]"
          >
            delete
          </a>
          <p className="mt-2 font-mono text-[11px] text-[var(--ink-muted)]">
            removes the page, the inbox, and recovery access.
          </p>
        </div>

        <p className="mt-10">
          <a
            href="/settings"
            className="font-mono text-[12px] text-[var(--ink-muted)] underline-offset-2 hover:underline"
          >
            back to yours
          </a>
        </p>
      </div>
    </AccountShell>
  );
}
