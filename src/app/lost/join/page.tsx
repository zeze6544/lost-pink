import { JoinClient } from "@/components/JoinClient";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ mailbox?: string; checkout_id?: string; checkout?: string }>;
};

export default async function JoinPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[var(--paper)] text-[var(--ink)]">
      <a
        href="/"
        className="mark absolute left-4 top-4 text-sm text-[var(--ink)]/85 sm:left-8 sm:top-8"
      >
        lost.pink
      </a>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <div className="quiet-tray w-full max-w-sm px-5 py-5">
          <JoinClient
            mailboxId={sp.mailbox ?? null}
            checkoutId={sp.checkout_id ?? sp.checkout ?? null}
          />
        </div>
      </div>
    </main>
  );
}
