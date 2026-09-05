import { Absence } from "@/components/Absence";
import { MailApp } from "@/components/MailApp";
import { ShrineView } from "@/components/ShrineView";
import { getMailboxByPageId, toOwnerMailboxView } from "@/lib/mailbox-store";
import { pageHandle, pageLook, resolvePageForHandle } from "@/lib/pages";
import { isAuthConfigured, siteUrl } from "@/lib/site";
import { validateSlug } from "@/lib/slug";
import { getAuthUserId } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await resolvePageForHandle(slug.toLowerCase());
  if (!page) {
    return { title: slug.toLowerCase() };
  }
  const handle = pageHandle(page);
  return {
    title: page.word,
    description: page.line || `${page.word} on lost.pink`,
    openGraph: {
      title: page.word,
      description: page.line || `lost.pink/${handle}`,
      url: `${siteUrl()}/${handle}`,
    },
    twitter: {
      card: "summary_large_image",
      title: page.word,
      description: page.line || `lost.pink/${handle}`,
    },
  };
}

export default async function SlugPage({ params, searchParams }: Props) {
  const { slug: raw } = await params;
  const { view } = await searchParams;
  const asPublic = view === "public";
  const slug = raw.toLowerCase();
  const check = validateSlug(slug);
  if (!check.ok) {
    return <Absence />;
  }

  const page = await resolvePageForHandle(slug);
  if (!page) {
    return <Absence word={slug} />;
  }

  const handle = pageHandle(page);
  if (handle !== slug) {
    redirect(asPublic ? `/${handle}?view=public` : `/${handle}`);
  }

  const userId = await getAuthUserId();
  const owned =
    !asPublic && Boolean(page.owner_id && userId && page.owner_id === userId);

  const look = pageLook(page);
  const mailbox = owned ? await getMailboxByPageId(page.id) : null;
  const pageView = {
    id: page.id,
    slug: handle,
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
