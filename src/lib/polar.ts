import { Checkout } from "@polar-sh/nextjs";
import { Polar } from "@polar-sh/sdk";
import { NextRequest } from "next/server";
import { siteUrl } from "./site";

export function polarServer(): "sandbox" | "production" {
  return process.env.POLAR_SERVER === "production" ? "production" : "sandbox";
}

export function polarSuccessUrl(): string {
  const fromEnv = process.env.POLAR_SUCCESS_URL?.trim();
  if (fromEnv) return fromEnv;
  return `${siteUrl()}/thanks?checkout_id={CHECKOUT_ID}`;
}

export function getPolar(): Polar | null {
  if (!process.env.POLAR_ACCESS_TOKEN) return null;
  return new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    server: polarServer(),
  });
}

function polarCheckout(returnUrl?: string, successUrlOverride?: string) {
  const successUrl = successUrlOverride || polarSuccessUrl();
  return Checkout({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    successUrl,
    returnUrl: returnUrl ?? siteUrl(),
    server: polarServer(),
    includeCheckoutId: !successUrl.includes("{CHECKOUT_ID}"),
  });
}

export async function createCustomerPortalUrl(
  customerId: string,
): Promise<string | null> {
  const polar = getPolar();
  if (!polar) return null;
  const session = await polar.customerSessions.create({ customerId });
  const url =
    "customerPortalUrl" in session
      ? (session as { customerPortalUrl?: string }).customerPortalUrl
      : undefined;
  return typeof url === "string" && url ? url : null;
}

/** Runs Polar's official Checkout adapter with products + metadata we control. */
export async function startPolarCheckout(
  request: NextRequest,
  input: {
    productId: string;
    metadata: Record<string, string>;
    customerEmail?: string;
    returnUrl?: string;
    successUrl?: string;
  },
) {
  const url = new URL(request.url);
  url.search = "";
  url.searchParams.set("products", input.productId);
  url.searchParams.set("metadata", JSON.stringify(input.metadata));
  if (input.customerEmail) {
    url.searchParams.set("customerEmail", input.customerEmail);
  }
  return polarCheckout(input.returnUrl, input.successUrl)(
    new NextRequest(url, { headers: request.headers }),
  );
}
