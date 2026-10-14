import { Webhooks } from "@polar-sh/nextjs";
import { fulfillMailboxPayment, disableMailbox } from "@/lib/mailbox";
import { parseMailboxPlan, shouldDisableForSubscriptionStatus } from "@/lib/mailbox-lifecycle";
import { planFromProductId } from "@/lib/mailbox-pricing";
import {
  getMailboxByCheckoutId,
  getMailboxByPageId,
  getMailboxBySubscriptionId,
  recordMailboxPayment,
} from "@/lib/mailbox-store";
import { markKept } from "@/lib/pages";
import type { MailboxDisableReason, MailboxPlan } from "@/lib/mailbox-status";

function metaString(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringId(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function mailboxPlanFrom(
  metadata: Record<string, unknown> | undefined,
  productId?: unknown,
): MailboxPlan | null {
  const kind = metaString(metadata, "kind");
  const fromKind = parseMailboxPlan(kind);
  if (fromKind) return fromKind;
  return planFromProductId(productId);
}

function billingKind(value: unknown): "purchase" | "renewal" {
  if (
    value === "subscription_cycle" ||
    value === "subscription_update" ||
    value === "renewal"
  ) {
    return "renewal";
  }
  return "purchase";
}

async function handleMailboxPaid(input: {
  metadata?: Record<string, unknown>;
  productId?: unknown;
  orderId?: string | null;
  checkoutId?: string | null;
  eventId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  billingReason?: unknown;
}) {
  const plan = mailboxPlanFrom(input.metadata, input.productId);
  const pageId = metaString(input.metadata, "page_id");
  const mailboxId = metaString(input.metadata, "mailbox_id");
  const recorded = await recordMailboxPayment({
    mailboxId: mailboxId ?? undefined,
    pageId: pageId ?? undefined,
    polarOrderId: input.orderId,
    polarCheckoutId: input.checkoutId,
    polarEventId: input.eventId,
    polarCustomerId: input.customerId,
    polarSubscriptionId: input.subscriptionId,
    kind: billingKind(input.billingReason),
    plan: plan ?? undefined,
  });
  if (!recorded || recorded.duplicate) return;
  if (recorded.mailbox.status === "provisioning") {
    await fulfillMailboxPayment(recorded.mailbox.id);
  }
}

async function handleMailboxDisable(input: {
  reason: MailboxDisableReason;
  metadata?: Record<string, unknown>;
  subscriptionId?: string | null;
  checkoutId?: string | null;
  eventId?: string | null;
  customerId?: string | null;
  orderId?: string | null;
}) {
  const pageId = metaString(input.metadata, "page_id");
  const mailbox =
    (pageId ? await getMailboxByPageId(pageId) : null) ??
    (input.subscriptionId
      ? await getMailboxBySubscriptionId(input.subscriptionId)
      : null) ??
    (input.checkoutId ? await getMailboxByCheckoutId(input.checkoutId) : null);
  if (!mailbox) return;

  await recordMailboxPayment({
    mailboxId: mailbox.id,
    polarOrderId: input.orderId,
    polarCheckoutId: input.checkoutId,
    polarEventId: input.eventId,
    polarCustomerId: input.customerId,
    polarSubscriptionId: input.subscriptionId,
    kind:
      input.reason === "refunded"
        ? "refund"
        : input.reason === "cancelled"
          ? "cancel"
          : "failed_renewal",
  });
  await disableMailbox(mailbox.id, input.reason);
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? "dev-secret",
  onOrderPaid: async (payload) => {
    const data = payload.data as Record<string, unknown>;
    const metadata = asRecord(data.metadata);
    const productId = data.product_id ?? asRecord(data.product)?.id;
    const plan = mailboxPlanFrom(metadata, productId);
    if (plan || metaString(metadata, "kind")?.startsWith("mailbox")) {
      await handleMailboxPaid({
        metadata,
        productId,
        orderId: stringId(data.id),
        checkoutId: stringId(data.checkout_id),
        eventId: stringId((payload as { id?: unknown }).id),
        customerId: stringId(data.customer_id) ?? stringId(asRecord(data.customer)?.id),
        subscriptionId:
          stringId(data.subscription_id) ??
          stringId(asRecord(data.subscription)?.id),
        billingReason: data.billing_reason,
      });
      return;
    }
    const pageId = metaString(metadata, "page_id");
    if (pageId) await markKept(pageId, stringId(data.id));
  },
  onCheckoutUpdated: async (payload) => {
    if (payload.data.status !== "succeeded") return;
    const metadata = asRecord(payload.data.metadata);
    const productId = payload.data.products?.[0]?.id;
    const plan = mailboxPlanFrom(metadata, productId);
    if (plan || metaString(metadata, "kind")?.startsWith("mailbox")) {
      await handleMailboxPaid({
        metadata,
        productId,
        orderId: stringId(
          (payload.data as { order_id?: unknown }).order_id,
        ),
        checkoutId: payload.data.id,
        eventId: stringId((payload as { id?: unknown }).id),
        customerId: stringId(
          (payload.data as { customer_id?: unknown }).customer_id,
        ),
        subscriptionId: stringId(
          (payload.data as { subscription_id?: unknown }).subscription_id,
        ),
      });
      return;
    }
    const pageId = metaString(metadata, "page_id");
    if (pageId) await markKept(pageId, payload.data.id);
  },
  onOrderRefunded: async (payload) => {
    const data = payload.data as Record<string, unknown>;
    const metadata = asRecord(data.metadata);
    await handleMailboxDisable({
      reason: "refunded",
      metadata,
      subscriptionId:
        stringId(data.subscription_id) ??
        stringId(asRecord(data.subscription)?.id),
      checkoutId: stringId(data.checkout_id),
      eventId: stringId((payload as { id?: unknown }).id),
      customerId: stringId(data.customer_id),
      orderId: stringId(data.id),
    });
  },
  onSubscriptionCanceled: async (payload) => {
    const data = payload.data as Record<string, unknown>;
    await handleMailboxDisable({
      reason: "cancelled",
      metadata: asRecord(data.metadata),
      subscriptionId: stringId(data.id),
      eventId: stringId((payload as { id?: unknown }).id),
      customerId: stringId(data.customer_id),
    });
  },
  onSubscriptionRevoked: async (payload) => {
    const data = payload.data as Record<string, unknown>;
    await handleMailboxDisable({
      reason: "cancelled",
      metadata: asRecord(data.metadata),
      subscriptionId: stringId(data.id),
      eventId: stringId((payload as { id?: unknown }).id),
      customerId: stringId(data.customer_id),
    });
  },
  onSubscriptionUpdated: async (payload) => {
    const data = payload.data as Record<string, unknown>;
    const reason = shouldDisableForSubscriptionStatus(stringId(data.status));
    if (!reason) return;
    await handleMailboxDisable({
      reason,
      metadata: asRecord(data.metadata),
      subscriptionId: stringId(data.id),
      eventId: stringId((payload as { id?: unknown }).id),
      customerId: stringId(data.customer_id),
    });
  },
});
