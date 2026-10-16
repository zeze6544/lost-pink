import { SURFACE_STATES } from "@/lib/product-rules";

export type MailSetupClient = Exclude<
  (typeof SURFACE_STATES)["mail-setup"][number],
  "chooser"
>;

export const MAIL_SETUP_CLIENTS = [
  { id: "gmail" as const, label: "put it in gmail", href: "/setup/gmail" },
  { id: "iphone" as const, label: "put it on iphone", href: "/setup/iphone" },
  { id: "outlook" as const, label: "put it in outlook", href: "/setup/outlook" },
  { id: "android" as const, label: "put it on android", href: "/setup/android" },
  { id: "manual" as const, label: "manual setup", href: "/setup/manual" },
];

export const MAIL_SETUP_DEFAULTS = {
  imapHost: "imap.migadu.com",
  imapPort: 993,
  imapSecurity: "SSL/TLS",
  smtpHost: "smtp.migadu.com",
  smtpPort: 465,
  smtpSecurity: "SSL/TLS",
} as const;

export function isMailSetupClient(value: string): value is MailSetupClient {
  return MAIL_SETUP_CLIENTS.some((client) => client.id === value);
}

export function mailSetupCopy(client: MailSetupClient): {
  title: string;
  passwordNote: string;
  steps: { title: string; body: string }[];
} {
  const hosts =
    `IMAP ${MAIL_SETUP_DEFAULTS.imapHost}:${MAIL_SETUP_DEFAULTS.imapPort} (${MAIL_SETUP_DEFAULTS.imapSecurity}). ` +
    `SMTP ${MAIL_SETUP_DEFAULTS.smtpHost}:${MAIL_SETUP_DEFAULTS.smtpPort} (${MAIL_SETUP_DEFAULTS.smtpSecurity}).`;
  const passwordNote =
    "password is the one you set for you@lost.pink — not a gmail app password.";

  switch (client) {
    case "gmail":
      return {
        title: "gmail",
        passwordNote,
        steps: [
          {
            title: "ENABLE IMAP",
            body: "Turn on IMAP in your Google Account settings.",
          },
          {
            title: "ADD ACCOUNT",
            body: "In the Gmail app, add an account → Other. Enter your you@lost.pink address.",
          },
          { title: "SERVERS", body: hosts },
          { title: "USERNAME", body: "your full you@lost.pink address." },
          { title: "PASSWORD", body: passwordNote },
        ],
      };
    case "iphone":
      return {
        title: "iphone",
        passwordNote,
        steps: [
          {
            title: "SETTINGS → MAIL → ACCOUNTS",
            body: "Add Account → Other → Add Mail Account.",
          },
          {
            title: "NAME AND ADDRESS",
            body: "Enter your name and you@lost.pink.",
          },
          { title: "HOSTS", body: hosts },
          {
            title: "USERNAME",
            body: "full you@lost.pink on both incoming and outgoing.",
          },
          { title: "PASSWORD", body: passwordNote },
        ],
      };
    case "outlook":
      return {
        title: "outlook",
        passwordNote,
        steps: [
          {
            title: "ADD ACCOUNT",
            body: "Add Account → Advanced options → Let me set up my account manually → IMAP.",
          },
          { title: "SERVERS", body: hosts },
          { title: "USERNAME", body: "full you@lost.pink address." },
          { title: "PASSWORD", body: passwordNote },
        ],
      };
    case "android":
      return {
        title: "android",
        passwordNote,
        steps: [
          {
            title: "GMAIL APP → ADD ACCOUNT",
            body: "Other → enter you@lost.pink → Personal (IMAP).",
          },
          { title: "SERVERS", body: hosts },
          {
            title: "USERNAME",
            body: "full you@lost.pink on incoming and outgoing.",
          },
          { title: "PASSWORD", body: passwordNote },
        ],
      };
    case "manual":
      return {
        title: "manual setup",
        passwordNote,
        steps: [
          {
            title: "ANY IMAP CLIENT",
            body: "Create an IMAP account with your you@lost.pink address.",
          },
          {
            title: "INCOMING",
            body: `Server ${MAIL_SETUP_DEFAULTS.imapHost}, port ${MAIL_SETUP_DEFAULTS.imapPort}, ${MAIL_SETUP_DEFAULTS.imapSecurity}.`,
          },
          {
            title: "OUTGOING",
            body: `Server ${MAIL_SETUP_DEFAULTS.smtpHost}, port ${MAIL_SETUP_DEFAULTS.smtpPort}, ${MAIL_SETUP_DEFAULTS.smtpSecurity}.`,
          },
          {
            title: "LOGIN",
            body: `Username is the full address. ${passwordNote}`,
          },
        ],
      };
  }
}
