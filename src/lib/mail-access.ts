import { getMailboxByPageId } from "./mailbox-store";
import { getPageById } from "./pages";
import { getAuthUser } from "./supabase/server";
import type { MailboxRow } from "./mailbox-store";
import type { LostPage } from "./pages";

export async function requireLiveMailbox(pageId: string): Promise<
  | { user: { id: string }; page: LostPage; mailbox: MailboxRow }
  | { error: string; status: number }
> {
  const user = await getAuthUser();
  const page = await getPageById(pageId);
  if (!user || !page || page.owner_id !== user.id) {
    return { error: "sign in first.", status: 401 };
  }
  const mailbox = await getMailboxByPageId(page.id);
  if (!mailbox) {
    return { error: "no inbox here.", status: 404 };
  }
  if (mailbox.status === "dark") {
    return { error: "this inbox went dark.", status: 409 };
  }
  if (mailbox.status !== "live") {
    return { error: "the inbox is still arriving.", status: 409 };
  }
  return { user, page, mailbox };
}
