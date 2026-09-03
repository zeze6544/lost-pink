import { createHash, randomBytes } from "crypto";

export const CLAIM_COOKIE = "lp_claim";
export const CLAIM_MAX_AGE = 60 * 60 * 24 * 30;

export function newClaimToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashClaimToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function parseClaimCookie(
  value: string | undefined,
): { pageId: string; token: string } | null {
  if (!value) return null;
  const dot = value.indexOf(".");
  if (dot < 1) return null;
  const pageId = value.slice(0, dot);
  const token = value.slice(dot + 1);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      pageId,
    )
  ) {
    return null;
  }
  if (!/^[0-9a-f]{64}$/i.test(token)) return null;
  return { pageId, token };
}

export function claimCookieValue(pageId: string, token: string): string {
  return `${pageId}.${token}`;
}
