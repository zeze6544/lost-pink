"use client";

import { useEffect, useState } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { BrandMark } from "@/components/BrandMark";
import { SiteFooter } from "@/components/SiteFrame";
import { KEPT_WHISPER } from "@/lib/landing-voice";
import { provisionProgress } from "@/lib/mailbox-lifecycle";
import type { OwnerMailboxView } from "@/lib/mailbox-view";

type Props = {
  slug: string;
  word: string;
  line: string | null;
  look: unknown;
  bgUrl: string | null;
  tokenUrl: string | null;
  alias?: string | null;
  caption?: string | null;
  inbox?: boolean;
  pageId?: string | null;
  initialMailbox?: OwnerMailboxView | null;
};

export function ThanksClient({
  slug,
  word,
  alias = null,
  inbox = false,
  pageId = null,
  initialMailbox = null,
}: Props) {
  const [mailbox, setMailbox] = useState(initialMailbox);
  const shown = word || slug || "kept";
  const status = mailbox?.status ?? null;
  const live = status === "live";
  const failed = status === "failed";
  const awaitingAccount = status === "awaiting_account";
  const progress = mailbox
    ? provisionProgress(mailbox.status, mailbox.provisionStep)
    : null;

  useEffect(() => {
    if (!inbox || !pageId) return;
    if (status === "live" || status === "failed") return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(
          `/api/mailbox/status?pageId=${encodeURIComponent(pageId)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { mailbox?: OwnerMailboxView | null };
        if (!cancelled && data.mailbox) setMailbox(data.mailbox);
      } catch {
        // keep last known progress
      }
    };
    const id = setInterval(() => void tick(), 2500);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [inbox, pageId, status]);

  useEffect(() => {
    if (awaitingAccount && mailbox?.id) {
      window.location.replace(`/join?mailbox=${encodeURIComponent(mailbox.id)}`);
    }
  }, [awaitingAccount, mailbox?.id]);

  const steps = [
    {
      key: "payment",
      label: "payment received",
      done: Boolean(
        progress?.paymentReceived ||
          progress?.creatingInbox ||
          progress?.invitationSent ||
          progress?.live,
      ),
    },
    {
      key: "inbox",
      label: "creating inbox",
      done: Boolean(
        progress?.creatingInbox || progress?.invitationSent || progress?.live,
      ),
    },
    {
      key: "invite",
      label: "invitation sent",
      done: Boolean(progress?.invitationSent || progress?.live),
    },
  ];

  const subtitle = !inbox
    ? `${shown} is yours.`
    : live
      ? `${shown} is yours. the inbox is open.`
      : failed
        ? `${shown} is yours. the inbox needs help.`
        : `${shown} is yours. the inbox is opening.`;

  return (
    <div className="lp-shell relative min-h-[100dvh] overflow-hidden bg-[var(--paper)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 z-0">
        <Atmosphere wash={1} variant="landing" />
      </div>

      <header className="absolute left-0 top-0 z-20 p-5 sm:p-8">
        <BrandMark className="text-[13px] tracking-[0.04em] text-[var(--ink)]/90" />
      </header>

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20 pt-24">
          <h1 className="text-center font-display text-[clamp(3.2rem,10vw,5.5rem)] font-medium leading-none tracking-[-0.04em]">
            {KEPT_WHISPER}
          </h1>
          <p className="mark mt-5 max-w-sm text-center text-[13px] tracking-[0.03em] text-[var(--ink-muted)]">
            {subtitle}
          </p>

          {inbox ? (
            <ol className="mt-12 space-y-0">
              {steps.map((step, i) => (
                <li key={step.key} className="flex gap-3">
                  <div className="flex w-4 flex-col items-center">
                    <span
                      className={`mt-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                        step.done
                          ? "border-[var(--ink)]"
                          : "border-[var(--ink-muted)]"
                      }`}
                      aria-hidden
                    >
                      {step.done ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink)]" />
                      ) : null}
                    </span>
                    {i < steps.length - 1 ? (
                      <span
                        className="my-1 w-px flex-1 bg-[var(--rule)]"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <p
                    className={`pb-5 font-mono text-[13px] ${
                      step.done ? "text-[var(--ink)]" : "text-[var(--ink-muted)]"
                    }`}
                  >
                    {step.label}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mark mt-10 text-[12px] text-[var(--ink-muted)]">
              {shown} isn&apos;t going anywhere.
            </p>
          )}

          {failed ? (
            <p className="mark mt-6 text-center text-[12px] text-[var(--ink)]">
              <a href="/support" className="underline underline-offset-2">
                write support
              </a>
            </p>
          ) : null}
        </div>

        <SiteFooter
          left={<span className="sr-only">lost.pink</span>}
          center={
            <>
              {slug ? <a href={`/${slug}`}>open the page</a> : null}
              {slug && (live || awaitingAccount || failed || inbox) ? (
                <span aria-hidden> · </span>
              ) : null}
              {live ? (
                <>
                  {slug ? (
                    <a href={`/${slug}/mail`}>open inbox</a>
                  ) : (
                    <a href="/settings">yours</a>
                  )}
                  <span aria-hidden> · </span>
                  <a href="/setup">setup mail</a>
                </>
              ) : awaitingAccount ? (
                <>
                  <a href={mailbox?.id ? `/join?mailbox=${mailbox.id}` : "/join"}>
                    finish join
                  </a>
                  <span aria-hidden> · </span>
                  <a href="/setup">setup mail</a>
                </>
              ) : failed ? (
                <a href="/support">write support</a>
              ) : inbox ? (
                <a href="/setup">setup mail</a>
              ) : null}
            </>
          }
          right={null}
          className="lp-footer-flat"
        />
      </div>
    </div>
  );
}
