import { Absence } from "@/components/Absence";
import { WriteLetter } from "@/components/WriteLetter";
import { getMailboxByPageId } from "@/lib/mailbox-store";
import { getPageByHandle, pageHandle } from "@/lib/pages";
import { siteUrl } from "@/lib/site";
import { validateSlug } from "@/lib/slug";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageByHandle(slug.toLowerCase());
  if (!page) return { title: slug.toLowerCase() };
  const handle = pageHandle(page);
  return {
    title: `write ${page.word}`,
    description: `a letter for ${page.word} on lost.pink`,
    openGraph: {
      title: `write ${page.word}`,
      url: `${siteUrl()}/${handle}/write`,
    },
  };
}

export default async function WritePage({ params }: Props) {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const check = validateSlug(slug);
  if (!check.ok) return <Absence />;

  const page = await getPageByHandle(slug);
  if (!page) return <Absence word={slug} />;
  const handle = pageHandle(page);
  if (handle !== slug) redirect(`/${handle}/write`);

  const mailbox = await getMailboxByPageId(page.id);
  if (!mailbox || mailbox.status !== "live" || !page.email_local) {
    return <Absence word={slug} />;
  }

  return (
    <WriteLetter slug={handle} word={page.word} alias={page.email_local} />
  );
}
