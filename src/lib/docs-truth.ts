import {
  MAIL_GRACE_DAYS,
  MAIL_HOST,
  MAIL_SMTP_HOST,
  NAMES_ARE_FIXED,
  NAMES_FIRST_COME,
  NO_ADS,
  NO_TRACKING_PIXELS,
  PAYMENTS_VIA,
  PRODUCT_MODEL,
  PUBLIC_IMPLIES_ADDRESS,
  REFUND_DAYS,
} from "./product-rules";
import {
  inboxDayLabel,
  inboxMonthLabel,
  inboxOnceLabel,
  inboxYearlyLabel,
} from "./voice";

/** Copy that must never appear on support, privacy, or terms. */
export const DOCS_FORBIDDEN = [
  /our servers/i,
  /twilio/i,
  /phone number/i,
  /sms codes/i,
] as const;

export type DocQA = { q: string; a: string };

function adsSentence(): string {
  if (!NO_ADS || !NO_TRACKING_PIXELS) {
    throw new Error("docs copy assumes no ads and no tracking pixels.");
  }
  return "we do not run ads or tracking pixels.";
}

export function privacyQuestions(): DocQA[] {
  const addressImplies = PUBLIC_IMPLIES_ADDRESS
    ? " because the address follows the handle, lost.pink/mercy implies mercy@lost.pink — whether or not the page prints it."
    : "";
  return [
    {
      q: "what do you store?",
      a: `we keep the name you buy, how the public page looks, optional photos and a line, ${PAYMENTS_VIA.toLowerCase()} payment references, your sign-in as you@lost.pink, and a recovery email. no phone.`,
    },
    {
      q: "what about mail?",
      a: `mail is hosted by ${MAIL_HOST}. we do not store the mailbox. we keep an encrypted copy of the mailbox password so the browser inbox can open it for you. we do not sell mail, we do not train models on it, and ${adsSentence()} html is cleaned; pictures from the internet stay off until you ask. after the inbox suspends, mail is kept ${MAIL_GRACE_DAYS} days, then removed.`,
    },
    {
      q: "what is public vs private?",
      a: `public pages show the alias and the page you dressed.${addressImplies} recovery email, ${PAYMENTS_VIA.toLowerCase()} ids, and mailbox secrets stay private. we do not publish whether someone is signed in.`,
    },
    {
      q: "photos and an expired inbox?",
      a: `photos are jpeg, png, or webp only. when paid time ends, the inbox suspends. mail is kept ${MAIL_GRACE_DAYS} days; the name stays reserved until you open it again or ask us to remove it.`,
    },
    {
      q: "who handles cards?",
      a: `payment details are handled by ${PAYMENTS_VIA.toLowerCase()}. ${adsSentence()} write privacy@lost.pink or support@lost.pink.`,
    },
  ];
}

export function supportQuestions(): DocQA[] {
  return [
    {
      q: "how do i reach you?",
      a: `email support@lost.pink. include the page name (lost.pink/yourword) and the ${PAYMENTS_VIA.toLowerCase()} order if you have it. a person will reply. no ticket maze.`,
    },
    {
      q: "how do i sign in?",
      a: "you made a password when you paid. use you@lost.pink and that password. forgot it? reset it through your recovery email, not the inbox.",
    },
    {
      q: "can i use apple mail or gmail?",
      a: `yes. connect a mail app has the IMAP and SMTP details for iPhone, Android and desktop. smtp uses ${MAIL_SMTP_HOST}. Gmail’s website stopped fetching new third-party inboxes; use the Gmail app or another mail client.`,
    },
    {
      q: "refunds and cancellations?",
      a: `${PAYMENTS_VIA.toLowerCase()} handles the money. refunds within ${REFUND_DAYS} days when approved. cancelled yearly plans and failed renewals suspend the inbox. when paid time ends, the inbox goes dark, but the name stays yours in case you come back.`,
    },
    {
      q: "when does mail go away?",
      a: `after the inbox suspends, mail is kept ${MAIL_GRACE_DAYS} days — not wiped at once — then removed.`,
    },
  ];
}

export function termsQuestions(): DocQA[] {
  const rename = NAMES_ARE_FIXED
    ? " names do not rename; the page path is the address."
    : "";
  const firstCome = NAMES_FIRST_COME
    ? " names are first come, first served. there is no marketplace."
    : "";
  return [
    {
      q: "what am i buying?",
      a: `lost.pink sells ${PRODUCT_MODEL}. you choose a username, pay ${inboxDayLabel()} for a day, ${inboxMonthLabel()} once for a month, ${inboxOnceLabel()}, or ${inboxYearlyLabel()}, create an account, and get you@lost.pink plus a public page at lost.pink/you. prices are in AUD.${firstCome}${rename}`,
    },
    {
      q: "when does the inbox close?",
      a: `cancel, refund, or a failed renewal suspends the inbox immediately. when paid time ends, the inbox suspends but the name stays reserved. mail is kept ${MAIL_GRACE_DAYS} days, then removed. paid time extends from the later of today or the date it’s already paid through.`,
    },
    {
      q: "what can i put on the page?",
      a: "you may dress the public page. do not publish illegal content, harassment, or anyone else’s personal data without permission. we may remove pages or close inboxes that break these rules or the law.",
    },
    {
      q: "how is mail handled?",
      a: `mail you send and receive is hosted by ${MAIL_HOST}. we do not store the mailbox, sell mail, or use it for ads. html letters are cleaned; remote images stay off until you ask.`,
    },
    {
      q: "refunds?",
      a: `the service is provided as-is. refunds follow ${PAYMENTS_VIA.toLowerCase()}’s and your local consumer rules, within ${REFUND_DAYS} days when approved. write support@lost.pink.`,
    },
  ];
}

export function docsCorpus(): string {
  return [...privacyQuestions(), ...supportQuestions(), ...termsQuestions()]
    .map((item) => `${item.q}\n${item.a}`)
    .join("\n");
}

export function forbiddenDocsHits(text: string): string[] {
  return DOCS_FORBIDDEN.filter((re) => re.test(text)).map(String);
}
