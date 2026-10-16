import { JoinClient } from "@/components/JoinClient";
import { HomeMark, SiteFooter, SiteFrame } from "@/components/SiteFrame";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ mailbox?: string; checkout_id?: string; checkout?: string }>;
};

export default async function JoinPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <SiteFrame>
      <div className="flex min-h-[100dvh] flex-col">
        <HomeMark className="absolute left-4 top-4 z-20 sm:left-8 sm:top-8" />
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-20">
          <div className="quiet-tray w-full max-w-sm px-5 py-6">
            <JoinClient
              mailboxId={sp.mailbox ?? null}
              checkoutId={sp.checkout_id ?? sp.checkout ?? null}
            />
          </div>
        </div>
        <SiteFooter left="join" />
      </div>
    </SiteFrame>
  );
}
