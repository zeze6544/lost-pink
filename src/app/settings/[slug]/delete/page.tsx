import { notFound, redirect } from "next/navigation";
import { DeleteNameClient } from "@/components/DeleteNameClient";
import { AccountShell } from "@/components/SiteFrame";
import { listOwnedPages, pageHandle } from "@/lib/pages";
import { getAuthUserId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function DeleteNamePage({ params }: Props) {
  const { slug } = await params;
  const userId = await getAuthUserId();
  if (!userId) {
    redirect(`/come?next=/settings/${encodeURIComponent(slug)}/delete`);
  }

  const pages = await listOwnedPages(userId);
  const page = pages.find((p) => pageHandle(p) === slug);
  if (!page) notFound();

  const handle = pageHandle(page);

  return (
    <AccountShell title={`delete ${page.word || handle}`} align="left">
      <DeleteNameClient handle={handle} word={page.word || handle} />
    </AccountShell>
  );
}
