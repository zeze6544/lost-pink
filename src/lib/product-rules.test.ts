import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NAME_MAX_CHARS,
  NAME_MIN_CHARS,
  NEVER_FOR_SALE,
  claimLengthCopy,
  impliedPageAndAddress,
  nameIsPageAndAddress,
} from "./product-rules";
import { validateSlug, isReservedName } from "./slug";

test("the page path implies the inbox address", () => {
  assert.equal(
    impliedPageAndAddress("mercy"),
    "lost.pink/mercy → mercy@lost.pink",
  );
  assert.match(nameIsPageAndAddress(), /page and the address/);
});

test("claim length copy matches the name bounds", () => {
  assert.match(claimLengthCopy(), new RegExp(String(NAME_MIN_CHARS)));
  assert.equal(NAME_MIN_CHARS, 2);
  assert.equal(NAME_MAX_CHARS, 16);
});

test("single-letter names are invalid in the whisper, not only the API", () => {
  const short = validateSlug("m");
  assert.equal(short.ok, false);
  if (!short.ok) {
    assert.match(short.error, /2/);
  }
});

test("never-for-sale names stay off the market", () => {
  assert.ok(NEVER_FOR_SALE.includes("support"));
  assert.ok(NEVER_FOR_SALE.includes("polar"));
  assert.equal(isReservedName("polar"), true);
  assert.equal(isReservedName("abuse"), true);
});
