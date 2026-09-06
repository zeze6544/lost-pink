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

function checkoutMatchesMailbox(
  mailbox: MailboxRow,
  checkoutId?: string | null,
): boolean {
  const expected = mailbox.polar_checkout_id;
  if (!checkoutId || !expected) return false;
  return checkoutId === expected;
}

/** Paid join states still need checkout proof until an owner is attached. */
function requireCheckoutProof(mailbox: MailboxRow, checkoutId?: string | null) {
  if (mailbox.owner_id) return true;
  if (mailbox.status === "live") return true;
  return checkoutMatchesMailbox(mailbox, checkoutId);
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
    if (!requireCheckoutProof(mailbox, checkoutId)) return null;
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
