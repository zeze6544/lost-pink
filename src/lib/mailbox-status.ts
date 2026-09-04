export type PublicMailboxLabel = "none" | "display" | "open";

export type MailboxLifecycleStatus =
  | "checkout_started"
  | "awaiting_account"
  | "provisioning"
  | "live"
  | "failed"
  | "dark";

export type MailboxPlan = "once" | "subscription" | "month" | "day";

export type ProvisionStep =
  | "payment_received"
  | "creating_inbox"
  | "invitation_sent";

export type MailboxDisableReason =
  | "cancelled"
  | "refunded"
  | "renewal_failed"
  | "expired";

export type CheckoutKind =
  | "keep"
  | "mailbox_once"
  | "mailbox_subscription"
  | "mailbox_month"
  | "mailbox_day";

/** @deprecated Use PublicMailboxLabel. Kept for reading older blob JSON. */
export type MailboxStatus = PublicMailboxLabel | "pending" | "live" | "dark";

export function parsePublicMailboxLabel(value: unknown): PublicMailboxLabel {
  if (value === "open" || value === "live") return "open";
  if (
    value === "display" ||
    value === "pending" ||
    value === "dark" ||
    value === "failed" ||
    value === "provisioning" ||
    value === "awaiting_account" ||
    value === "checkout_started"
  ) {
    return "display";
  }
  return "none";
}

export function publicMailboxLabel(
  emailLocal: string | null | undefined,
  lifecycle: MailboxLifecycleStatus | null | undefined,
): PublicMailboxLabel {
  if (!emailLocal) return "none";
  if (lifecycle === "live") return "open";
  return "display";
}

export function isMailboxOpen(
  status: MailboxStatus | PublicMailboxLabel,
  expiresAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (status !== "open" && status !== "live") return false;
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > now;
}

export function isMailboxLocked(
  status: MailboxStatus | PublicMailboxLabel | MailboxLifecycleStatus,
  expiresAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (
    status === "pending" ||
    status === "provisioning" ||
    status === "awaiting_account" ||
    status === "failed"
  ) {
    return true;
  }
  if (status === "checkout_started") return true;
  return isMailboxOpen(status, expiresAt, now);
}
