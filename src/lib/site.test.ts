import assert from "node:assert/strict";
import { test } from "node:test";
import { safeNextPath } from "./site";

test("safeNextPath keeps in-app paths", () => {
  assert.equal(safeNextPath("/you"), "/you");
  assert.equal(safeNextPath("/come?x=1"), "/come?x=1");
});

test("safeNextPath blocks open redirects", () => {
  assert.equal(safeNextPath("//evil.com"), "/you");
  assert.equal(safeNextPath("/\\evil.com"), "/you");
  assert.equal(safeNextPath("https://evil.com"), "/you");
  assert.equal(safeNextPath("/%5cevil.com"), "/you");
});
