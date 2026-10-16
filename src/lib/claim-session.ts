import type { CheckoutKind } from "./mailbox-status";

export const LAST_CLAIM_KEY = "lost.pink:last-claim";

export type LastClaim = {
  alias: string;
  kind: Exclude<CheckoutKind, "keep">;
  polarUrl?: string;
};

export function readLastClaim(): LastClaim | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LAST_CLAIM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastClaim;
    if (typeof parsed.alias !== "string" || !parsed.alias) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLastClaim(claim: LastClaim) {
  try {
    sessionStorage.setItem(LAST_CLAIM_KEY, JSON.stringify(claim));
  } catch {
    // private mode / quota
  }
}
