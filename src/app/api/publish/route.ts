import { NextRequest, NextResponse } from "next/server";
import {
  CLAIM_COOKIE,
  claimCookieOptions,
  claimCookieValue,
  newClaimToken,
  hashClaimToken,
} from "@/lib/claim";
import { deleteImages, isAllowedImageUrl } from "@/lib/images";
import { parseLook, sanitizeLine, defaultLookForSlug } from "@/lib/looks";
import { pageStoreProblem } from "@/lib/page-store-error";
import { isEmailLocalTaken, publishPage } from "@/lib/pages";
import {
  normalizeEmailLocal,
  normalizeWord,
  validateEmailLocal,
  validateSlug,
} from "@/lib/slug";
import { getAuthUserId } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: "invalid JSON." }, { status: 400 });
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
    return NextResponse.json({ error: "invalid photo URL." }, { status: 400 });
  }

  let email_local: string | null = null;
  if (typeof body.email_local === "string" && body.email_local.trim()) {
    email_local = normalizeEmailLocal(body.email_local);
    const emailCheck = validateEmailLocal(email_local);
    if (!emailCheck.ok) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }
    if (await isEmailLocalTaken(email_local)) {
      return NextResponse.json(
        { error: "that alias is already spoken for." },
        { status: 409 },
      );
    }
  }

  const ownerId = await getAuthUserId();
  const claimToken = ownerId ? null : newClaimToken();

  let result: Awaited<ReturnType<typeof publishPage>>;
  try {
    result = await publishPage({
      slug,
      word: slug,
      line: sanitizeLine(body.line),
      look,
      bg_url,
      token_url,
      owner_id: ownerId,
      email_local,
      claim_token_hash: claimToken ? hashClaimToken(claimToken) : null,
    });
  } catch (err) {
    await deleteImages([bg_url, token_url]);
    const problem = pageStoreProblem(err);
    if (problem) {
      return NextResponse.json(
        { error: problem.error },
        { status: problem.status },
      );
    }
    const message =
      err instanceof Error ? err.message : "could not leave it here.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  if ("conflict" in result) {
    await deleteImages([bg_url, token_url]);
    return NextResponse.json(
      {
        error: result.kept
          ? "that word is already kept."
          : "someone just claimed that. try again in a moment or pick another.",
      },
      { status: 409 },
    );
  }

  const res = NextResponse.json({
    id: result.page.id,
    slug: result.page.slug,
    expiresAt: result.page.expires_at,
    owned: Boolean(ownerId),
  });
  if (claimToken) {
    res.cookies.set(
      CLAIM_COOKIE,
      claimCookieValue(result.page.id, claimToken),
      claimCookieOptions(),
    );
  }
  return res;
}
