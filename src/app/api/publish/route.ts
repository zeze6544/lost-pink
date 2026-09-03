import { NextResponse } from "next/server";
import { deleteImages, isAllowedImageUrl } from "@/lib/images";
import { parseLook, sanitizeLine, defaultLookForSlug } from "@/lib/looks";
import { publishPage } from "@/lib/pages";
import { normalizeWord, validateSlug } from "@/lib/slug";

export async function POST(request: Request) {
  let body: {
    word?: string;
    line?: unknown;
    palette?: unknown;
    treatment?: unknown;
    motif?: unknown;
    font?: unknown;
    bg_url?: unknown;
    token_url?: unknown;
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

  const hashed = defaultLookForSlug(slug);
  const look = parseLook({
    palette: body.palette ?? hashed.palette,
    treatment: body.treatment ?? hashed.treatment,
    motif: body.motif ?? hashed.motif,
    font: body.font ?? hashed.font,
  });
  if ("error" in look) {
    return NextResponse.json({ error: look.error }, { status: 400 });
  }

  const bg_url = typeof body.bg_url === "string" ? body.bg_url : null;
  const token_url = typeof body.token_url === "string" ? body.token_url : null;
  if (!isAllowedImageUrl(bg_url) || !isAllowedImageUrl(token_url)) {
    return NextResponse.json({ error: "Invalid photo URL." }, { status: 400 });
  }

  let result: Awaited<ReturnType<typeof publishPage>>;
  try {
    result = await publishPage({
      slug,
      word: slug,
      line: sanitizeLine(body.line),
      look,
      bg_url,
      token_url,
    });
  } catch (err) {
    await deleteImages([bg_url, token_url]);
    throw err;
  }
  if ("conflict" in result) {
    await deleteImages([bg_url, token_url]);
    return NextResponse.json(
      {
        error: result.kept
          ? "that word is already kept."
          : "Someone just claimed that. Try again in a moment or pick another.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json({
    id: result.page.id,
    slug: result.page.slug,
    expiresAt: result.page.expires_at,
  });
}
