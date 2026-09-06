import { DocPage, DocSection } from "@/components/SiteFrame";
import {
  graceCopy,
  MAIL_HOST,
  MAIL_GRACE_DAYS,
  PAYMENTS_VIA,
} from "@/lib/product-rules";

export default function PrivacyPage() {
  return (
    <DocPage title="privacy">
      <div className="space-y-2 font-mono text-[13px] leading-relaxed text-[var(--ink)]">
        <p>private, not anonymous.</p>
        <p className="text-[var(--ink-muted)]">
          one name is a public page and an inbox. that has consequences for what
          can stay private.
        </p>
      </div>

      <DocSection title="what we keep">
        <p>
          the name you claim, the look of the public page, optional photos and a
          line, {PAYMENTS_VIA} payment references, your sign-in as you@lost.pink,
          and a recovery email.
        </p>
      </DocSection>

      <DocSection title="mail contents">
        <p>
          mail is stored with our email infrastructure ({MAIL_HOST}) so your
          inbox can receive and sync on phone and computer. we do not use message
          contents for advertising or model training.
        </p>
        <p>
          when paid time ends, the inbox is suspended. mail is retained for{" "}
          {graceCopy()} ({MAIL_GRACE_DAYS} days), then removed with the mailbox.
          deleting the account removes the page, the inbox, and the recovery
          link.
        </p>
      </DocSection>

      <DocSection title="what is public">
        <p>
          your handle is public as the page path. because the address always
          follows the handle, anyone who sees lost.pink/mercy can infer
          mercy@lost.pink — whether or not the page prints the address.
        </p>
        <p>
          recovery email, {PAYMENTS_VIA} ids, and mailbox secrets stay private.
        </p>
      </DocSection>

      <DocSection title="payments">
        <p>
          payment details are handled by {PAYMENTS_VIA}. we do not store your
          full card number.
        </p>
      </DocSection>

      <DocSection title="cookies">
        <p>essential cookies keep you signed in. that&apos;s it.</p>
      </DocSection>

      <DocSection title="contact">
        <p>
          questions?{" "}
          <a
            href="mailto:privacy@lost.pink"
            className="underline underline-offset-2"
          >
            privacy@lost.pink
          </a>{" "}
          or{" "}
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
