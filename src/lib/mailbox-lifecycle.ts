import type {
  MailboxDisableReason,
  MailboxLifecycleStatus,
  MailboxPlan,
  ProvisionStep,
} from "./mailbox-status";
import { MAILBOX_YEAR_MS, paidThroughMs } from "./mailbox-pricing";

export { MAILBOX_YEAR_MS };
export const CHECKOUT_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_PROVISION_ATTEMPTS = 6;
export const SETUP_HELP_COOLDOWN_MS = 15 * 60 * 1000;
export const ADMIN_ALERT_KIND = "admin_provision_failed";

export const PROVISION_RETRY_DELAYS_MS = [
  5 * 60_000,
  15 * 60_000,
  60 * 60_000,
  6 * 60 * 60_000,
] as const;

export type ReminderKind = "reminder_30" | "reminder_7" | "reminder_1";

export type PaymentKind =
  | "purchase"
  | "renewal"
  | "refund"
  | "cancel"
  | "revoke"
  | "failed_renewal";

export function extendPaidThrough(
  existingIso: string | null | undefined,
  now: Date,
  plan: MailboxPlan = "once",
): Date {
  const existing = existingIso ? new Date(existingIso) : null;
  const valid =
    existing && !Number.isNaN(existing.getTime()) ? existing : null;
  const start =
    valid && valid.getTime() > now.getTime() ? valid : now;
  return new Date(start.getTime() + paidThroughMs(plan));
}

export function checkoutExpiresAt(now: Date): Date {
  return new Date(now.getTime() + CHECKOUT_TTL_MS);
}

export function isCheckoutAbandoned(
  status: MailboxLifecycleStatus,
  checkoutExpiresAtIso: string | null | undefined,
  now: Date,
): boolean {
  if (status !== "checkout_started") return false;
  if (!checkoutExpiresAtIso) return true;
  const expires = new Date(checkoutExpiresAtIso);
  if (Number.isNaN(expires.getTime())) return true;
  return expires.getTime() <= now.getTime();
}

export function canResumeCheckout(
  status: MailboxLifecycleStatus,
): boolean {
  return status === "checkout_started";
}

export function canClearCheckout(status: MailboxLifecycleStatus): boolean {
  return status === "checkout_started";
}

export function aliasIsReserved(
  status: MailboxLifecycleStatus,
  checkoutExpiresAtIso: string | null | undefined,
  now: Date,
): boolean {
  if (
    status === "live" ||
    status === "provisioning" ||
    status === "awaiting_account" ||
    status === "failed"
  ) {
    return true;
  }
  if (status === "dark") return true;
  if (status === "checkout_started") {
    return !isCheckoutAbandoned(status, checkoutExpiresAtIso, now);
  }
  return false;
}

export function canStartMailboxPurchase(input: {
  kept: boolean;
  emailLocal: string | null | undefined;
  mailbox: {
    status: MailboxLifecycleStatus;
    checkoutExpiresAt: string | null;
  } | null;
  now?: Date;
}): boolean {
  if (!input.kept || !input.emailLocal) return false;
  if (!input.mailbox) return true;
  const now = input.now ?? new Date();
  if (input.mailbox.status === "live") return false;
  if (input.mailbox.status === "provisioning") return false;
  if (input.mailbox.status === "awaiting_account") return false;
  if (
    input.mailbox.status === "checkout_started" &&
    !isCheckoutAbandoned(
      input.mailbox.status,
      input.mailbox.checkoutExpiresAt,
      now,
    )
  ) {
    return false;
  }
  return true;
}

export function nextProvisionRetryAt(
  attemptCountAfterFailure: number,
  now: Date,
): Date | null {
  if (attemptCountAfterFailure >= MAX_PROVISION_ATTEMPTS) return null;
  const index = Math.min(
    Math.max(attemptCountAfterFailure - 1, 0),
    PROVISION_RETRY_DELAYS_MS.length - 1,
  );
  return new Date(now.getTime() + PROVISION_RETRY_DELAYS_MS[index]);
}

