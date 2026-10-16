import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeRecoveryEmail } from "./recovery-email";

test("a lost.pink session cannot replace an external recovery address", () => {
  assert.equal(
    mergeRecoveryEmail("Owner@Example.com", "someone@lost.pink"),
    "owner@example.com",
  );
});

test("valid external recovery addresses are normalized and accepted", () => {
  assert.equal(
    mergeRecoveryEmail(null, " New.Owner@Example.com "),
    "new.owner@example.com",
  );
});

test("invalid legacy recovery addresses are removed", () => {
  assert.equal(mergeRecoveryEmail("person@lost.pink", null), null);
  assert.equal(mergeRecoveryEmail("not-an-email", null), null);
});
