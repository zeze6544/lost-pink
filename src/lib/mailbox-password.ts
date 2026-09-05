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
): Promise<void> {
  try {
    const mailbox = await getMailboxByOwnerId(ownerId);
    if (!mailbox?.email_local) return;
    const result = await setMailboxPassword(mailbox.email_local, password);
    if (!result.ok) {
      console.error("mailbox password sync failed", result.error);
      return;
    }
    await updateMailboxPasswordSecret(mailbox.id, encryptSecret(password));
  } catch (error) {
    console.error("mailbox password sync failed", error);
  }
}
