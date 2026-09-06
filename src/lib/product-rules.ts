/**
 * Canonical product rules for lost.pink.
 * Copy, pricing UI, and lifecycle language must agree with this file.
 * Do not invent privacy/payment facts outside what is stated here.
 */

/** One name is atomically a public page and an inbox. Never one without the other. */
export const PRODUCT_MODEL =
  "one name = one public page + one email address" as const;

/** Names do not casually rename. Changing would break URL + address identity. */
export const NAMES_ARE_FIXED = true;

/** Days mail is retained after the inbox goes dark (suspend ≠ wipe). */
export const MAIL_GRACE_DAYS = 7;

/** Free shrine pages expire after this many hours unless kept. */
export const FREE_PAGE_HOURS = 48;

/** Refund window after purchase (Polar). */
export const REFUND_DAYS = 7;

/** Max length for a name / local-part. */
export const NAME_MAX_CHARS = 16;

/** Min length for a name / local-part. */
export const NAME_MIN_CHARS = 2;

/**
 * Mail is hosted by Migadu (IMAP/SMTP).
 * Do not claim “our servers” for mailbox storage.
 */
export const MAIL_HOST = "Migadu" as const;

/** Payments are processed by Polar. Not analytics. */
export const PAYMENTS_VIA = "Polar" as const;

/**
 * Public surface of a name.
 * The page path always implies the address: lost.pink/mercy → mercy@lost.pink.
 */
export const PUBLIC_IMPLIES_ADDRESS = true;

/** share · keep · write — fixed actions (not poetic nav). */
export const SHRINE_VERBS = {
  share: "native share sheet, or copy the page URL",
  keep: "purchase or renew ownership of the name",
  write: "open a mailto / write path to the inbox address",
} as const;

export function graceCopy(): string {
  return `${MAIL_GRACE_DAYS} days`;
}

export function productOneLiner(): string {
  return "one name. a page and an address.";
}

export function nameIsPageAndAddress(): string {
  return "this name is the page and the address.";
}
