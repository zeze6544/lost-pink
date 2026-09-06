import { sendLifecycleMail, supportFromAddress } from "./mailer";
import {
  ADMIN_ALERT_KIND,
  type ReminderKind,
} from "./mailbox-lifecycle";
import { decryptSecret } from "./mailbox-secret";
import {
  adminAlertKind,
  claimNotification,
  clearMailboxCheckout,
  getMailboxById,
  getMailboxByPageId,
  listAbandonedCheckouts,
  listDueReminders,
  listLiveMailboxesDue,
  listProvisioningDue,
  markMailboxDisabled,
  markMailboxLive,
  markMailboxProvisionFailed,
  markNotificationFailed,
  markNotificationSent,
  recordSetupHelpSent,
  setMailboxProvisioningStep,
  type MailboxRow,
} from "./mailbox-store";
import { ensureMailbox, setMailboxDark } from "./migadu";
import { deleteUnownedPage, getPageById, teardownOwnedPage } from "./pages";
import { displayLostEmail } from "./slug";
import { siteUrl } from "./site";
import { mailboxCheckoutKind } from "./mailbox-pricing";
import type { MailboxDisableReason, MailboxPlan } from "./mailbox-status";

export async function provisionMailbox(mailboxId: string): Promise<MailboxRow | null> {
  const mailbox = await getMailboxById(mailboxId);
  if (!mailbox) return null;
  if (mailbox.status !== "provisioning" && mailbox.status !== "failed") {
    return mailbox;
  }

  const page = await getPageById(mailbox.page_id);
  const local = mailbox.email_local || page?.email_local;
  const recovery = mailbox.recovery_email;
  const password = mailbox.password_secret
    ? decryptSecret(mailbox.password_secret)
    : null;
  if (!local || !recovery || !password) {
    await markMailboxProvisionFailed(
      mailbox.id,
      !local
        ? "missing alias"
        : !recovery
          ? "missing recovery email"
          : "missing password",
    );
    return getMailboxById(mailbox.id);
  }

  await setMailboxProvisioningStep(mailbox.id, "payment_received");
  await setMailboxProvisioningStep(mailbox.id, "creating_inbox");

  const result = await ensureMailbox({
    localPart: local,
    name: mailbox.display_name || page?.word || local,
    recoveryEmail: recovery,
    password,
  });
  if (!result.ok) {
    const failed = await markMailboxProvisionFailed(mailbox.id, result.error);
    if (failed.alertAdmin) {
      await sendAdminProvisionAlert(failed.mailbox, result.error);
    }
    return failed.mailbox;
  }

  if (result.invited) {
    await setMailboxProvisioningStep(mailbox.id, "invitation_sent");
  }
  return markMailboxLive(mailbox.id);
}

export async function fulfillMailboxPayment(mailboxId: string): Promise<MailboxRow | null> {
  return provisionMailbox(mailboxId);
}

export async function retryDueProvisioning(): Promise<number> {
  const due = await listProvisioningDue();
  let retried = 0;
  for (const mailbox of due) {
    await provisionMailbox(mailbox.id);
    retried += 1;
  }
  return retried;
}

export async function disableMailbox(
  mailboxId: string,
  reason: MailboxDisableReason,
): Promise<MailboxRow | null> {
  const mailbox = await getMailboxById(mailboxId);
  if (!mailbox) return null;
  if (mailbox.email_local) {
    const result = await setMailboxDark(mailbox.email_local);
    if (!result.ok && result.transient) {
      console.error("mailbox darken failed", mailbox.id, result.error);
      return mailbox;
    }
  }
  return markMailboxDisabled(mailbox.id, reason);
}

/**
 * Owner-initiated name deletion.
 * Darkens the inbox (mail kept for MAIL_GRACE_DAYS), then tears down the page.
 * The name stays reserved while the dark mailbox row remains.
 */
export async function deleteOwnedName(
  pageId: string,
  ownerId: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const page = await getPageById(pageId);
  if (!page) return { ok: false, error: "gone.", status: 404 };
  if (page.owner_id !== ownerId) {
    return { ok: false, error: "not yours.", status: 403 };
  }

  const mailbox = await getMailboxByPageId(pageId);
  if (mailbox && mailbox.status !== "dark") {
    const darkened = await disableMailbox(mailbox.id, "cancelled");
    if (!darkened || darkened.status !== "dark") {
      return {
        ok: false,
        error: "couldn't close the inbox. try again.",
        status: 502,
      };
    }
  }

  return teardownOwnedPage(pageId, ownerId);
}

export async function darkenExpiredMailboxes(): Promise<number> {
  const due = await listLiveMailboxesDue();
  let darkened = 0;
  for (const mailbox of due) {
    const next = await disableMailbox(mailbox.id, "expired");
    if (next?.status === "dark") darkened += 1;
  }
  return darkened;
}

