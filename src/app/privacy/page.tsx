import { DocPage, DocQuestion } from "@/components/SiteFrame";

export default function PrivacyPage() {
  return (
    <DocPage title="privacy">
      <DocQuestion q="what do you store?">
        <p>
          we keep the name you buy, how the public page looks, optional photos
          and a line, polar payment references, your sign-in as you@lost.pink,
          a recovery email, and a phone number used to verify the account.
        </p>
      </DocQuestion>
      <DocQuestion q="what about mail?">
        <p>
          mail passes through our servers so we can show it in the browser. we
          store an encrypted copy of the mailbox password to open it for you.
          we do not sell mail, and we do not train models on it. html is
          cleaned; pictures from the internet stay off until you ask.
        </p>
      </DocQuestion>
      <DocQuestion q="what is public vs private?">
        <p>
          public pages show the alias and the page you dressed. recovery email,
          phone, polar ids, and mailbox secrets stay private. we do not publish
          whether someone is signed in.
        </p>
      </DocQuestion>
      <DocQuestion q="photos and an expired inbox?">
        <p>
          photos are jpeg, png, or webp only. when paid time ends, the inbox
          closes but the name stays reserved until you open it again or ask us
          to remove it.
        </p>
      </DocQuestion>
      <DocQuestion q="who handles cards?">
        <p>
          payment details are handled by polar. sms codes are sent by twilio.
          write <a href="mailto:privacy@lost.pink">privacy@lost.pink</a> or{" "}
          <a href="mailto:support@lost.pink">support@lost.pink</a>.
        </p>
      </DocQuestion>
    </DocPage>
  );
}
