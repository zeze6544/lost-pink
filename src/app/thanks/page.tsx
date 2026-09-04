import { Suspense } from "react";
import { ThanksClient } from "@/components/ThanksClient";
import { DEFAULT_LOOK } from "@/lib/looks";
import { getMailboxByPageId, toOwnerMailboxView } from "@/lib/mailbox-store";
import { getPolar } from "@/lib/polar";
import { getPageById, getPageBySlug, pageLook } from "@/lib/pages";
import { formatLeftHere } from "@/lib/voice";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{
    checkout_id?: string;
    checkoutId?: string;
    slug?: string;
    kept?: string;
    inbox?: string;
  }>;
};

export default async function ThanksPage({ searchParams }: Props) {
  const sp = await searchParams;
  let slug = sp.slug ?? "";
  let inbox = sp.inbox === "1";
  const checkoutId = sp.checkout_id ?? sp.checkoutId;
  let pageId: string | null = null;

  if (checkoutId) {
    const polar = getPolar();
    if (polar) {
      try {
        const checkout = await polar.checkouts.get({ id: checkoutId });
        const kind = checkout.metadata?.kind;
        if (
          kind === "mailbox" ||
          kind === "mailbox_once" ||
          kind === "mailbox_subscription" ||
          kind === "mailbox_month" ||
          kind === "mailbox_day"
        ) {
          inbox = true;
        }
        if (!slug) {
          const metaPageId = checkout.metadata?.page_id;
          if (typeof metaPageId === "string") {
            const byId = await getPageById(metaPageId);
            if (byId) {
              slug = byId.slug;
              pageId = byId.id;
            }
          } else if (typeof checkout.metadata?.slug === "string") {
            slug = checkout.metadata.slug;
          }
        }
      } catch {
        // Fall through — client still shows kept state without slug.
      }
    }
  }

  const page = slug ? await getPageBySlug(slug) : null;
  pageId = page?.id ?? pageId;
  const mailbox = pageId ? await getMailboxByPageId(pageId) : null;
  if (mailbox?.status === "awaiting_account") {
    const q = new URLSearchParams({ mailbox: mailbox.id });
    if (checkoutId) q.set("checkout_id", checkoutId);
    redirect(`/join?${q.toString()}`);
  }
  inbox =
    inbox ||
    mailbox?.status === "provisioning" ||
    mailbox?.status === "live" ||
    mailbox?.status === "failed";

  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] bg-[var(--paper)]" />
      }
    >
      <ThanksClient
        slug={page?.slug ?? slug}
        word={page?.word ?? slug}
        line={page?.line ?? null}
        look={page ? pageLook(page) : DEFAULT_LOOK}
        bgUrl={page?.bg_url ?? null}
        tokenUrl={page?.token_url ?? null}
        alias={page?.email_local ?? mailbox?.email_local ?? null}
        caption={page ? formatLeftHere(page.created_at) : null}
        inbox={inbox}
        pageId={pageId}
        initialMailbox={mailbox ? toOwnerMailboxView(mailbox) : null}
      />
    </Suspense>
  );
}
