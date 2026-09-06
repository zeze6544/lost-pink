import { Absence } from "@/components/Absence";
import { MailApp } from "@/components/MailApp";
import { ShrineView } from "@/components/ShrineView";
import { getMailboxByPageId, toOwnerMailboxView } from "@/lib/mailbox-store";
import { getPageBySlug, pageLook } from "@/lib/pages";
import { isAuthConfigured, siteUrl } from "@/lib/site";
import { validateSlug } from "@/lib/slug";
import { getAuthUserId } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug.toLowerCase());
  if (!page) {
    return { title: slug.toLowerCase() };
  }
  return {
    title: page.word,
    description: page.line || `${page.word} on lost.pink`,
    openGraph: {
      title: page.word,
      description: page.line || `lost.pink/${page.slug}`,
      url: `${siteUrl()}/${page.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: page.word,
      description: page.line || `lost.pink/${page.slug}`,
    },
  };
}

export default async function SlugPage({ params }: Props) {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const check = validateSlug(slug);
  if (!check.ok) {
    return <Absence />;
  }

  const page = await getPageBySlug(slug);
  if (!page) {
    return <Absence word={slug} />;
  }

  const look = pageLook(page);
  const userId = await getAuthUserId();
  const owned = Boolean(page.owner_id && userId && page.owner_id === userId);
  const mailbox = owned ? await getMailboxByPageId(page.id) : null;
  const pageView = {
    id: page.id,
    slug: page.slug,
    word: page.word,
    line: page.line,
    look,
    bgUrl: page.bg_url,
    tokenUrl: page.token_url,
    emailLocal: page.email_local,
    kept: page.status === "kept",
    mailboxStatus: page.mailbox_status,
    mailboxExpiresAt: page.mailbox_expires_at,
    mailbox: mailbox ? toOwnerMailboxView(mailbox) : null,
    expiresAt: page.expires_at,
    foundCount: page.found_count,
    createdAt: page.created_at,
  };

  if (owned && mailbox) {
    const status =
      mailbox.status === "live"
        ? "live"
        : mailbox.status === "dark"
          ? "dark"
          : mailbox.status === "failed"
            ? "failed"
            : "arriving";
    return <MailApp page={pageView} look={look} status={status} />;
  }

  return (
    <ShrineView
      look={look}
      owned={owned}
      canComeBack={isAuthConfigured() && !owned}
      page={pageView}
    />
  );
}
