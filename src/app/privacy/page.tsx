import { DocPage, DocSection } from "@/components/SiteFrame";
import { MAIL_HOST, MAIL_GRACE_DAYS, PAYMENTS_VIA } from "@/lib/product-rules";

export default function PrivacyPage() {
  return (
    <DocPage title="privacy" tagline="private, not anonymous.">
      <div className="divide-y divide-[var(--rule)]">
        <div className="pb-8">
          <DocSection title="WHAT IS PUBLIC">
            <p>
              your handle is the page path. because the address follows the
              handle, lost.pink/mercy implies mercy@lost.pink — whether or not
              the page prints it.
            </p>
          </DocSection>
        </div>

        <div className="py-8">
          <DocSection title="RECOVERY EMAIL">
            <p>used to get back in. never shown publicly. never sold.</p>
          </DocSection>
        </div>

        <div className="py-8">
          <DocSection title={PAYMENTS_VIA.toUpperCase()}>
            <p>
              payments are processed by {PAYMENTS_VIA}. not analytics.
            </p>
          </DocSection>
        </div>

        <div className="py-8">
          <DocSection title="MAIL CONTENTS">
            <p>
              mail is stored with our email host ({MAIL_HOST}) so the inbox can
              receive and sync. we do not use contents for ads or model training.
              after suspend, mail is kept {MAIL_GRACE_DAYS} days, then removed.
            </p>
          </DocSection>
        </div>

        <div className="py-8">
          <DocSection title="WE DO NOT TRAIN MODELS">
            <p>
              we do not use your messages or account data to train or improve
              models.
            </p>
          </DocSection>
        </div>

        <div className="pt-8">
          <p className="font-mono text-[12px] leading-relaxed text-[var(--ink-muted)]">
            questions?{" "}
            <a
              href="mailto:privacy@lost.pink"
              className="underline underline-offset-2"
            >
              privacy@lost.pink
            </a>
          </p>
        </div>
      </div>
    </DocPage>
  );
}
