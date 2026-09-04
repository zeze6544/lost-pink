import { getPageById, type LostPage } from "./pages";
import { getAuthUser } from "./supabase/server";

export async function requireOwnedPage(pageId: string): Promise<
  | { user: { id: string; email: string | null }; page: LostPage }
  | { error: string; status: number }
> {
  const user = await getAuthUser();
  const page = await getPageById(pageId);
  if (!user || !page || !page.owner_id || user.id !== page.owner_id) {
    return { error: "come back first.", status: 401 };
  }
  return { user, page };
}
