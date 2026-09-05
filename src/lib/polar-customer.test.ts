import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mailboxCheckoutCustomer,
  mailboxExternalCustomerId,
  polarCustomerMatchesMailbox,
  polarOrderMatchesMailbox,
} from "./polar-customer";

test("mailbox checkouts use a stable mailbox-specific customer identity", () => {
  const a = mailboxCheckoutCustomer({ mailboxId: "mailbox-a" });
  const b = mailboxCheckoutCustomer({ mailboxId: "mailbox-b" });
  assert.deepEqual(a, {
    externalCustomerId: mailboxExternalCustomerId("mailbox-a"),
  });
  assert.notEqual(a.externalCustomerId, b.externalCustomerId);
  assert.equal("customerEmail" in a, false);
});

test("customers and orders must name the intended mailbox", () => {
  assert.equal(
    polarCustomerMatchesMailbox(
      { externalId: mailboxExternalCustomerId("mailbox-a") },
      "mailbox-a",
    ),
    true,
  );
  assert.equal(
    polarCustomerMatchesMailbox(
      { externalId: mailboxExternalCustomerId("mailbox-a") },
      "mailbox-b",
    ),
    false,
  );
  assert.equal(
    polarOrderMatchesMailbox(
      { metadata: { mailbox_id: "mailbox-a" } },
      "mailbox-b",
    ),
    false,
  );
});
