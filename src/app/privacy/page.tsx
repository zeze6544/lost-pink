import { DocPage } from "@/components/SiteFrame";

export default function PrivacyPage() {
  return (
    <DocPage title="privacy">
      <p>
        We store the name you buy, the look of the public page, optional photos
        and a line, Polar payment references, your sign-in as you@lost.pink, a
        recovery email, and a phone number used to verify the account.
      </p>
      <p>
        Mail passes through our servers so we can show it in the browser. We
        store an encrypted copy of the mailbox password to open IMAP on your
        behalf. We do not sell mail, and we do not train models on it. HTML is
        sanitized; remote images are off until you ask.
      </p>
      <p>
        Public pages show the alias and whether the inbox is open. Recovery
        email, phone, Polar IDs, and mailbox secrets stay private.
      </p>
      <p>
        Photos are jpeg, png, or webp only. A dark mailbox keeps the alias until
        you open it again or ask us to remove it.
      </p>
      <p>
        Payment details are handled by Polar. SMS codes are sent by Twilio.
        Contact: <a href="mailto:privacy@lost.pink">privacy@lost.pink</a> or{" "}
        <a href="mailto:support@lost.pink">support@lost.pink</a>
      </p>
    </DocPage>
  );
}
