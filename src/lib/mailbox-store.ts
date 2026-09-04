import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  aliasIsReserved,
  canStartMailboxPurchase,
  checkoutExpiresAt,
  extendPaidThrough,
  isCheckoutAbandoned,
  nextProvisionRetryAt,
  reminderKindsDue,
  setupHelpAllowed,
  shouldAlertAdmin,
  type PaymentKind,
  type ReminderKind,
  ADMIN_ALERT_KIND,
} from "./mailbox-lifecycle";
import {
  publicMailboxLabel,
  type MailboxDisableReason,
  type MailboxLifecycleStatus,
  type MailboxPlan,
  type ProvisionStep,
  type PublicMailboxLabel,
} from "./mailbox-status";
import { MAILBOX_LINKS, type OwnerMailboxView } from "./mailbox-view";
import { displayLostEmail } from "./slug";
import { isSupabaseConfigured, supabaseUrl } from "./site";

export { publicPageHasNoMailboxSecrets } from "./mailbox-lifecycle";
export type { OwnerMailboxView };

export type MailboxRow = {
  id: string;
  page_id: string;
  email_local: string;
  status: MailboxLifecycleStatus;
  plan_type: MailboxPlan;
  paid_through: string | null;
  recovery_email: string | null;
  display_name: string | null;
  phone: string | null;
  owner_id: string | null;
  password_secret: string | null;
  polar_customer_id: string | null;
  polar_subscription_id: string | null;
  polar_checkout_id: string | null;
  checkout_expires_at: string | null;
  provision_step: ProvisionStep | null;
  provision_attempts: number;
  provision_retry_at: string | null;
  last_error: string | null;
  disable_reason: MailboxDisableReason | null;
  created_at: string;
  updated_at: string;
};


