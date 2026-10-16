const MAILBOX_EXTERNAL_PREFIX = "lost-pink-mailbox:";

export function mailboxExternalCustomerId(mailboxId: string): string {
  return `${MAILBOX_EXTERNAL_PREFIX}${mailboxId}`;
}

export function mailboxCheckoutCustomer(input: {
  mailboxId: string;
}): { externalCustomerId: string } {
  return { externalCustomerId: mailboxExternalCustomerId(input.mailboxId) };
}

export function polarCustomerMatchesMailbox(
  customer: { externalId?: string | null },
  mailboxId: string,
): boolean {
  return customer.externalId === mailboxExternalCustomerId(mailboxId);
}

export function polarOrderMatchesMailbox(
  order: { metadata?: Record<string, unknown> | null },
  mailboxId: string,
): boolean {
  return order.metadata?.mailbox_id === mailboxId;
}
