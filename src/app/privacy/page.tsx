import { DocPage, DocSection } from "@/components/SiteFrame";

export default function PrivacyPage() {
  return (
    <DocPage title="privacy">
      <div className="space-y-2 font-mono text-[13px] leading-relaxed text-[var(--ink)]">
        <p>Your privacy is simple.</p>
        <p className="text-[var(--ink-muted)]">
          We collect the minimum to run lost.pink.
        </p>
      </div>

      <DocSection title="Information we collect">
        <p>
          We collect your username and email address when you create an account.
        </p>
        <p>
          We collect payment information only to process your subscription.
        </p>
      </DocSection>

      <DocSection title="How we use it">
        <p>We use your information to provide and improve lost.pink.</p>
        <p>We do not sell your information.</p>
      </DocSection>

      <DocSection title="Data retention">
        <p>We keep your data for as long as your account is active.</p>
        <p>You can request deletion at any time.</p>
      </DocSection>

      <DocSection title="Your rights">
        <p>You can access, update, or delete your data anytime.</p>
        <p>Email support@lost.pink and we&apos;ll take care of it.</p>
      </DocSection>

      <DocSection title="Cookies">
        <p>We use essential cookies to keep you signed in.</p>
        <p>That&apos;s it.</p>
      </DocSection>

      <DocSection title="Contact">
        <p>
          Questions? Email{" "}
          <a href="mailto:support@lost.pink" className="underline underline-offset-2">
            support@lost.pink
          </a>
          .
        </p>
      </DocSection>
    </DocPage>
  );
}
