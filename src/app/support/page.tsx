import { DocPage } from "@/components/SiteFrame";

export default function SupportPage() {
  return (
    <DocPage title="support">
      <p>
        write <a href="mailto:support@lost.pink">support@lost.pink</a>. include
        the name (lost.pink/yourword) and, if you have it, the Polar order.
      </p>
      <p>
        sign in with you@lost.pink and the password you set. forgot it? we write
        the recovery email, not the inbox you’re locked out of.
      </p>
      <p>
        to read the same mail in Gmail, use IMAP: imap.migadu.com · 993 · SSL.
        SMTP: smtp.migadu.com · 465 · SSL. username is you@lost.pink. password is
        the same one. there is a walkthrough at /setup/gmail when you are signed
        in.
      </p>
      <p>
        refunds go through Polar. a refund, a cancelled yearly inbox, or a
        failed yearly charge closes the inbox immediately. a dark mailbox keeps
        the alias reserved so you can open it again.
      </p>
    </DocPage>
  );
}
