import { DocPage, DocQuestion } from "@/components/SiteFrame";

export default function TermsPage() {
  return (
    <DocPage title="terms">
      <DocQuestion q="what am i buying?">
        <p>
          lost.pink sells an @lost.pink inbox. you choose a username, pay A$1
          for a day, A$5 once for a month, A$25 once for a year, or A$25
          annually, create an account, and get you@lost.pink plus a public page
          at lost.pink/you. prices are in AUD. names are first come, first
          served.
        </p>
      </DocQuestion>
      <DocQuestion q="when does the inbox close?">
        <p>
          cancel, refund, or a failed renewal closes the inbox immediately.
          when paid time ends, the inbox closes but the name stays reserved.
          paid time extends from the later of today or the date it’s already
          paid through.
        </p>
      </DocQuestion>
      <DocQuestion q="what can i put on the page?">
        <p>
          you may dress the public page. do not publish illegal content,
          harassment, or anyone else’s personal data without permission. we may
          remove pages or close inboxes that break these rules or the law.
        </p>
      </DocQuestion>
      <DocQuestion q="how is mail handled?">
        <p>
          mail you send and receive passes through our servers so we can show
          it in the browser. we do not sell it or use it for ads. html letters
          are cleaned; remote images stay off until you ask.
        </p>
      </DocQuestion>
      <DocQuestion q="refunds?">
        <p>
          the service is provided as-is. refunds follow polar’s and your local
          consumer rules. write{" "}
          <a href="mailto:support@lost.pink">support@lost.pink</a>.
        </p>
      </DocQuestion>
    </DocPage>
  );
}
