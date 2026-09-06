import { NextResponse } from "next/server";
import { deleteOwnedName } from "@/lib/mailbox";
import { getPageById, pageHandle } from "@/lib/pages";
import { getAuthUserId } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "sign in first." }, { status: 401 });
  }

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "gone." }, { status: 404 });
  }

  let body: { confirm?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON." }, { status: 400 });
  }

  const page = await getPageById(id);
  if (!page || page.owner_id !== userId) {
    return NextResponse.json({ error: "gone." }, { status: 404 });
  }

  const handle = pageHandle(page);
  const confirm =
    typeof body.confirm === "string" ? body.confirm.trim().toLowerCase() : "";
  if (confirm !== handle.toLowerCase()) {
    return NextResponse.json(
      { error: `type ${handle} to confirm.` },
      { status: 400 },
    );
  }

  const result = await deleteOwnedName(id, userId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true });
}
