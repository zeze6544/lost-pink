import { NextRequest, NextResponse } from "next/server";
import { CLAIM_COOKIE, parseClaimCookie } from "@/lib/claim";
import { claimPage } from "@/lib/pages";
import { getAuthUserId } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "sign in first." }, { status: 401 });
  }

  let body: { pageId?: unknown; token?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const fromCookie = parseClaimCookie(request.cookies.get(CLAIM_COOKIE)?.value);
  const pageId =
    typeof body.pageId === "string" ? body.pageId : fromCookie?.pageId;
  const token =
    typeof body.token === "string" ? body.token : fromCookie?.token;

  if (!pageId || !token) {
    return NextResponse.json({ error: "nothing to claim." }, { status: 400 });
  }

  const parsed = parseClaimCookie(`${pageId}.${token}`);
  if (!parsed) {
    return NextResponse.json({ error: "nothing to claim." }, { status: 400 });
  }

  const page = await claimPage(parsed.pageId, userId, parsed.token);
  if (!page) {
    return NextResponse.json({ error: "couldn’t claim that." }, { status: 403 });
  }

  const res = NextResponse.json({ slug: page.slug });
  res.cookies.set(CLAIM_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