export function shouldAlertAdmin(attemptCountAfterFailure: number): boolean {
  return attemptCountAfterFailure >= MAX_PROVISION_ATTEMPTS;
}

export function reminderKindsDue(
  paidThroughIso: string,
  now: Date,
  alreadySent: Iterable<string>,
): ReminderKind[] {
  const paidThrough = new Date(paidThroughIso);
  if (Number.isNaN(paidThrough.getTime())) return [];
  const ms = paidThrough.getTime() - now.getTime();
  if (ms <= 0) return [];
  const days = ms / 86_400_000;
  const sent = new Set(alreadySent);
  const due: ReminderKind[] = [];
  if (days <= 30 && !sent.has("reminder_30")) due.push("reminder_30");
  if (days <= 7 && !sent.has("reminder_7")) due.push("reminder_7");
  if (days <= 1 && !sent.has("reminder_1")) due.push("reminder_1");
  return due;
}

export function setupHelpAllowed(
  lastSentIso: string | null | undefined,
  now: Date,
): boolean {
  if (!lastSentIso) return true;
  const last = new Date(lastSentIso);
  if (Number.isNaN(last.getTime())) return true;
  return now.getTime() - last.getTime() >= SETUP_HELP_COOLDOWN_MS;
}

export function shouldDisableForSubscriptionStatus(
  status: string | null | undefined,
): MailboxDisableReason | null {
  if (!status) return null;
  const normalized = status.toLowerCase();
  if (normalized === "canceled" || normalized === "cancelled") {
    return "cancelled";
  }
  if (normalized === "revoked") return "cancelled";
  if (
    normalized === "past_due" ||
    normalized === "unpaid" ||
    normalized === "incomplete_expired"
  ) {
    return "renewal_failed";
  }
  return null;
}

export function provisionProgress(
  status: MailboxLifecycleStatus,
  step: ProvisionStep | null,
): {
  paymentReceived: boolean;
  creatingInbox: boolean;
  invitationSent: boolean;
  failed: boolean;
  live: boolean;
} {
  const order: ProvisionStep[] = [
    "payment_received",
    "creating_inbox",
    "invitation_sent",
  ];
  const reached = step ? order.indexOf(step) : -1;
  return {
    paymentReceived:
      status === "provisioning" ||
      status === "awaiting_account" ||
      status === "live" ||
      status === "failed" ||
      reached >= 0,
    creatingInbox: status === "live" || reached >= 1,
    invitationSent: status === "live" || reached >= 2,
    failed: status === "failed",
    live: status === "live",
  };
}

export function nextPaidThrough(
  existingIso: string | null | undefined,
  kind: PaymentKind,
  duplicate: boolean,
  now: Date,
  plan: MailboxPlan = "once",
): Date | null {
  if (duplicate) {
    return existingIso ? new Date(existingIso) : null;
  }
  if (kind === "purchase" || kind === "renewal") {
    return extendPaidThrough(existingIso, now, plan);
  }
  return existingIso ? new Date(existingIso) : null;
}

export function ownerCanManage(input: {
  userId: string | null;
  pageOwnerId: string | null;
}): boolean {
  return Boolean(input.userId && input.pageOwnerId && input.userId === input.pageOwnerId);
}

const SENSITIVE_PUBLIC_KEYS = [
  "mailbox_recovery_email",
  "mailbox_polar_order_id",
  "recovery_email",
  "polar_customer_id",
  "polar_subscription_id",
  "polar_checkout_id",
  "last_error",
] as const;

export function publicPageHasNoMailboxSecrets(
  row: Record<string, unknown>,
): boolean {
  return SENSITIVE_PUBLIC_KEYS.every((key) => {
    const value = row[key];
    return value === undefined || value === null || value === "";
  });
}

export function parseMailboxPlan(value: unknown): MailboxPlan | null {
  if (
    value === "once" ||
    value === "subscription" ||
    value === "month" ||
    value === "day"
  ) {
    return value;
  }
  if (value === "mailbox_once" || value === "mailbox") return "once";
  if (value === "mailbox_subscription") return "subscription";
  if (value === "mailbox_month") return "month";
  if (value === "mailbox_day") return "day";
  return null;
}
