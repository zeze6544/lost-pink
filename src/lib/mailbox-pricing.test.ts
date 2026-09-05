import assert from "node:assert/strict";
import { test } from "node:test";
import { MAILBOX_OFFERS, planFromProductId } from "./mailbox-pricing";

test("mailbox offers keep the requested duration order and explanations", () => {
  assert.deepEqual(
    MAILBOX_OFFERS.map(({ plan, explanation }) => ({ plan, explanation })),
    [
      { plan: "day", explanation: "gone tomorrow" },
      { plan: "month", explanation: "keep it for a month" },
      { plan: "once", explanation: "one year, no renewal" },
      { plan: "subscription", explanation: "keep it alive" },
    ],
  );
});

test("mailbox offer labels stay consistent with their configured cents", () => {
  for (const offer of MAILBOX_OFFERS) {
    assert.match(offer.label, new RegExp(`^A\\$${offer.cents / 100}(?:\\D|$)`));
  }
});

test("mailbox offers use the backed Polar price points", () => {
  assert.deepEqual(
    MAILBOX_OFFERS.map(({ plan, cents }) => ({ plan, cents })),
    [
      { plan: "day", cents: 100 },
      { plan: "month", cents: 500 },
      { plan: "once", cents: 2500 },
      { plan: "subscription", cents: 2500 },
    ],
  );
});

test("replaced annual products remain recognizable to webhooks", () => {
  assert.equal(
    planFromProductId("ea21abdf-9f3a-462e-806f-4f98a308e1aa"),
    "once",
  );
  assert.equal(
    planFromProductId("24ec200c-d710-4da0-b4d8-cae9d99d4919"),
    "subscription",
  );
});
