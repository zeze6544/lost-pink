import { aliasIsReserved, isCheckoutAbandoned } from "./mailbox-lifecycle";
import { getMailboxByEmailLocal } from "./mailbox-store";
import { getPageBySlug } from "./pages";
import { normalizeWord, validateEmailLocal } from "./slug";

export type AliasCheck =
  | { status: "invalid"; error: string }
  | { status: "taken" }
  | { status: "held" }
  | { status: "free"; local: string };

export async function checkAlias(raw: string): Promise<AliasCheck> {
  const local = normalizeWord(raw);
  const valid = validateEmailLocal(local);
  if (!valid.ok) return { status: "invalid", error: valid.error };

  const mailbox = await getMailboxByEmailLocal(local);
  const now = new Date();
  if (mailbox) {
    if (
      isCheckoutAbandoned(
        mailbox.status,
        mailbox.checkout_expires_at,
        now,
      )
    ) {
      return { status: "free", local };
    }
    if (mailbox.status === "checkout_started") {
      return { status: "held" };
    }
    if (aliasIsReserved(mailbox.status, mailbox.checkout_expires_at, now)) {
      return { status: "taken" };
    }
  }

  const page = await getPageBySlug(local);
  if (page?.owner_id) return { status: "taken" };
  if (page && page.status === "kept" && page.owner_id) return { status: "taken" };
  if (page && page.status === "free") return { status: "taken" };

  return { status: "free", local };
}
