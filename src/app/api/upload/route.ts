import { NextResponse } from "next/server";
import { MAX_IMAGE_BYTES, saveImage, sniffImage } from "@/lib/images";
import { siteUrl } from "@/lib/site";
import { getAuthUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

const hits = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request): string {
  const fwd = request.headers.get("x-vercel-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || row.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  row.count += 1;
  return row.count > limit;
}

function sameSiteRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser clients / same-origin navigations
  try {
    return new URL(origin).origin === new URL(siteUrl()).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameSiteRequest(request)) {
    return NextResponse.json({ error: "forbidden." }, { status: 403 });
  }

  const userId = await getAuthUserId();
  const key = userId ? `user:${userId}` : `ip:${clientKey(request)}`;
  const limit = userId ? 60 : 12;
  if (rateLimited(key, limit, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "too many uploads. wait a bit." },
      { status: 429 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing file." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Each photo must be under 2MB." },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const sniff = sniffImage(buf);
  if (!sniff) {
    return NextResponse.json(
      { error: "jpeg, png, or webp only." },
      { status: 400 },
    );
  }

  try {
    const url = await saveImage(buf, sniff);
    return NextResponse.json({ url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "could not store photo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
