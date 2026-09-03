import type { Metadata } from "next";
import { Absence } from "@/components/Absence";
import { PageActions } from "@/components/PageActions";
import { PinkStage } from "@/components/PinkStage";
import { getPageBySlug, pageLook } from "@/lib/pages";
import { siteUrl } from "@/lib/site";
import { validateSlug } from "@/lib/slug";
import { formatLeftHere } from "@/lib/voice";

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
  const kept = page.status === "kept";

  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden"
        style={{ ["--tray-h" as string]: "8rem" }}
    >
      <PinkStage
        word={page.word}
        look={look}
        line={page.line}
        bgUrl={page.bg_url}
        tokenUrl={page.token_url}
        caption={formatLeftHere(page.created_at)}
        animate
      />
      <div className="absolute left-4 top-4 z-20 sm:left-8 sm:top-8">
        <a
          href="/"
          className="font-display text-lg text-[var(--ink)]/70 transition hover:text-[var(--ink)]"
        >
          lost.pink
        </a>
      </div>
      <PageActions
        pageId={page.id}
        slug={page.slug}
        word={page.word}
        line={page.line}
        look={look}
        bgUrl={page.bg_url}
        tokenUrl={page.token_url}
        kept={kept}
        expiresAt={page.expires_at}
        foundCount={page.found_count}
      />
    </main>
  );
}
