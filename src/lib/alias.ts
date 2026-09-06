import { aliasIsReserved, isCheckoutAbandoned } from "./mailbox-lifecycle";
import { getMailboxByEmailLocal } from "./mailbox-store";
import { getPageByEmailLocal, getPageByHandle, getPageById } from "./pages";
import { isReservedName, normalizeWord, validateEmailLocal } from "./slug";

export type AliasCheck =
  | { status: "invalid"; error: string }
  | { status: "reserved"; local: string }
  | { status: "taken"; slug: string }
  | { status: "held" }
  | { status: "free"; local: string };

export async function checkAlias(
  raw: string,
  exceptPageId?: string,
): Promise<AliasCheck> {
  const local = normalizeWord(raw);
  if (isReservedName(local)) {
    return { status: "reserved", local };
  }
  const valid = validateEmailLocal(local);
  if (!valid.ok) return { status: "invalid", error: valid.error };

  const mailbox = await getMailboxByEmailLocal(local);
  const now = new Date();
  if (mailbox && mailbox.page_id !== exceptPageId) {
    if (
      isCheckoutAbandoned(
        mailbox.status,
        mailbox.checkout_expires_at,
        now,
      )
    ) {
      // abandoned hold does not keep the name
    } else if (mailbox.status === "checkout_started") {
      return { status: "held" };
    } else if (aliasIsReserved(mailbox.status, mailbox.checkout_expires_at, now)) {
      const owned = await getPageById(mailbox.page_id);
      return { status: "taken", slug: owned?.slug ?? local };
    }
  }

  const page = await getPageByHandle(local);
  if (page && page.id !== exceptPageId) {
    if (page.owner_id || page.status === "kept" || page.status === "free") {
      return { status: "taken", slug: page.slug };
    }
  }

  const byEmail = await getPageByEmailLocal(local, exceptPageId);
  if (byEmail) {
    return { status: "taken", slug: byEmail.slug };
  }

  return { status: "free", local };
}
