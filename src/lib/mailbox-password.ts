import { encryptSecret } from "./mailbox-secret";
import {
  getMailboxByOwnerId,
  updateMailboxPasswordSecret,
} from "./mailbox-store";
import { setMailboxPassword } from "./migadu";

/** Keep Migadu IMAP and the encrypted inbox key in step with the site password. */
export async function syncOwnedMailboxPassword(
  ownerId: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const mailbox = await getMailboxByOwnerId(ownerId);
    if (!mailbox?.email_local) return { ok: true };
    const result = await setMailboxPassword(mailbox.email_local, password);
    if (!result.ok) {
      console.error("mailbox password sync failed", result.error);
      return {
        ok: false,
        error: "site password updated, but the mail password didn’t sync. try again.",
      };
    }
    await updateMailboxPasswordSecret(mailbox.id, encryptSecret(password));
    return { ok: true };
  } catch (error) {
    console.error("mailbox password sync failed", error);
    return {
      ok: false,
      error: "site password updated, but the mail password didn’t sync. try again.",
    };
  }
}
