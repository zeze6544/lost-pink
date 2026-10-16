import assert from "node:assert/strict";
import { test } from "node:test";
import {
  signAttachmentToken,
  verifyAttachmentToken,
  type AttachmentTokenBinding,
} from "./mail-attachment-token";

const binding: AttachmentTokenBinding = {
  pageId: "page-123",
  folder: "inbox",
  uid: 42,
  partId: "2.1",
};
const now = Date.parse("2026-09-05T12:00:00.000Z");

test("attachment token binds every mailbox identifier", () => {
  const token = signAttachmentToken(binding, now);
  assert.deepEqual(verifyAttachmentToken(token, binding, now), binding);
  assert.equal(
    verifyAttachmentToken(token, { ...binding, uid: 43 }, now),
    null,
  );
  assert.equal(
    verifyAttachmentToken(token, { ...binding, folder: "sent" }, now),
    null,
  );
});

test("attachment token rejects tampering and expiry", () => {
  const token = signAttachmentToken(binding, now);
  const [payload, signature] = token.split(".");
  const tamperedPayload = `${payload.slice(0, -1)}${
    payload.endsWith("a") ? "b" : "a"
  }`;
  assert.equal(
    verifyAttachmentToken(`${tamperedPayload}.${signature}`, undefined, now),
    null,
  );
  assert.equal(
    verifyAttachmentToken(token, undefined, now + 5 * 60 * 1000),
    null,
  );
});

test("attachment token contains identifiers but no mailbox content", () => {
  const token = signAttachmentToken(binding, now);
  const payload = JSON.parse(
    Buffer.from(token.split(".")[0], "base64url").toString("utf8"),
  ) as Record<string, unknown>;
  assert.equal(payload.pageId, binding.pageId);
  assert.equal("password" in payload, false);
  assert.equal("content" in payload, false);
  assert.equal("filename" in payload, false);
});
