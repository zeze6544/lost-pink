import assert from "node:assert/strict";
import { test } from "node:test";
import {
  HOME_MAILBOX_OFFERS,
  MAILBOX_OFFERS,
  planFromProductId,
} from "./mailbox-pricing";

test("home offers are day / month / year only", () => {
  assert.deepEqual(
    HOME_MAILBOX_OFFERS.map(({ plan, explanation }) => ({ plan, explanation })),
    [
      { plan: "day", explanation: "/ day" },
      { plan: "month", explanation: "/ month" },
      { plan: "subscription", explanation: "/ year · cancel anytime" },
    ],
  );
});

test("home offer labels match the locked A$1 / A$5 / A$20 tray", () => {
  assert.deepEqual(
    HOME_MAILBOX_OFFERS.map((offer) => offer.label),
    ["A$1", "A$5", "A$20"],
  );
});

test("catalog keeps day, month, year, and legacy once", () => {
  assert.deepEqual(
    MAILBOX_OFFERS.map(({ plan, cents }) => ({ plan, cents })),
    [
      { plan: "day", cents: 100 },
      { plan: "month", cents: 500 },
      { plan: "subscription", cents: 2000 },
      { plan: "once", cents: 2000 },
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