function requireAdmin(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error("inbox needs the private store.");
  }
  return createClient(
    supabaseUrl()!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function mailboxStoreReady(): boolean {
  return isSupabaseConfigured();
}

function parseLifecycle(value: unknown): MailboxLifecycleStatus {
  if (
    value === "checkout_started" ||
    value === "awaiting_account" ||
    value === "provisioning" ||
    value === "live" ||
    value === "failed" ||
    value === "dark"
  ) {
    return value;
  }
  if (value === "pending") return "provisioning";
  return "dark";
}

function parsePlan(value: unknown): MailboxPlan {
  if (value === "subscription" || value === "month" || value === "day") {
    return value;
  }
  return "once";
}

function parseStep(value: unknown): ProvisionStep | null {
  if (
    value === "payment_received" ||
    value === "creating_inbox" ||
    value === "invitation_sent"
  ) {
    return value;
  }
  return null;
}

function parseReason(value: unknown): MailboxDisableReason | null {
  if (
    value === "cancelled" ||
    value === "refunded" ||
    value === "renewal_failed" ||
    value === "expired"
  ) {
    return value;
  }
  return null;
}

function mapMailbox(row: Record<string, unknown>): MailboxRow {
  return {
    id: String(row.id),
    page_id: String(row.page_id),
    email_local: String(row.email_local),
    status: parseLifecycle(row.status),
    plan_type: parsePlan(row.plan_type),
    paid_through:
      typeof row.paid_through === "string" ? row.paid_through : null,
    recovery_email:
      typeof row.recovery_email === "string" && row.recovery_email
        ? row.recovery_email
        : null,
    display_name:
      typeof row.display_name === "string" && row.display_name
        ? row.display_name
        : null,
    phone: typeof row.phone === "string" && row.phone ? row.phone : null,
    owner_id:
      typeof row.owner_id === "string" && row.owner_id ? row.owner_id : null,
    password_secret:
      typeof row.password_secret === "string" && row.password_secret
        ? row.password_secret
        : null,
    polar_customer_id:
      typeof row.polar_customer_id === "string" ? row.polar_customer_id : null,
    polar_subscription_id:
      typeof row.polar_subscription_id === "string"
        ? row.polar_subscription_id
        : null,
    polar_checkout_id:
      typeof row.polar_checkout_id === "string" ? row.polar_checkout_id : null,
    checkout_expires_at:
      typeof row.checkout_expires_at === "string"
        ? row.checkout_expires_at
        : null,
    provision_step: parseStep(row.provision_step),
    provision_attempts: Number(row.provision_attempts ?? 0) || 0,
    provision_retry_at:
      typeof row.provision_retry_at === "string"
        ? row.provision_retry_at
        : null,
    last_error: typeof row.last_error === "string" ? row.last_error : null,
    disable_reason: parseReason(row.disable_reason),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function toOwnerMailboxView(
  row: MailboxRow,
  now = new Date(),
): OwnerMailboxView {
  const abandoned = isCheckoutAbandoned(
    row.status,
    row.checkout_expires_at,
    now,
  );
  return {
    id: row.id,
    status: row.status,
    plan: row.plan_type,
    address: displayLostEmail(row.email_local),
    recoveryEmail: row.recovery_email,
    paidThrough: row.paid_through,
    provisionStep: row.provision_step,
    provisionAttempts: row.provision_attempts,
    canRetry: row.status === "failed",
    canResumeCheckout: row.status === "checkout_started",
    canClearCheckout: row.status === "checkout_started",
    checkoutExpiresAt: row.checkout_expires_at,
    checkoutAbandoned: abandoned,
    hasPortal: Boolean(row.polar_customer_id),
    webmailUrl: MAILBOX_LINKS.webmailUrl,
    recoveryUrl: MAILBOX_LINKS.recoveryUrl,
    imap: MAILBOX_LINKS.imap,
    smtp: MAILBOX_LINKS.smtp,
    disableReason: row.disable_reason,
  };
}

export async function getMailboxByPageId(
  pageId: string,
): Promise<MailboxRow | null> {
  if (!mailboxStoreReady()) return null;
  const { data, error } = await requireAdmin()
    .from("mailboxes")
    .select("*")
    .eq("page_id", pageId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMailbox(data) : null;
}

export async function getMailboxById(id: string): Promise<MailboxRow | null> {
  if (!mailboxStoreReady()) return null;
  const { data, error } = await requireAdmin()
    .from("mailboxes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMailbox(data) : null;
}

export async function getMailboxBySubscriptionId(
  subscriptionId: string,
): Promise<MailboxRow | null> {
  if (!mailboxStoreReady()) return null;
  const { data, error } = await requireAdmin()
    .from("mailboxes")
    .select("*")
    .eq("polar_subscription_id", subscriptionId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMailbox(data) : null;
}

export async function getMailboxByCustomerId(
  customerId: string,
): Promise<MailboxRow | null> {
  if (!mailboxStoreReady()) return null;
  const { data, error } = await requireAdmin()
    .from("mailboxes")
    .select("*")
    .eq("polar_customer_id", customerId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMailbox(data) : null;
}

export async function getMailboxByCheckoutId(
  checkoutId: string,
): Promise<MailboxRow | null> {
  if (!mailboxStoreReady()) return null;
  const { data, error } = await requireAdmin()
    .from("mailboxes")
    .select("*")
    .eq("polar_checkout_id", checkoutId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMailbox(data) : null;
}

export async function getMailboxByEmailLocal(
  local: string,
): Promise<MailboxRow | null> {
  if (!mailboxStoreReady()) return null;
  const { data, error } = await requireAdmin()
    .from("mailboxes")
    .select("*")
    .eq("email_local", local)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMailbox(data) : null;
}

export async function getMailboxByOwnerId(
  ownerId: string,
): Promise<MailboxRow | null> {
  if (!mailboxStoreReady()) return null;
  const { data, error } = await requireAdmin()
    .from("mailboxes")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMailbox(data) : null;
}

export async function listMailboxesByPageIds(
  pageIds: string[],
): Promise<Map<string, MailboxRow>> {
  const found = new Map<string, MailboxRow>();
  if (!mailboxStoreReady() || pageIds.length === 0) return found;
  const { data, error } = await requireAdmin()
    .from("mailboxes")
    .select("*")
    .in("page_id", pageIds);
  if (error) throw error;
  for (const row of data ?? []) {
    const mapped = mapMailbox(row);
    found.set(mapped.page_id, mapped);
  }
  return found;
}

export async function isMailboxEmailTaken(
  local: string,
  exceptPageId?: string,
): Promise<boolean> {
  if (!mailboxStoreReady()) return false;
  let q = requireAdmin()
    .from("mailboxes")
    .select("page_id")
    .eq("email_local", local)
    .limit(1);
  if (exceptPageId) q = q.neq("page_id", exceptPageId);
  const { data, error } = await q;
  if (error) throw error;
  return Boolean(data?.length);
}

export async function isMailboxAliasLocked(
  pageId: string,
  now = new Date(),
): Promise<boolean> {
  const box = await getMailboxByPageId(pageId);
  if (!box) return false;
  return aliasIsReserved(box.status, box.checkout_expires_at, now);
}

export function pageCanBuyMailbox(input: {
  kept: boolean;
  emailLocal: string | null;
  mailbox: MailboxRow | null;
  now?: Date;
}): boolean {
  return canStartMailboxPurchase({
    kept: input.kept,
    emailLocal: input.emailLocal,
    mailbox: input.mailbox
      ? {
          status: input.mailbox.status,
          checkoutExpiresAt: input.mailbox.checkout_expires_at,
        }
      : null,
    now: input.now,
  });
}

async function syncPublicPage(
  pageId: string,
  box: MailboxRow | null,
  emailLocal?: string | null,
) {
  if (!mailboxStoreReady()) return;
  const label: PublicMailboxLabel = publicMailboxLabel(
    emailLocal ?? box?.email_local,
    box?.status,
  );
  const { error } = await requireAdmin()
    .from("pages")
    .update({
      mailbox_status: label,
      mailbox_expires_at:
        box?.status === "live" ? box.paid_through : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pageId);
  if (error) throw error;
}

async function writeMailbox(
  id: string,
  fields: Record<string, unknown>,
): Promise<MailboxRow> {
  const { data, error } = await requireAdmin()
    .from("mailboxes")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  const row = mapMailbox(data);
  await syncPublicPage(row.page_id, row);
  return row;
}

export async function startMailboxCheckout(input: {
  pageId: string;
  emailLocal: string;
  recoveryEmail?: string | null;
  plan: MailboxPlan;
}): Promise<MailboxRow> {
  const now = new Date();
  const expires = checkoutExpiresAt(now).toISOString();
  const existing = await getMailboxByPageId(input.pageId);
  if (existing) {
    const keepLive = existing.status === "live";
    const row = await writeMailbox(existing.id, {
      email_local: input.emailLocal,
      recovery_email: input.recoveryEmail ?? existing.recovery_email,
      plan_type: keepLive ? existing.plan_type : input.plan,
      status: keepLive ? "live" : "checkout_started",
      polar_checkout_id: keepLive ? existing.polar_checkout_id : null,
      checkout_expires_at: keepLive ? existing.checkout_expires_at : expires,
      last_error: keepLive ? existing.last_error : null,
      disable_reason: keepLive ? existing.disable_reason : null,
    });
    return row;
  }

  const { data, error } = await requireAdmin()
    .from("mailboxes")
    .insert({
      page_id: input.pageId,
      email_local: input.emailLocal,
      recovery_email: input.recoveryEmail ?? null,
      plan_type: input.plan,
      status: "checkout_started",
      checkout_expires_at: expires,
    })
    .select("*")
    .single();
  if (error) throw error;
  const row = mapMailbox(data);
  await syncPublicPage(row.page_id, row, input.emailLocal);
  return row;
}

export async function attachCheckoutId(
  mailboxId: string,
  checkoutId: string,
): Promise<MailboxRow> {
  return writeMailbox(mailboxId, { polar_checkout_id: checkoutId });
}

export async function markMailboxPaidAwaitingAccount(
  mailboxId: string,
  polarCheckoutId?: string | null,
): Promise<MailboxRow> {
  const box = await getMailboxById(mailboxId);
  const now = new Date();
  return writeMailbox(mailboxId, {
    status: box?.password_secret ? "provisioning" : "awaiting_account",
    provision_step: "payment_received",
    paid_through: extendPaidThrough(
      box?.paid_through,
      now,
      box?.plan_type ?? "once",
    ).toISOString(),
    polar_checkout_id: polarCheckoutId ?? box?.polar_checkout_id ?? null,
    checkout_expires_at: null,
    last_error: null,
  });
}

export async function attachMailboxAccount(input: {
  mailboxId: string;
  ownerId: string;
  displayName: string;
  recoveryEmail: string;
  phone: string;
  passwordSecret: string;
}): Promise<MailboxRow> {
  return writeMailbox(input.mailboxId, {
    owner_id: input.ownerId,
    display_name: input.displayName,
    recovery_email: input.recoveryEmail,
    phone: input.phone,
    phone_verified_at: new Date().toISOString(),
    password_secret: input.passwordSecret,
    status: "provisioning",
    provision_step: "payment_received",
    provision_attempts: 0,
    provision_retry_at: new Date().toISOString(),
    last_error: null,
  });
}

export async function updateMailboxPasswordSecret(
  mailboxId: string,
  passwordSecret: string,
): Promise<MailboxRow> {
  return writeMailbox(mailboxId, { password_secret: passwordSecret });
}

export async function listAbandonedCheckouts(
  now = new Date(),
): Promise<MailboxRow[]> {
  if (!mailboxStoreReady()) return [];
  const { data, error } = await requireAdmin()
    .from("mailboxes")
    .select("*")
    .eq("status", "checkout_started");
  if (error) throw error;
  return (data ?? [])
    .map((row) => mapMailbox(row))
    .filter((box) =>
      isCheckoutAbandoned(box.status, box.checkout_expires_at, now),
    );
}

export async function clearMailboxCheckout(
  pageId: string,
): Promise<void> {
  const box = await getMailboxByPageId(pageId);
  if (!box || box.status !== "checkout_started") return;
  const { error } = await requireAdmin()
    .from("mailboxes")
    .delete()
    .eq("id", box.id);
  if (error) throw error;
  await syncPublicPage(pageId, null, box.email_local);
}

export type RecordedPayment = {
  duplicate: boolean;
  mailbox: MailboxRow;
  extended: boolean;
};

export async function recordMailboxPayment(input: {
  mailboxId?: string;
  pageId?: string;
  polarOrderId?: string | null;
  polarCheckoutId?: string | null;
  polarEventId?: string | null;
  polarCustomerId?: string | null;
  polarSubscriptionId?: string | null;
  kind: PaymentKind;
  plan?: MailboxPlan;
}): Promise<RecordedPayment | null> {
  const db = requireAdmin();

  if (input.polarOrderId) {
    const { data: existing } = await db
      .from("mailbox_payments")
      .select("mailbox_id")
      .eq("polar_order_id", input.polarOrderId)
      .maybeSingle();
    if (existing?.mailbox_id) {
      const mailbox = await getMailboxById(existing.mailbox_id);
      if (mailbox) return { duplicate: true, mailbox, extended: false };
    }
  }
  if (input.polarEventId) {
    const { data: existing } = await db
      .from("mailbox_payments")
      .select("mailbox_id")
      .eq("polar_event_id", input.polarEventId)
      .maybeSingle();
    if (existing?.mailbox_id) {
      const mailbox = await getMailboxById(existing.mailbox_id);
      if (mailbox) return { duplicate: true, mailbox, extended: false };
    }
  }
  if (input.polarCheckoutId && input.kind === "purchase") {
    const { data: existing } = await db
      .from("mailbox_payments")
      .select("mailbox_id")
      .eq("polar_checkout_id", input.polarCheckoutId)
      .maybeSingle();
    if (existing?.mailbox_id) {
      const mailbox = await getMailboxById(existing.mailbox_id);
      if (mailbox) return { duplicate: true, mailbox, extended: false };
    }
  }

  let mailbox =
    (input.mailboxId ? await getMailboxById(input.mailboxId) : null) ??
    (input.pageId ? await getMailboxByPageId(input.pageId) : null) ??
    (input.polarSubscriptionId
      ? await getMailboxBySubscriptionId(input.polarSubscriptionId)
      : null) ??
    (input.polarCheckoutId
      ? await getMailboxByCheckoutId(input.polarCheckoutId)
      : null) ??
    (input.polarCustomerId
      ? await getMailboxByCustomerId(input.polarCustomerId)
      : null);
  if (!mailbox) return null;

  const { error: insertError } = await db.from("mailbox_payments").insert({
    mailbox_id: mailbox.id,
    polar_order_id: input.polarOrderId ?? null,
    polar_checkout_id: input.polarCheckoutId ?? mailbox.polar_checkout_id,
    polar_event_id: input.polarEventId ?? null,
    polar_subscription_id:
      input.polarSubscriptionId ?? mailbox.polar_subscription_id,
    kind: input.kind,
  });
  if (insertError) {
    if (insertError.code === "23505") {
      const latest = await getMailboxById(mailbox.id);
      return latest
        ? { duplicate: true, mailbox: latest, extended: false }
        : null;
    }
    throw insertError;
  }

  const now = new Date();
  const alreadyCountedPurchase =
    input.kind === "purchase" &&
    (mailbox.status === "provisioning" ||
      mailbox.status === "awaiting_account");
  const extendsService =
    (input.kind === "purchase" || input.kind === "renewal") &&
    !alreadyCountedPurchase;
  const paidThrough = extendsService
    ? extendPaidThrough(
        mailbox.paid_through,
        now,
        input.plan ?? mailbox.plan_type,
      ).toISOString()
    : mailbox.paid_through;

  const nextStatus: MailboxLifecycleStatus = extendsService
    ? mailbox.status === "live"
      ? "live"
      : mailbox.password_secret
        ? "provisioning"
        : "awaiting_account"
    : mailbox.status;

  mailbox = await writeMailbox(mailbox.id, {
    status: nextStatus,
    plan_type: input.plan ?? mailbox.plan_type,
    paid_through: paidThrough,
    polar_customer_id: input.polarCustomerId ?? mailbox.polar_customer_id,
    polar_subscription_id:
      input.polarSubscriptionId ?? mailbox.polar_subscription_id,
    polar_checkout_id: input.polarCheckoutId ?? mailbox.polar_checkout_id,
    checkout_expires_at: null,
    provision_step:
      nextStatus === "provisioning" && mailbox.status !== "live"
        ? "payment_received"
        : nextStatus === "awaiting_account"
          ? "payment_received"
          : mailbox.provision_step,
    provision_attempts:
      (nextStatus === "provisioning" || nextStatus === "awaiting_account") &&
      mailbox.status !== "live"
        ? 0
        : mailbox.provision_attempts,
    provision_retry_at:
      nextStatus === "provisioning" && mailbox.status !== "live"
        ? now.toISOString()
        : mailbox.provision_retry_at,
    last_error: extendsService ? null : mailbox.last_error,
    disable_reason: extendsService ? null : mailbox.disable_reason,
  });

  return { duplicate: false, mailbox, extended: extendsService };
}

export async function setMailboxProvisioningStep(
  mailboxId: string,
  step: ProvisionStep,
): Promise<MailboxRow> {
  return writeMailbox(mailboxId, {
    status: "provisioning",
    provision_step: step,
  });
}

export async function markMailboxLive(mailboxId: string): Promise<MailboxRow> {
  return writeMailbox(mailboxId, {
    status: "live",
    provision_step: "invitation_sent",
    provision_retry_at: null,
    last_error: null,
    disable_reason: null,
  });
}

export async function markMailboxProvisionFailed(
  mailboxId: string,
  errorMessage: string,
  now = new Date(),
): Promise<{ mailbox: MailboxRow; alertAdmin: boolean }> {
  const current = await getMailboxById(mailboxId);
  const attempts = (current?.provision_attempts ?? 0) + 1;
  const retryAt = nextProvisionRetryAt(attempts, now);
  const mailbox = await writeMailbox(mailboxId, {
    status: retryAt ? "provisioning" : "failed",
    provision_attempts: attempts,
    provision_retry_at: retryAt?.toISOString() ?? null,
    last_error: errorMessage.slice(0, 500),
  });
  return { mailbox, alertAdmin: shouldAlertAdmin(attempts) };
}

export async function queueMailboxRetry(mailboxId: string): Promise<MailboxRow> {
  return writeMailbox(mailboxId, {
    status: "provisioning",
    provision_attempts: 0,
    provision_retry_at: new Date().toISOString(),
    last_error: null,
  });
}

export async function markMailboxDisabled(
  mailboxId: string,
  reason: MailboxDisableReason,
): Promise<MailboxRow> {
  return writeMailbox(mailboxId, {
    status: "dark",
    disable_reason: reason,
    provision_retry_at: null,
  });
}

export async function listLiveMailboxesDue(
  now = new Date(),
): Promise<MailboxRow[]> {
  if (!mailboxStoreReady()) return [];
  const { data, error } = await requireAdmin()
    .from("mailboxes")
    .select("*")
    .eq("status", "live")
    .lte("paid_through", now.toISOString());
  if (error) throw error;
  return (data ?? []).map((row) => mapMailbox(row));
}

export async function listProvisioningDue(
  now = new Date(),
): Promise<MailboxRow[]> {
  if (!mailboxStoreReady()) return [];
  const { data, error } = await requireAdmin()
    .from("mailboxes")
    .select("*")
    .in("status", ["provisioning", "failed"])
    .lte("provision_retry_at", now.toISOString());
  if (error) throw error;
  return (data ?? []).map((row) => mapMailbox(row));
}

export async function listLiveMailboxes(): Promise<MailboxRow[]> {
  if (!mailboxStoreReady()) return [];
  const { data, error } = await requireAdmin()
    .from("mailboxes")
    .select("*")
    .eq("status", "live")
    .not("paid_through", "is", null);
  if (error) throw error;
  return (data ?? []).map((row) => mapMailbox(row));
}

export async function listDueReminders(
  now = new Date(),
): Promise<Array<{ mailbox: MailboxRow; kinds: ReminderKind[] }>> {
  const live = await listLiveMailboxes();
  const due: Array<{ mailbox: MailboxRow; kinds: ReminderKind[] }> = [];
  for (const mailbox of live) {
    if (!mailbox.paid_through) continue;
    const sent = await listSentNotificationKinds(mailbox.id);
    const kinds = reminderKindsDue(mailbox.paid_through, now, sent);
    if (kinds.length) due.push({ mailbox, kinds });
  }
  return due;
}

export async function listSentNotificationKinds(
  mailboxId: string,
): Promise<string[]> {
  if (!mailboxStoreReady()) return [];
  const { data, error } = await requireAdmin()
    .from("mailbox_notifications")
    .select("kind")
    .eq("mailbox_id", mailboxId)
    .not("sent_at", "is", null);
  if (error) throw error;
  return (data ?? []).map((row) => String(row.kind));
}

export async function claimNotification(
  mailboxId: string,
  kind: string,
): Promise<boolean> {
  const db = requireAdmin();
  const { data: existing } = await db
    .from("mailbox_notifications")
    .select("id, sent_at")
    .eq("mailbox_id", mailboxId)
    .eq("kind", kind)
    .maybeSingle();
  if (existing?.sent_at) return false;
  if (existing) {
    const { error } = await db
      .from("mailbox_notifications")
      .update({ last_error: null })
      .eq("id", existing.id)
      .is("sent_at", null);
    if (error) throw error;
    return true;
  }
  const { error } = await db.from("mailbox_notifications").insert({
    mailbox_id: mailboxId,
    kind,
  });
  if (error) {
    if (error.code === "23505") return false;
    throw error;
  }
  return true;
}

export async function markNotificationSent(
  mailboxId: string,
  kind: string,
): Promise<void> {
  const { error } = await requireAdmin()
    .from("mailbox_notifications")
    .update({
      sent_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("mailbox_id", mailboxId)
    .eq("kind", kind);
  if (error) throw error;
}

export async function markNotificationFailed(
  mailboxId: string,
  kind: string,
  message: string,
): Promise<void> {
  const { error } = await requireAdmin()
    .from("mailbox_notifications")
    .update({
      failed_at: new Date().toISOString(),
      last_error: message.slice(0, 500),
    })
    .eq("mailbox_id", mailboxId)
    .eq("kind", kind);
  if (error) throw error;
}

export async function lastSetupHelpAt(
  mailboxId: string,
): Promise<string | null> {
  if (!mailboxStoreReady()) return null;
  const { data, error } = await requireAdmin()
    .from("mailbox_notifications")
    .select("sent_at")
    .eq("mailbox_id", mailboxId)
    .eq("kind", "setup_help")
    .maybeSingle();
  if (error) throw error;
  return typeof data?.sent_at === "string" ? data.sent_at : null;
}

export async function canSendSetupHelp(
  mailboxId: string,
  now = new Date(),
): Promise<boolean> {
  return setupHelpAllowed(await lastSetupHelpAt(mailboxId), now);
}

export async function recordSetupHelpSent(mailboxId: string): Promise<void> {
  const db = requireAdmin();
  const { data } = await db
    .from("mailbox_notifications")
    .select("id")
    .eq("mailbox_id", mailboxId)
    .eq("kind", "setup_help")
    .maybeSingle();
  if (data?.id) {
    const { error } = await db
      .from("mailbox_notifications")
      .update({
        sent_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", data.id);
    if (error) throw error;
    return;
  }
  const { error } = await db.from("mailbox_notifications").insert({
    mailbox_id: mailboxId,
    kind: "setup_help",
    sent_at: new Date().toISOString(),
  });
  if (error && error.code !== "23505") throw error;
}

export function adminAlertKind(): string {
  return ADMIN_ALERT_KIND;
}
