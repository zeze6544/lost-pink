import { notFound, redirect } from "next/navigation";
import { SettingsClient } from "@/components/SettingsClient";
import { AccountShell } from "@/components/SiteFrame";
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
  const inbox = page.email_local
    ? displayLostEmail(page.email_local)
    : `${handle}@lost.pink`;
  const mailbox = await getMailboxByPageId(page.id);

  const links = [
    { href: `/${handle}`, label: "page" },
    { href: "/setup", label: "inbox" },
    { href: "#password", label: "password" },
    { href: "#recovery", label: "recovery" },
    { href: "/setup", label: "devices" },
    { href: "/billing", label: "billing" },
  ] as const;

  return (
    <AccountShell title={page.word || handle} align="left">
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

      <div className="mt-12 max-w-[14rem] border-t border-[var(--rule)] pt-8">
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

      <SettingsClient
        inbox={page.email_local ? inbox : null}
        mailboxId={mailbox?.id ?? null}
        recoveryEmail={mailbox?.recovery_email ?? null}
      />
    </AccountShell>
  );
}