export async function sweepAbandonedCheckouts(): Promise<number> {
  const abandoned = await listAbandonedCheckouts();
  let cleared = 0;
  for (const mailbox of abandoned) {
    const pageId = mailbox.page_id;
    await clearMailboxCheckout(pageId);
    await deleteUnownedPage(pageId);
    cleared += 1;
  }
  return cleared;
}

async function sendAdminProvisionAlert(mailbox: MailboxRow, error: string) {
  if (!(await claimNotification(mailbox.id, adminAlertKind()))) return;
  const to = process.env.MAILBOX_ALERT_TO?.trim();
  if (!to) {
    console.error("mailbox provision exhausted", mailbox.id, error);
    await markNotificationFailed(mailbox.id, ADMIN_ALERT_KIND, "no alert recipient");
    return;
  }
  const sent = await sendLifecycleMail({
    to,
    subject: `inbox failed · ${displayLostEmail(mailbox.email_local)}`,
    text: [
      `Provisioning failed for ${displayLostEmail(mailbox.email_local)}.`,
      `page: ${mailbox.page_id}`,
      `mailbox: ${mailbox.id}`,
      `error: ${error}`,
    ].join("\n"),
  });
  if (sent.ok) {
    await markNotificationSent(mailbox.id, ADMIN_ALERT_KIND);
    return;
  }
  await markNotificationFailed(mailbox.id, ADMIN_ALERT_KIND, sent.error);
}

function reminderCopy(
  mailbox: MailboxRow,
  kind: ReminderKind,
): { subject: string; text: string } {
  const address = displayLostEmail(mailbox.email_local);
  const when = mailbox.paid_through
    ? new Date(mailbox.paid_through).toDateString()
    : "soon";
  const renewUrl = `${siteUrl()}/billing`;
  if (mailbox.plan_type === "subscription") {
    return {
      subject: `${address} renews on its own`,
      text: [
        `${address} is still open.`,
        `the yearly charge is automatic around ${when}.`,
        `if the renewal payment doesn't go through, the inbox suspends. mail is kept for 7 days, then removed.`,
        `write ${supportFromAddress()} if you need us.`,
      ].join("\n"),
    };
  }
  const day =
    kind === "reminder_1" ? "tomorrow" : kind === "reminder_7" ? "in a week" : "in a month";
  return {
    subject: `${address} closes ${day}`,
    text: [
      `${address} stays open until ${when}.`,
      `renew another year from ${renewUrl}.`,
      `a cancel or refund suspends the inbox. mail is kept for 7 days, then removed.`,
      `write ${supportFromAddress()} if you need us.`,
    ].join("\n"),
  };
}

export async function sendDueReminders(): Promise<number> {
  const due = await listDueReminders();
  let sentCount = 0;
  for (const { mailbox, kinds } of due) {
    const to = mailbox.recovery_email;
    if (!to) continue;
    for (const kind of kinds) {
      if (!(await claimNotification(mailbox.id, kind))) continue;
      const copy = reminderCopy(mailbox, kind);
      const sent = await sendLifecycleMail({
        to,
        subject: copy.subject,
        text: copy.text,
      });
      if (sent.ok) {
        await markNotificationSent(mailbox.id, kind);
        sentCount += 1;
      } else {
        await markNotificationFailed(mailbox.id, kind, sent.error);
      }
    }
  }
  return sentCount;
}

export async function sendSetupHelp(pageId: string): Promise<
  { ok: true } | { ok: false; error: string; status: number }
> {
  const mailbox = await getMailboxByPageId(pageId);
  if (!mailbox || !mailbox.recovery_email) {
    return { ok: false, error: "no inbox to help with.", status: 404 };
  }
  const sent = await sendLifecycleMail({
    to: mailbox.recovery_email,
    subject: `setup help for ${displayLostEmail(mailbox.email_local)}`,
    text: [
      `${displayLostEmail(mailbox.email_local)} is ready.`,
      mailbox.provision_step === "invitation_sent"
        ? "if you still need a password, open lost.pink/come/forgot. we send a link to the recovery address. the new password is set on lost.pink."
        : "forgot the password? open lost.pink/come/forgot. we send a link to the recovery address. the form is on lost.pink.",
      `IMAP: imap.migadu.com · 993 · SSL`,
      `SMTP: smtp.migadu.com · 465 · SSL`,
      `write ${supportFromAddress()} if you are still stuck.`,
    ].join("\n"),
  });
  if (!sent.ok) {
    return { ok: false, error: sent.error, status: 502 };
  }
  await recordSetupHelpSent(mailbox.id);
  return { ok: true };
}

export function mailboxPlanProductKind(plan: MailboxPlan) {
  return mailboxCheckoutKind(plan);
}
