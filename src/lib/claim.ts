import { createHash, randomBytes } from "crypto";

export const CLAIM_COOKIE = "lp_claim";
export const CLAIM_MAX_AGE = 60 * 60 * 24 * 30;

type ClaimCookieWrite = {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
};

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

function claimSecure(): boolean {
  return (
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1"
  );
}

/** Options used when writing the claim cookie (must match clears). */
export function claimCookieOptions(
  maxAge: number = CLAIM_MAX_AGE,
): ClaimCookieWrite {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: claimSecure(),
    path: "/",
    maxAge,
  };
}

/** Clear Secure and legacy non-Secure claim cookies. */
export function clearClaimCookies(set: {
  set: (name: string, value: string, options: ClaimCookieWrite) => void;
}): void {
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
  set.set(CLAIM_COOKIE, "", { ...base, secure: true });
  set.set(CLAIM_COOKIE, "", { ...base, secure: false });
}
