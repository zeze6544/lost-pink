import { Atmosphere } from "@/components/Atmosphere";
import { BrandMark } from "@/components/BrandMark";
import { TERMS_WHISPER_LINES } from "@/lib/landing-voice";
import {
  FREE_PAGE_HOURS,
  graceCopy,
  MAIL_GRACE_DAYS,
  NAMES_ARE_FIXED,
  PAYMENTS_VIA,
  REFUND_DAYS,
} from "@/lib/product-rules";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. THE NAME IS THE PRODUCT",
    body: [
      "lost.pink gives you one name: a public page and a private inbox.",
      "private, not anonymous — we know your recovery email and payment references.",
      "the inbox is part of the name. we do not offer a page without an inbox, or an inbox without a page.",
      "you are responsible for what you send and receive.",
    ],
  },
  {
    title: "2. PAYMENTS, RENEWAL & REFUNDS",
    body: [
      `payments are processed via ${PAYMENTS_VIA}.`,
      "day and month plans are one-time. the year plan renews until you cancel.",
      `you can request a refund within ${REFUND_DAYS} days of purchase; after that, sales are final.`,
      "cancel anytime in the Polar customer portal. cancel stops the next renewal; it does not instantly wipe mail.",
    ],
  },
  {
    title: "3. WHEN PAYMENT ENDS",
    body: [
      "when paid time ends or renewal fails, the inbox is suspended.",
      `mail is kept for ${graceCopy()} (${MAIL_GRACE_DAYS} days) — not wiped at once.`,
      "after that window, the mailbox and its contents are removed.",
      "the name stays reserved while mail is retained; it may return to the pool only after deletion.",
    ],
  },
  {
    title: "4. NAMES",
    body: [
      NAMES_ARE_FIXED
        ? "names do not change. the page path and the address stay the same."
        : "names may change under published policy.",
      "reserved words (admin, support, abuse, postmaster, www, and others) cannot be claimed.",
      "impersonation, squatting for abuse, or illegal use can get the name suspended.",
      `a free page without purchase stays up to ${FREE_PAGE_HOURS} hours unless someone keeps it.`,
    ],
  },
  {
    title: "5. CONDUCT",
    body: [
      "abuse, spam, or phishing will get you suspended.",
      "do not use lost.pink to threaten, harass, or harm others.",
      "we cooperate with legal requests when required.",
    ],
  },
  {
    title: "6. CHANGES",
    body: [
      "we may update these terms. continued use means you accept the changes.",
      "this page is the human-readable summary. concrete billing and deletion rules above are binding for how lost.pink runs.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="relative min-h-[100dvh] text-[var(--ink)]">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <Atmosphere />
      </div>
      <div className="relative z-10 mx-auto grid min-h-[100dvh] max-w-6xl lg:grid-cols-[minmax(12rem,28%)_1px_1fr]">
        <aside className="relative hidden flex-col px-8 py-8 lg:flex">
          <BrandMark className="text-[13px] tracking-[0.04em]" />
          <p className="pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2 font-display text-[clamp(2rem,4.2vw,3.4rem)] leading-[0.95] tracking-[-0.03em] text-[var(--ink)]/[0.14]">
            {TERMS_WHISPER_LINES.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        </aside>
        <div className="hidden bg-[var(--rule)] lg:block" aria-hidden />
        <div className="flex min-h-[100dvh] flex-col px-6 py-8 sm:px-10 lg:px-14">
          <BrandMark className="text-[13px] tracking-[0.04em] lg:hidden" />
          <h1 className="mt-16 font-display text-[clamp(3rem,9vw,5.5rem)] leading-none tracking-tight lg:mt-10">
            terms
          </h1>
          <p className="mt-4 font-mono text-[11px] tracking-[0.06em] text-[var(--ink-muted)]">
            human-readable summary · effective may 20, 2025
          </p>
          <div className="mt-10 max-w-2xl divide-y divide-[var(--rule)]">
            {SECTIONS.map((section) => (
              <section key={section.title} className="py-6 first:pt-0">
                <h2 className="font-mono text-[12px] tracking-[0.08em] text-[var(--ink)]">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-2 font-mono text-[12px] leading-relaxed text-[var(--ink-muted)]">
                  {section.body.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
