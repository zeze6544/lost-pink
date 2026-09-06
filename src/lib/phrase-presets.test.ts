import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LANDING_PHRASE_PRESET,
  presetById,
  presetForPath,
} from "./phrase-presets";

test("landing preset is the idle hero", () => {
  assert.equal(presetById(LANDING_PHRASE_PRESET)?.text, "pity is a terrible religion");
});

test("known routes keep a stable phrase", () => {
  assert.equal(presetForPath("/come"), "fear-repetition");
  assert.equal(presetForPath("/support/"), "victimhood-audience");
  assert.equal(presetForPath("/come/forgot?email=a"), "cage-shape");
});
