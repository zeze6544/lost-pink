export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-[var(--ink)]">
      <a href="/" className="font-display text-xl">
        lost.pink
      </a>
      <h1 className="mt-10 font-display text-4xl">Privacy</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-[var(--ink-muted)]">
        <p>
          We store the word you publish, an optional inscription, the look you
          chose (palette, type, motif, font), optional photo URLs, a found
          count, when the shrine was created, whether it is free or kept, and
          payment references from Polar when you keep a name. If you come back
          to tend a shrine, we also store your sign-in email and which pages you
          own. An optional @lost.pink name is display-only; we do not run a
          mailbox.
        </p>
        <p>
          Photos are jpeg, png, or webp only. Free pages expire after 48 hours
          and are deleted with their photos. Kept pages (and their photos) stay
          until you ask us to remove them.
        </p>
        <p>
          We do not require an account to publish. We do not sell personal data.
          Payment details are handled by Polar, not stored on lost.pink.
        </p>
        <p>
          Contact: privacy@lost.pink
        </p>
      </div>
    </main>
  );
}
