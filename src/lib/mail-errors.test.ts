import assert from "node:assert/strict";
import { test } from "node:test";
import {
  classifyMailError,
  isMissingFolderError,
  MailImapError,
} from "./mail-errors";

test("maps mailbox provisioning separately and marks it retryable", () => {
  assert.deepEqual(
    classifyMailError(
      new MailImapError("provisioning", "Mailbox secret is unavailable."),
    ),
    {
      kind: "provisioning",
      error: "the inbox is still arriving.",
      status: 409,
      retryable: true,
    },
  );
});

test("maps IMAP authentication failures as non-retryable", () => {
  assert.deepEqual(
    classifyMailError({
      responseCode: "AUTHENTICATIONFAILED",
      message: "Invalid credentials",
    }),
    {
      kind: "auth",
      error: "the inbox credentials were rejected.",
      status: 502,
      retryable: false,
    },
  );
});

test("maps missing folders separately from timeouts", () => {
  const missing = {
    responseCode: "NONEXISTENT",
    message: "No such mailbox",
  };
  assert.equal(isMissingFolderError(missing), true);
  assert.deepEqual(classifyMailError(missing), {
    kind: "folder",
    error: "that folder isn't available.",
    status: 502,
    retryable: false,
  });
  assert.deepEqual(
    classifyMailError({ code: "ETIMEDOUT", message: "socket timed out" }),
    {
      kind: "timeout",
      error: "the mail server took too long.",
      status: 504,
      retryable: true,
    },
  );
});
