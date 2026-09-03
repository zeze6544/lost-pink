export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-[var(--ink)]">
      <a href="/" className="font-display text-xl">
        lost.pink
      </a>
      <h1 className="mt-10 font-display text-4xl">Terms</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-[var(--ink-muted)]">
        <p>
          lost.pink lets you publish a short word as a pink shrine. Free pages last
          48 hours. A one-time keep fee makes a name permanent. Looks, photos, and
          the optional line freeze at publish, unless you come back to tend your
          own shrine. Keep is separate: it preserves the name from expiry.
        </p>
        <p>
          Do not publish illegal content, harassment, or anyone else’s personal
          data without permission. We may remove pages that break these rules or
          the law.
        </p>
        <p>
          Words are first come first serve for kept pages. We do not guarantee
          availability of any particular slug forever if it was never kept.
        </p>
        <p>
          The service is provided as-is. Refunds for keep purchases follow Polar’s
          and your local consumer rules.
        </p>
      </div>
    </main>
  );
}
