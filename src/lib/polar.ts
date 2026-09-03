import { Polar } from "@polar-sh/sdk";
import { isPolarConfigured, siteUrl } from "./site";

export function getPolar(): Polar | null {
  if (!isPolarConfigured()) return null;
  return new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
  });
}

export async function createKeepCheckout(pageId: string, slug: string) {
  const polar = getPolar();
  if (!polar) return null;

  const checkout = await polar.checkouts.create({
    products: [process.env.POLAR_PRODUCT_KEEP!],
    successUrl: `${siteUrl()}/thanks?checkout_id={CHECKOUT_ID}&slug=${encodeURIComponent(slug)}`,
    metadata: {
      page_id: pageId,
      slug,
    },
  });

  return checkout;
}
