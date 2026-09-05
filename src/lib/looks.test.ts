import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isPalette,
  PALETTES,
  parseLook,
  sanitizeTitle,
  TITLE_MAX,
} from "./looks";

test("all twelve editor palettes are accepted", () => {
  assert.equal(PALETTES.length, 12);
  for (const palette of PALETTES) assert.equal(isPalette(palette), true);
  assert.deepEqual(parseLook({ palette: "ember" }), {
    palette: "ember",
    treatment: "display",
    motif: "grain",
    font: "newsreader",
  });
  assert.deepEqual(parseLook({ palette: "neon" }), {
    error: "unknown palette.",
  });
});

test("display titles keep spaces without changing a URL handle", () => {
  assert.equal(sanitizeTitle("  hello   quiet world  "), "hello quiet world");
  assert.equal(sanitizeTitle("x".repeat(100)).length, TITLE_MAX);
  assert.equal(sanitizeTitle("", "canonical-handle"), "canonical-handle");
});
