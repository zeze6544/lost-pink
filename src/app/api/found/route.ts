import { NextResponse } from "next/server";
import { incrementFound } from "@/lib/pages";
import { normalizeWord, validateSlug } from "@/lib/slug";

export async function POST(request: Request) {
  let body: { slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const slug = normalizeWord(body.slug ?? "");
  const check = validateSlug(slug);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const found = await incrementFound(slug);
  if (found === null) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  return NextResponse.json({ found });
}
