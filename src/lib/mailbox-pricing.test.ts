import assert from "node:assert/strict";
import { test } from "node:test";
import { MAILBOX_OFFERS, planFromProductId } from "./mailbox-pricing";

test("mailbox offers follow the approved landing order and copy", () => {
  assert.deepEqual(
    MAILBOX_OFFERS.map(({ plan, explanation }) => ({ plan, explanation })),
    [
      { plan: "month", explanation: "once for 1 month" },
      { plan: "subscription", explanation: "annually" },
      { plan: "once", explanation: "once for 12 months" },
      { plan: "day", explanation: "once for 1 day" },
    ],
  );
});

test("mailbox offer labels match the approved screenshot amounts", () => {
  assert.deepEqual(
    MAILBOX_OFFERS.map((offer) => offer.label),
    ["$5", "$20", "$20", "$1"],
  );
});

test("mailbox offers keep the backed Polar price points", () => {
  assert.deepEqual(
    MAILBOX_OFFERS.map(({ plan, cents }) => ({ plan, cents })),
    [
      { plan: "month", cents: 500 },
      { plan: "subscription", cents: 2500 },
      { plan: "once", cents: 2500 },
      { plan: "day", cents: 100 },
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
