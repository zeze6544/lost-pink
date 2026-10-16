import { getPolar } from "./polar-client";
import {
  polarCustomerMatchesMailbox,
  polarOrderMatchesMailbox,
} from "./polar-customer";

export type PolarReceipt = {
  id: string;
  when: string;
  label: string;
  amount: string;
  receiptUrl: string | null;
  invoiceNumber: string | null;
};

function quietLabel(raw: string): string {
  return raw.replace(/[—–]/g, ".").replace(/\s+\./g, ".").trim();
}

function formatMoney(amountCents: number, currency: string): string {
  const value = amountCents / 100;
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency.toUpperCase() || "AUD",
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || "AUD"}`;
  }
}

export async function polarCustomerBelongsToMailbox(
  customerId: string,
  mailboxId: string,
): Promise<boolean> {
  const polar = getPolar();
  if (!polar) return false;
  const customer = await polar.customers.get({ id: customerId });
  if (polarCustomerMatchesMailbox(customer, mailboxId)) return true;

  const page = await polar.orders.list({ customerId, limit: 100 });
  const orders = page.result.items;
  return (
    orders.length > 0 &&
    orders.every((order) => polarOrderMatchesMailbox(order, mailboxId))
  );
}

export async function listMailboxReceipts(
  mailboxId: string,
  customerId: string,
): Promise<PolarReceipt[]> {
  const polar = getPolar();
  if (!polar) return [];
  const page = await polar.orders.list({
    customerId,
    limit: 50,
    sorting: ["-created_at"],
  });
  const orders = page.result.items.filter(
    (order) => order.paid && polarOrderMatchesMailbox(order, mailboxId),
  );
  const receipts = await Promise.all(
    orders.map(async (order) => {
      let receiptUrl: string | null = null;
      if (order.receiptNumber) {
        try {
          const receipt = await polar.orders.receipt({ id: order.id });
          receiptUrl = receipt?.url ?? null;
        } catch {
          receiptUrl = null;
        }
      }
      return {
        id: order.id,
        when: order.createdAt.toISOString(),
        label: quietLabel(
          order.product?.name || order.billingReason.replace(/_/g, " "),
        ),
        amount: formatMoney(order.totalAmount, order.currency),
        receiptUrl,
        invoiceNumber: order.invoiceNumber || order.receiptNumber,
      } satisfies PolarReceipt;
    }),
  );
  return receipts;
}
