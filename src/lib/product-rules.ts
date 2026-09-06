/**
 * Canonical product rules for lost.pink.
 * Copy, pricing UI, lifecycle language, and surface hierarchy must agree with this file.
 * Do not invent privacy/payment facts outside what is stated here.
 * Do not invent a new visual surface for a state change — own it under a parent.
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

/** SMTP hostname for mail-app setup copy. */
export const MAIL_SMTP_HOST = "smtp.migadu.com" as const;

/** Payments are processed by Polar. Not analytics. */
export const PAYMENTS_VIA = "Polar" as const;

/** No ad network. Privacy copy must stay true. */
export const NO_ADS = true;

/** No analytics or tracking pixels. */
export const NO_TRACKING_PIXELS = true;

/** Names are first come, first served. There is no marketplace. */
export const NAMES_FIRST_COME = true;

/**
 * Public surface of a name.
 * The page path always implies the address: lost.pink/mercy → mercy@lost.pink.
 */
export const PUBLIC_IMPLIES_ADDRESS = true;

/** Canonical navigation mark. Sigils/glyphs are decorative only — never replace nav. */
export const NAV_MARK = "lost.pink" as const;

/** share · keep · write — fixed actions on the public page (not poetic nav). */
export const SHRINE_VERBS = {
  share: "native share sheet, or copy the page URL",
  keep: "purchase or renew ownership of the name",
  write: "open the write surface to the inbox address",
} as const;

/**
 * The curated master defines 14 canonical visual surfaces — not a sitemap,
 * and not one design per state. States live under parents.
 *
 * Order matches lost-pink-curated-master-v2.pdf.
 *
 * Home → Login → Claim → Kept → Yours → Name settings → Billing →
 * Mail setup → Write → Public page → Support → Privacy → Terms → Delete
 */
export const CANONICAL_SURFACES = [
  "home",
  "login",
  "claim",
  "kept",
  "yours",
  "name-settings",
  "billing",
  "mail-setup",
  "write",
  "public-page",
  "support",
  "privacy",
  "terms",
  "delete",
] as const;

export type CanonicalSurface = (typeof CANONICAL_SURFACES)[number];

/**
 * State ownership. A text/outcome change is not a new design.
 * Derive the state from its parent surface.
 *
 * Login owns recovery states. Claim owns validation states.
 * Billing owns receipts/renewal/cancellation. Mail setup owns client instructions.
 * Write owns sending/success/failure. Delete owns confirmation/progress.
 * Kept owns provisioning progress.
 */
export const SURFACE_STATES = {
  login: ["forgot-password", "reset-password", "page-sign-in-link"] as const,
  claim: ["idle", "checking", "available", "taken", "reserved", "invalid"] as const,
  billing: ["plan", "receipts", "cancel", "renew", "buy-more-time"] as const,
  "mail-setup": [
    "chooser",
    "gmail",
    "iphone",
    "outlook",
    "android",
    "manual",
  ] as const,
  write: ["compose", "sending", "sent", "error"] as const,
  delete: ["confirm", "deleting", "deleted"] as const,
  kept: ["payment-received", "creating-inbox", "invitation-sent"] as const,
} as const;

export function graceCopy(): string {
  return `${MAIL_GRACE_DAYS} days`;
}

/** Homepage product line — freeze. */
export function productOneLiner(): string {
  return "one name. a page and an address.";
}

/** Claim screen line — freeze. */
export function nameIsPageAndAddress(): string {
  return "this name is the page and the address.";
}
