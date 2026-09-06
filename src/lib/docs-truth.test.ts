import assert from "node:assert/strict";
import { test } from "node:test";
import {
  docsCorpus,
  forbiddenDocsHits,
  privacyQuestions,
  supportQuestions,
  termsQuestions,
} from "./docs-truth";
import { MAIL_GRACE_DAYS, MAIL_HOST, PAYMENTS_VIA } from "./product-rules";

test("docs copy never claims our servers, twilio, or a phone number", () => {
  assert.deepEqual(forbiddenDocsHits(docsCorpus()), []);
});

test("privacy names the mail host and does not claim we store the mailbox", () => {
  const mail = privacyQuestions().find((item) => item.q === "what about mail?");
  assert.ok(mail);
  assert.match(mail.a, new RegExp(MAIL_HOST, "i"));
  assert.match(mail.a, /we do not store the mailbox/i);
  assert.match(mail.a, new RegExp(String(MAIL_GRACE_DAYS)));
});

test("privacy recovery is email only", () => {
  const store = privacyQuestions().find((item) => item.q === "what do you store?");
  assert.ok(store);
  assert.match(store.a, /recovery email/);
  assert.match(store.a, /no phone/);
  assert.match(store.a, new RegExp(PAYMENTS_VIA, "i"));
});

test("support, privacy, and terms share the same Q&A count shape", () => {
  assert.equal(privacyQuestions().length, 5);
  assert.equal(supportQuestions().length, 5);
  assert.equal(termsQuestions().length, 5);
  for (const item of [
    ...privacyQuestions(),
    ...supportQuestions(),
    ...termsQuestions(),
  ]) {
    assert.ok(item.q.endsWith("?"));
    assert.ok(item.a.length > 20);
  }
});

test("terms name the host and first-come rule", () => {
  const mail = termsQuestions().find((item) => item.q === "how is mail handled?");
  const buy = termsQuestions().find((item) => item.q === "what am i buying?");
  assert.ok(mail && buy);
  assert.match(mail.a, new RegExp(MAIL_HOST, "i"));
  assert.match(buy.a, /first come, first served/);
  assert.doesNotMatch(mail.a, /our servers/i);
});
