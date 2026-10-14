import { NextResponse } from "next/server";
import { isAllowedImageUrl } from "@/lib/images";
import { parseLook, sanitizeLine } from "@/lib/looks";
import { isEmailLocalTaken, updateOwnedPage } from "@/lib/pages";
import {
  normalizeEmailLocal,
  normalizeWord,
  validateEmailLocal,
  validateSlug,
} from "@/lib/slug";
import { getAuthUserId } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "come back first." }, { status: 401 });
  }

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "gone." }, { status: 404 });
  }

  let body: {
    word?: string;
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
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const slug = normalizeWord(body.word ?? "");
  const check = validateSlug(slug);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

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
    return NextResponse.json({ error: "Invalid photo URL." }, { status: 400 });
  }

  let email_local: string | null = null;
  if (typeof body.email_local === "string" && body.email_local.trim()) {
    email_local = normalizeEmailLocal(body.email_local);
    const emailCheck = validateEmailLocal(email_local);
    if (!emailCheck.ok) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }
    if (await isEmailLocalTaken(email_local, id)) {
      return NextResponse.json(
        { error: "that alias is already spoken for." },
        { status: 409 },
      );
    }
  }

  try {
    const result = await updateOwnedPage(id, userId, {
      slug,
      word: slug,
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
    const message =
      err instanceof Error ? err.message : "Could not tend it.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
