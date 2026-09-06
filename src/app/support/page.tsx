import { DocPage, DocQuestion } from "@/components/SiteFrame";

export default function SupportPage() {
  return (
    <DocPage title="support">
      <DocQuestion q="how do i reach you?">
        <p>
          email <a href="mailto:support@lost.pink">support@lost.pink</a>.
          include the page name (lost.pink/yourword) and the polar order if you
          have it. a person will reply. no ticket maze, no phone queue.
        </p>
      </DocQuestion>
      <DocQuestion q="how do i sign in?">
        <p>
          you made a password when you paid. use{" "}
          <a href="mailto:you@lost.pink">you@lost.pink</a> and that password.
          forgot it? reset it through your recovery email. the password box
          appears after you enter your lost.pink address.
        </p>
      </DocQuestion>
      <DocQuestion q="can i use apple mail or gmail?">
        <p>
          yes. <a href="/setup/gmail">connect a mail app</a> has the IMAP and
          SMTP details for iPhone, Android and desktop. Gmail’s website stopped
          fetching new third-party inboxes, because apparently that was too
          useful. use the Gmail app or another mail client.
        </p>
      </DocQuestion>
      <DocQuestion q="refunds and cancellations?">
        <p>
          polar handles the money. refunds, cancelled yearly plans and failed
          renewals close the inbox. when your paid time ends, the inbox goes
          dark, but the name stays yours in case you come back.
        </p>
      </DocQuestion>
    </DocPage>
  );
}
