import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CLAIM_COOKIE, parseClaimCookie } from "@/lib/claim";
import { claimPage, listOwnedPages } from "@/lib/pages";
import { displayLostEmail } from "@/lib/slug";
import { getAuthUserId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function YouPage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/come?next=/you");
  }

  const cookieStore = await cookies();
  const parsed = parseClaimCookie(cookieStore.get(CLAIM_COOKIE)?.value);
  if (parsed) {
    const claimed = await claimPage(parsed.pageId, userId, parsed.token);
    if (claimed) redirect(`/${claimed.slug}`);
  }

  const pages = await listOwnedPages(userId);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[var(--blush)] text-[var(--ink)]">
      <a
        href="/"
        className="absolute left-4 top-4 font-display text-lg text-[var(--ink)]/70 sm:left-8 sm:top-8"
      >
        lost.pink
      </a>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-3xl tracking-tight">yours</h1>
          {pages.length === 0 ? (
            <p className="mt-3 text-[13px] text-[var(--ink-muted)]">
              nothing of yours is here.
            </p>
          ) : (
            <ul className="mt-5 space-y-2">
              {pages.map((page) => (
                <li key={page.id}>
                  <a
                    href={`/${page.slug}`}
                    className="font-display text-2xl text-[var(--ink)]/80 transition hover:text-[var(--ink)]"
                  >
                    {page.word}
                  </a>
                  {page.email_local ? (
                    <p className="text-[11px] tracking-[0.12em] text-[var(--ink-faint)]">
                      {displayLostEmail(page.email_local)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <form action="/api/auth/signout" method="post" className="mt-8">
            <button
              type="submit"
              className="text-[12px] text-[var(--ink-faint)]"
            >
              leave
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
