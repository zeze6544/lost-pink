import { Atmosphere } from "@/components/Atmosphere";
import { BrandMark } from "@/components/BrandMark";
import { TERMS_WHISPER_LINES } from "@/lib/landing-voice";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. THE INBOX IS THE PRODUCT",
    body: [
      "lost.pink provides you with a private, anonymous inbox.",
      "we do not read, review, or moderate your messages.",
      "you are responsible for what you receive and how you respond.",
    ],
  },
  {
    title: "2. PAYMENTS & REFUNDS",
    body: [
      "all payments are processed securely via Polar.",
      "you can request a refund within 7 days of purchase.",
      "after that window, all sales are final.",
      "refunds, when approved, will be issued back to your original payment method via Polar.",
    ],
  },
  {
    title: "3. ALIASES & USERNAMES",
    body: [
      "usernames and aliases must not impersonate others or violate applicable laws.",
      "we reserve the right to suspend or remove accounts that abuse anonymity.",
    ],
  },
  {
    title: "4. YOUR CONDUCT",
    body: [
      "do not use lost.pink to threaten, harass, or harm others.",
      "do not attempt to deanonymize or reveal the identity of another user.",
      "we cooperate with legal requests for user data in cases of credible threats or abuse.",
    ],
  },
  {
    title: "5. CHANGES",
    body: [
      "we may update these terms at any time.",
      "continued use of lost.pink means you accept the changes.",
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
            effective date: may 20, 2025
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
