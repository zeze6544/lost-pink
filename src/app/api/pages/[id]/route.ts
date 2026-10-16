import { NextResponse } from "next/server";
import { isAllowedImageUrl } from "@/lib/images";
import { parseLook, sanitizeLine, sanitizeTitle } from "@/lib/looks";
import { pageStoreProblem } from "@/lib/page-store-error";
import {
  getPageById,
  isNameHeldByOtherPage,
  updateOwnedPage,
} from "@/lib/pages";
import {
  normalizeEmailLocal,
  validateEmailLocal,
} from "@/lib/slug";
import { getAuthUserId } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "sign in first." }, { status: 401 });
  }

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "gone." }, { status: 404 });
  }

  let body: {
    word?: string;
    title?: string;
    line?: unknown;
    palette?: unknown;
    treatment?: unknown;
    motif?: unknown;
    font?: unknown;
    bg_url?: unknown;
    token_url?: unknown;
    email_local?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON." }, { status: 400 });
  }

  const current = await getPageById(id);
  if (!current) {
    return NextResponse.json({ error: "gone." }, { status: 404 });
  }
  const title = sanitizeTitle(body.title ?? body.word, current.word || current.slug);
  if (!title) {
    return NextResponse.json({ error: "needs a title." }, { status: 400 });
  }
  const slug = current.slug;

  const look = parseLook({
    palette: body.palette,
    treatment: body.treatment,
    motif: body.motif,
    font: body.font,
  });
  if ("error" in look) {
    return NextResponse.json({ error: look.error }, { status: 400 });
  }

  const bg_url = typeof body.bg_url === "string" ? body.bg_url : null;
  const token_url = typeof body.token_url === "string" ? body.token_url : null;
  if (!isAllowedImageUrl(bg_url) || !isAllowedImageUrl(token_url)) {
    return NextResponse.json({ error: "invalid photo URL." }, { status: 400 });
  }

  let email_local: string | null = null;
  if (typeof body.email_local === "string" && body.email_local.trim()) {
    email_local = normalizeEmailLocal(body.email_local);
    const emailCheck = validateEmailLocal(email_local);
    if (!emailCheck.ok) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }
    if (await isNameHeldByOtherPage(email_local, id)) {
      return NextResponse.json(
        { error: "that inbox name is taken." },
        { status: 409 },
      );
    }
  }

  try {
    const result = await updateOwnedPage(id, userId, {
      slug,
      word: title,
      line: sanitizeLine(body.line),
      look,
      bg_url,
      token_url,
      email_local,
    });
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }
    return NextResponse.json({
      id: result.page.id,
      slug: result.page.slug,
    });
  } catch (err) {
    const problem = pageStoreProblem(err);
    if (problem) {
      return NextResponse.json(
        { error: problem.error },
        { status: problem.status },
      );
    }
    const message =
      err instanceof Error ? err.message : "couldn't save.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
