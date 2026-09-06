import assert from "node:assert/strict";
import { test } from "node:test";
import { pageStoreProblem } from "./page-store-error";

test("palette constraints become an actionable client error", () => {
  assert.deepEqual(
    pageStoreProblem({
      code: "23514",
      message: "violates check constraint pages_palette_check",
    }),
    {
      error: "that color isn't available yet. choose another and try again.",
      status: 400,
    },
  );
});

test("unique constraints become conflicts and unknown failures stay private", () => {
  assert.deepEqual(pageStoreProblem({ code: "23505" }), {
    error: "that name is already spoken for.",
    status: 409,
  });
  assert.equal(pageStoreProblem(new Error("network broke")), null);
});
