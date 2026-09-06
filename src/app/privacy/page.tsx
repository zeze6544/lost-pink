import { DocPage, DocSection } from "@/components/SiteFrame";

export default function PrivacyPage() {
  return (
    <DocPage title="privacy">
      <div className="space-y-2 font-mono text-[13px] leading-relaxed text-[var(--ink)]">
        <p>your privacy is simple.</p>
        <p className="text-[var(--ink-muted)]">
          we collect the minimum to run lost.pink.
        </p>
      </div>

      <DocSection title="information we collect">
        <p>
          we collect your username and email address when you create an account.
        </p>
        <p>
          we collect payment information only to process your subscription.
        </p>
      </DocSection>

      <DocSection title="how we use it">
        <p>we use your information to provide and improve lost.pink.</p>
        <p>we do not sell your information.</p>
      </DocSection>

      <DocSection title="data retention">
        <p>we keep your data for as long as your account is active.</p>
        <p>you can request deletion at any time.</p>
      </DocSection>

      <DocSection title="your rights">
        <p>you can access, update, or delete your data anytime.</p>
        <p>email support@lost.pink and we&apos;ll take care of it.</p>
      </DocSection>

      <DocSection title="cookies">
        <p>we use essential cookies to keep you signed in.</p>
        <p>that&apos;s it.</p>
      </DocSection>

      <DocSection title="contact">
        <p>
          questions? email{" "}
          <a
            href="mailto:support@lost.pink"
            className="underline underline-offset-2"
          >
            support@lost.pink
          </a>
          .
        </p>
      </DocSection>
    </DocPage>
  );
}
