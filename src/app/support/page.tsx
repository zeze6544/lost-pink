import { DocPage, DocQuestion } from "@/components/SiteFrame";
import { graceCopy, MAIL_GRACE_DAYS, PAYMENTS_VIA } from "@/lib/product-rules";

export default function SupportPage() {
  return (
    <DocPage title="support">
      <DocQuestion q="how do i reach you?">
        <p>
          email <a href="mailto:support@lost.pink">support@lost.pink</a>.
          include the page name (lost.pink/yourword) and the {PAYMENTS_VIA.toLowerCase()}{" "}
          order if you have it. a person will reply.
        </p>
      </DocQuestion>
      <DocQuestion q="how do i sign in?">
        <p>
          use you@lost.pink and the password you set at join. forgot it? reset
          through your recovery email — not the lost.pink address. left a page
          without opening the inbox yet? we can send a sign-in link to recovery.
        </p>
      </DocQuestion>
      <DocQuestion q="mail app setup">
        <p>
          start at <a href="/setup/gmail">connect a mail app</a>. choose gmail
          app, apple mail on iphone, outlook, android (gmail app), or manual.
          the next screen names the exact client and the migadu hosts. password
          is the one you set on lost.pink — not a google app password.
        </p>
      </DocQuestion>
      <DocQuestion q="mail not arriving / sending">
        <p>
          confirm the inbox is still paid and not suspended. check spam in the
          client. for sending, smtp must use smtp.migadu.com with your
          you@lost.pink login. still stuck? write support with the exact error.
        </p>
      </DocQuestion>
      <DocQuestion q="billing, refunds, renewals">
        <p>
          {PAYMENTS_VIA.toLowerCase()} handles the money. refunds within 7 days
          of purchase when approved. the year plan renews until you cancel in
          the portal. day and month are one-time.
        </p>
      </DocQuestion>
      <DocQuestion q="when payment ends">
        <p>
          the inbox suspends when paid time ends or renewal fails. mail is kept
          for {graceCopy()} ({MAIL_GRACE_DAYS} days) — not wiped at once. after
          that, the mailbox is removed. the name stays reserved while mail is
          retained.
        </p>
      </DocQuestion>
      <DocQuestion q="abuse / contact">
        <p>
          report abuse to <a href="mailto:abuse@lost.pink">abuse@lost.pink</a>.
          privacy questions:{" "}
          <a href="mailto:privacy@lost.pink">privacy@lost.pink</a>.
        </p>
      </DocQuestion>
    </DocPage>
  );
}
