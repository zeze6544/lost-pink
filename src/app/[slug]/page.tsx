import { Absence } from "@/components/Absence";
import { ShrineView } from "@/components/ShrineView";
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

  return (
    <ShrineView
      look={look}
      owned={owned}
      canComeBack={isAuthConfigured() && !owned}
      page={{
        id: page.id,
        slug: page.slug,
        word: page.word,
        line: page.line,
        look,
        bgUrl: page.bg_url,
        tokenUrl: page.token_url,
        emailLocal: page.email_local,
        kept: page.status === "kept",
        expiresAt: page.expires_at,
        foundCount: page.found_count,
        createdAt: page.created_at,
      }}
    />
  );
}
