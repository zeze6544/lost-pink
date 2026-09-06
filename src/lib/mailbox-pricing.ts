import type { CheckoutKind, MailboxPlan } from "./mailbox-status";

export const MAILBOX_DAY_MS = 24 * 60 * 60 * 1000;
export const MAILBOX_MONTH_MS = 30 * MAILBOX_DAY_MS;
export const MAILBOX_YEAR_MS = 365 * MAILBOX_DAY_MS;

export type MailboxOffer = {
  kind: Exclude<CheckoutKind, "keep">;
  plan: MailboxPlan;
  env: string;
  label: string;
  explanation: string;
  cents: number;
};

/**
 * Catalog of Polar checkout kinds (includes legacy once-year).
 * Polar product IDs remain in env — checkout flow unchanged.
 * Home UI uses HOME_MAILBOX_OFFERS (three prices only).
 */
export const MAILBOX_OFFERS: readonly MailboxOffer[] = [
  {
    kind: "mailbox_day",
    plan: "day",
    env: "POLAR_PRODUCT_MAILBOX_DAY",
    label: "A$1",
    explanation: "/ day",
    cents: 100,
  },
  {
    kind: "mailbox_month",
    plan: "month",
    env: "POLAR_PRODUCT_MAILBOX_MONTH",
    label: "A$5",
    explanation: "/ month",
    cents: 500,
  },
  {
    kind: "mailbox_subscription",
    plan: "subscription",
    env: "POLAR_PRODUCT_MAILBOX_SUB",
    label: "A$20",
    explanation: "/ year · cancel anytime",
    cents: 2000,
  },
  {
    kind: "mailbox_once",
    plan: "once",
    env: "POLAR_PRODUCT_MAILBOX",
    label: "A$20",
    explanation: "once for 12 months",
    cents: 2000,
  },
] as const;

/** Home tray: day / month / year only — no duplicate A$20 cell. */
export const HOME_MAILBOX_OFFERS: readonly MailboxOffer[] = [
  MAILBOX_OFFERS[0],
  MAILBOX_OFFERS[1],
  MAILBOX_OFFERS[2],
];

/** Replaced products. Existing purchases and subscriptions keep working. */
const LEGACY_PRODUCT_IDS: Record<string, MailboxPlan> = {
  "846e3bd5-3786-4ebb-9cf9-05bcdc7f2ba5": "once",
  "d3eed2e1-9306-4c02-8d0c-e7b6d830341b": "subscription",
  "ea21abdf-9f3a-462e-806f-4f98a308e1aa": "once",
  "24ec200c-d710-4da0-b4d8-cae9d99d4919": "subscription",
};

export function paidThroughMs(plan: MailboxPlan | null | undefined): number {
  if (plan === "day") return MAILBOX_DAY_MS;
  if (plan === "month") return MAILBOX_MONTH_MS;
  return MAILBOX_YEAR_MS;
}

export function mailboxCheckoutKind(plan: MailboxPlan): Exclude<CheckoutKind, "keep"> {
  if (plan === "subscription") return "mailbox_subscription";
  if (plan === "month") return "mailbox_month";
  if (plan === "day") return "mailbox_day";
  return "mailbox_once";
}

export function offerForKind(kind: CheckoutKind): MailboxOffer | null {
  if (kind === "keep") return null;
  return MAILBOX_OFFERS.find((offer) => offer.kind === kind) ?? null;
}

export function offerForPlan(plan: MailboxPlan): MailboxOffer {
  return (
    MAILBOX_OFFERS.find((offer) => offer.plan === plan) ??
    MAILBOX_OFFERS.find((offer) => offer.plan === "subscription") ??
    MAILBOX_OFFERS[0]
  );
}

export function mailboxProductId(plan: MailboxPlan): string | null {
  const id = process.env[offerForPlan(plan).env];
  return id?.trim() || null;
}

export function isMailboxPolarConfigured(plan?: MailboxPlan): boolean {
  if (!process.env.POLAR_ACCESS_TOKEN) return false;
  if (plan) return Boolean(mailboxProductId(plan));
  return MAILBOX_OFFERS.every((offer) => process.env[offer.env]?.trim());
}

export function planFromProductId(productId: unknown): MailboxPlan | null {
  if (typeof productId !== "string" || !productId) return null;
  const legacy = LEGACY_PRODUCT_IDS[productId];
  if (legacy) return legacy;
  for (const offer of MAILBOX_OFFERS) {
    const id = process.env[offer.env]?.trim();
    if (id && id === productId) return offer.plan;
  }
  return null;
}

export function isMailboxCheckoutKind(kind: CheckoutKind): kind is Exclude<CheckoutKind, "keep"> {
  return kind !== "keep";
}
