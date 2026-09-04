import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aliasIsReserved,
  canClearCheckout,
  canResumeCheckout,
  canStartMailboxPurchase,
  checkoutExpiresAt,
  extendPaidThrough,
  isCheckoutAbandoned,
  MAILBOX_YEAR_MS,
  MAX_PROVISION_ATTEMPTS,
  nextPaidThrough,
  nextProvisionRetryAt,
  ownerCanManage,
  publicPageHasNoMailboxSecrets,
  reminderKindsDue,
  setupHelpAllowed,
  SETUP_HELP_COOLDOWN_MS,
  shouldAlertAdmin,
  shouldDisableForSubscriptionStatus,
} from "./mailbox-lifecycle";
import { MAILBOX_DAY_MS, MAILBOX_MONTH_MS } from "./mailbox-pricing";
import { publicMailboxLabel } from "./mailbox-status";

const now = new Date("2026-09-03T00:00:00.000Z");

test("one-time renewals extend from the later of today or existing expiry", () => {
  const later = new Date("2027-01-01T00:00:00.000Z");
  const fromFuture = extendPaidThrough(later.toISOString(), now, "once");
  assert.equal(fromFuture.getTime(), later.getTime() + MAILBOX_YEAR_MS);

  const past = new Date("2025-01-01T00:00:00.000Z");
  const fromPast = extendPaidThrough(past.toISOString(), now, "once");
  assert.equal(fromPast.getTime(), now.getTime() + MAILBOX_YEAR_MS);
});

test("month and day purchases add the matching window", () => {
  const month = extendPaidThrough(null, now, "month");
  assert.equal(month.getTime(), now.getTime() + MAILBOX_MONTH_MS);
  const day = extendPaidThrough(null, now, "day");
  assert.equal(day.getTime(), now.getTime() + MAILBOX_DAY_MS);
});

test("duplicate payments do not extend twice", () => {
  const first = nextPaidThrough(null, "purchase", false, now);
  assert.ok(first);
  const again = nextPaidThrough(first.toISOString(), "purchase", true, now);
  assert.equal(again?.getTime(), first.getTime());
});

test("abandoned checkout can be resumed or cleared, and does not lock the alias forever", () => {
  const expires = checkoutExpiresAt(now);
  assert.equal(
    isCheckoutAbandoned("checkout_started", expires.toISOString(), now),
    false,
  );
  assert.equal(
    aliasIsReserved("checkout_started", expires.toISOString(), now),
    true,
  );

  const after = new Date(expires.getTime() + 1000);
  assert.equal(
    isCheckoutAbandoned("checkout_started", expires.toISOString(), after),
    true,
  );
  assert.equal(
    aliasIsReserved("checkout_started", expires.toISOString(), after),
    false,
  );
  assert.equal(canResumeCheckout("checkout_started"), true);
  assert.equal(canClearCheckout("checkout_started"), true);
  assert.equal(
    canStartMailboxPurchase({
      kept: true,
      emailLocal: "rose",
      mailbox: {
        status: "checkout_started",
        checkoutExpiresAt: expires.toISOString(),
      },
      now: after,
    }),
    true,
  );
});

test("live, provisioning, and awaiting_account inboxes cannot be bought again", () => {
  assert.equal(
    canStartMailboxPurchase({
      kept: true,
      emailLocal: "rose",
      mailbox: { status: "live", checkoutExpiresAt: null },
      now,
    }),
    false,
  );
  assert.equal(
    canStartMailboxPurchase({
      kept: true,
      emailLocal: "rose",
      mailbox: { status: "provisioning", checkoutExpiresAt: null },
      now,
    }),
    false,
  );
  assert.equal(
    canStartMailboxPurchase({
      kept: true,
      emailLocal: "rose",
      mailbox: { status: "awaiting_account", checkoutExpiresAt: null },
      now,
    }),
    false,
  );
  assert.equal(
    canStartMailboxPurchase({
      kept: true,
      emailLocal: "rose",
      mailbox: { status: "dark", checkoutExpiresAt: null },
      now,
    }),
    true,
  );
});

test("subscription cancel, refund, and failed renewal disable immediately", () => {
  assert.equal(shouldDisableForSubscriptionStatus("canceled"), "cancelled");
  assert.equal(shouldDisableForSubscriptionStatus("revoked"), "cancelled");
  assert.equal(shouldDisableForSubscriptionStatus("past_due"), "renewal_failed");
  assert.equal(shouldDisableForSubscriptionStatus("active"), null);
});

test("provisioning retries back off and alert once at the limit", () => {
  assert.ok(nextProvisionRetryAt(1, now));
  assert.equal(nextProvisionRetryAt(MAX_PROVISION_ATTEMPTS, now), null);
  assert.equal(shouldAlertAdmin(MAX_PROVISION_ATTEMPTS - 1), false);
  assert.equal(shouldAlertAdmin(MAX_PROVISION_ATTEMPTS), true);
});

test("reminders are idempotent per window", () => {
  const paidThrough = new Date(now.getTime() + 3 * 86_400_000).toISOString();
  const first = reminderKindsDue(paidThrough, now, []);
  assert.deepEqual(first, ["reminder_30", "reminder_7"]);
  const again = reminderKindsDue(paidThrough, now, first);
  assert.deepEqual(again, []);
});

test("setup help is rate limited", () => {
  assert.equal(setupHelpAllowed(null, now), true);
  assert.equal(setupHelpAllowed(now.toISOString(), now), false);
  assert.equal(
    setupHelpAllowed(
      new Date(now.getTime() - SETUP_HELP_COOLDOWN_MS).toISOString(),
      now,
    ),
    true,
  );
});

test("owner authorization requires the signed-in owner", () => {
  assert.equal(
    ownerCanManage({ userId: "a", pageOwnerId: "a" }),
    true,
  );
  assert.equal(
    ownerCanManage({ userId: "a", pageOwnerId: "b" }),
    false,
  );
  assert.equal(ownerCanManage({ userId: null, pageOwnerId: "a" }), false);
});

test("public presentation never includes recovery email or Polar IDs", () => {
  assert.equal(publicMailboxLabel("rose", "live"), "open");
  assert.equal(publicMailboxLabel("rose", "dark"), "display");
  assert.equal(publicMailboxLabel(null, null), "none");
  assert.equal(
    publicPageHasNoMailboxSecrets({
      email_local: "rose",
      mailbox_status: "open",
    }),
    true,
  );
  assert.equal(
    publicPageHasNoMailboxSecrets({
      email_local: "rose",
      mailbox_recovery_email: "you@example.com",
    }),
    false,
  );
  assert.equal(
    publicPageHasNoMailboxSecrets({
      mailbox_polar_order_id: "ord_1",
    }),
    false,
  );
});
