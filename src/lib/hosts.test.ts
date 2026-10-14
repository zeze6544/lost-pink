import assert from "node:assert/strict";
import test from "node:test";
import {
  directoryHref,
  isJawsHost,
  isLostHost,
  lostBaseFromHeader,
  lostEntryHref,
  withBase,
} from "./hosts";

test("lost and jaws hosts", () => {
  assert.equal(isLostHost("lost.localhost:3000"), true);
  assert.equal(isLostHost("lost.pink"), true);
  assert.equal(isLostHost("www.lost.pink"), true);
  assert.equal(isLostHost("localhost:3000"), false);
  assert.equal(isJawsHost("jaws.localhost:3000"), true);
  assert.equal(isJawsHost("jaws.example.com"), true);
  assert.equal(isJawsHost("localhost:3000"), false);
  assert.equal(isLostHost("jaws.localhost"), false);
});

test("withBase prefixes preview paths once", () => {
  assert.equal(withBase("", "/you"), "/you");
  assert.equal(withBase("/lost", "/you"), "/lost/you");
  assert.equal(withBase("/lost", "/"), "/lost");
  assert.equal(withBase("/lost", "/lost/you"), "/lost/you");
  assert.equal(withBase("/lost", "/come?next=/you"), "/lost/come?next=/you");
  assert.equal(withBase("/lost", "https://lost.pink/you"), "https://lost.pink/you");
});

test("lost base header is exact", () => {
  assert.equal(lostBaseFromHeader("/lost"), "/lost");
  assert.equal(lostBaseFromHeader("/lost/you"), "");
  assert.equal(lostBaseFromHeader(null), "");
});

test("entry links", () => {
  assert.equal(lostEntryHref("localhost:3000"), "http://lost.localhost:3000/");
  assert.equal(lostEntryHref("lost.pink"), "/");
  assert.equal(lostEntryHref("preview.vercel.app"), "/lost");
  assert.equal(directoryHref("jaws.localhost:3000"), "http://localhost:3000/");
  assert.equal(directoryHref("localhost:3000"), "/");
});
