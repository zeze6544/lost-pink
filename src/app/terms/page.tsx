import { DocPage } from "@/components/SiteFrame";

export default function TermsPage() {
  return (
    <DocPage title="terms">
      <p>
        lost.pink sells an @lost.pink inbox. You choose a name, pay for a day,
        a month, a year once, or a yearly renewal, create an account, and get
        you@lost.pink plus a public page at lost.pink/you. Names are first come,
        first served.
      </p>
      <p>
        Cancel, refund, or a failed yearly charge closes the inbox immediately.
        A dark mailbox keeps the alias reserved so you can open it again.
        One-year renewals extend from the later of today or the current
        paid-through date.
      </p>
      <p>
        You may dress the public page. Do not publish illegal content,
        harassment, or anyone else’s personal data without permission. We may
        remove pages or close inboxes that break these rules or the law.
      </p>
      <p>
        Mail you send and receive passes through our servers so we can show it
        to you in the browser. We do not sell it or use it for ads. HTML
        letters are cleaned; remote images stay off until you ask.
      </p>
      <p>
        The service is provided as-is. Refunds follow Polar’s and your local
        consumer rules. Write{" "}
        <a href="mailto:support@lost.pink">support@lost.pink</a>.
      </p>
    </DocPage>
  );
}
