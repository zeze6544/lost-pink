import { NextResponse } from "next/server";
import { getPageById, markKept } from "@/lib/pages";
import { createKeepCheckout } from "@/lib/polar";
import { isPolarConfigured, siteUrl } from "@/lib/site";

export async function POST(request: Request) {
  let body: { pageId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const pageId = body.pageId?.trim();
  if (!pageId) {
    return NextResponse.json({ error: "Missing page." }, { status: 400 });
  }

  const page = await getPageById(pageId);
  if (!page) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }
  if (page.status === "kept") {
    return NextResponse.json({
      url: `${siteUrl()}/thanks?slug=${page.slug}&kept=1`,
    });
  }

  if (!isPolarConfigured()) {
    await markKept(page.id, "dev-local");
    return NextResponse.json({
      url: `${siteUrl()}/thanks?slug=${page.slug}&kept=1`,
      dev: true,
    });
  }

  const checkout = await createKeepCheckout(page.id, page.slug);
  if (!checkout?.url) {
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: checkout.url });
}
