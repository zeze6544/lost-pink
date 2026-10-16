import assert from "node:assert/strict";
import { test } from "node:test";
import {
  displayFrom,
  formatMailWhen,
  holdCountdownCopy,
  inboxEmptyCopy,
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

test("empty inbox copy is a phrase, not a placeholder", () => {
  assert.equal(inboxEmptyCopy("inbox"), "the page is here. the letters aren't.");
  assert.doesNotMatch(inboxEmptyCopy("inbox"), /nothing in here yet/);
});

test("held names count down instead of dumping the claimer", () => {
  const now = new Date("2026-09-06T12:00:00.000Z").getTime();
  assert.equal(
    holdCountdownCopy(new Date(now + 3 * 3_600_000).toISOString(), now),
    "held for 3h.",
  );
  assert.equal(
    holdCountdownCopy(new Date(now + 45 * 60_000).toISOString(), now),
    "held for 45m.",
  );
  assert.equal(holdCountdownCopy(new Date(now - 1_000).toISOString(), now), "the hold just ended.");
});
