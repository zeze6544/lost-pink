import { getPolar } from "./polar";
import {
  getMailboxByCheckoutId,
  getMailboxById,
  markMailboxPaidAwaitingAccount,
  type MailboxRow,
} from "./mailbox-store";

export async function mailboxFromJoinQuery(input: {
  mailboxId?: string | null;
  checkoutId?: string | null;
}): Promise<MailboxRow | null> {
  if (input.mailboxId) {
    const byId = await getMailboxById(input.mailboxId);
    if (byId) return byId;
  }
  if (input.checkoutId) {
    return getMailboxByCheckoutId(input.checkoutId);
  }
  return null;
}

export async function ensureJoinPaid(
  mailbox: MailboxRow,
  checkoutId?: string | null,
): Promise<MailboxRow | null> {
  if (
    mailbox.status === "awaiting_account" ||
    mailbox.status === "provisioning" ||
    mailbox.status === "live" ||
    mailbox.status === "failed"
  ) {
    return mailbox;
  }

  const id = checkoutId || mailbox.polar_checkout_id;
  if (!id) return null;
  const polar = getPolar();
  if (!polar) {
    if (id === "dev-local") {
      return markMailboxPaidAwaitingAccount(mailbox.id, id);
    }
    return null;
  }
  try {
    const checkout = await polar.checkouts.get({ id });
    const status = String(checkout.status ?? "");
    const meta = checkout.metadata as Record<string, unknown> | undefined;
    const mailboxId =
      typeof meta?.mailbox_id === "string" ? meta.mailbox_id : null;
    if (status !== "succeeded" && status !== "confirmed") return null;
    if (mailboxId && mailboxId !== mailbox.id) return null;
    return markMailboxPaidAwaitingAccount(mailbox.id, id);
  } catch {
    return null;
  }
}
