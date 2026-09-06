import assert from "node:assert/strict";
import { test } from "node:test";
import {
  displayFrom,
  formatMailWhen,
  inboxLabel,
  inboxOnceLabel,
  inboxYearlyLabel,
} from "./voice";

test("displayFrom prefers the name", () => {
  assert.equal(displayFrom("Ada <ada@example.com>"), "Ada");
  assert.equal(displayFrom('"Ada" <ada@example.com>'), "Ada");
  assert.equal(displayFrom("ada@example.com"), "ada@example.com");
  assert.equal(displayFrom(""), "someone");
});

test("formatMailWhen is relative today and dated otherwise", () => {
  const now = new Date("2026-09-04T12:00:00");
  assert.equal(
    formatMailWhen(new Date(now.getTime() - 30_000).toISOString(), now),
    "now",
  );
  assert.equal(
    formatMailWhen(new Date(now.getTime() - 5 * 60_000).toISOString(), now),
    "5m",
  );
  assert.equal(formatMailWhen("2026-03-02T12:00:00", now), "march 2");
  assert.equal(formatMailWhen("2025-03-02T12:00:00", now), "march 2, 2025");
});

test("annual inbox copy states the A$20 year price", () => {
  assert.equal(inboxOnceLabel(), "A$20 one-year");
  assert.equal(inboxYearlyLabel(), "A$20 annually");
  assert.match(inboxLabel(), /A\$20 a year/);
});
