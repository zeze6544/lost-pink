import { Suspense } from "react";
import { ThanksClient } from "@/components/ThanksClient";
import { DEFAULT_LOOK } from "@/lib/looks";
import { getPolar } from "@/lib/polar";
import { getPageById, getPageBySlug, pageLook } from "@/lib/pages";
import { formatLeftHere } from "@/lib/voice";

type Props = {
  searchParams: Promise<{ checkout_id?: string; slug?: string; kept?: string }>;
};

export default async function ThanksPage({ searchParams }: Props) {
  const sp = await searchParams;
  let slug = sp.slug ?? "";

  if (!slug && sp.checkout_id) {
    const polar = getPolar();
    if (polar) {
      try {
        const checkout = await polar.checkouts.get({ id: sp.checkout_id });
        const pageId = checkout.metadata?.page_id;
        if (typeof pageId === "string") {
          const page = await getPageById(pageId);
          if (page) slug = page.slug;
        } else if (typeof checkout.metadata?.slug === "string") {
          slug = checkout.metadata.slug;
        }
      } catch {
        // Fall through — client still shows kept state without slug.
      }
    }
  }

  const page = slug ? await getPageBySlug(slug) : null;

  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] bg-[var(--blush)]" />
      }
    >
      <ThanksClient
        slug={page?.slug ?? slug}
        word={page?.word ?? slug}
        line={page?.line ?? null}
        look={page ? pageLook(page) : DEFAULT_LOOK}
        bgUrl={page?.bg_url ?? null}
        tokenUrl={page?.token_url ?? null}
        alias={page?.email_local ?? null}
        caption={page ? formatLeftHere(page.created_at) : null}
      />
    </Suspense>
  );
}
