const RESERVED = new Set([
  "api",
  "thanks",
  "privacy",
  "terms",
  "edit",
  "admin",
  "login",
  "logout",
  "dashboard",
  "keep",
  "checkout",
  "webhook",
  "webhooks",
  "cron",
  "favicon",
  "robots",
  "sitemap",
  "www",
  "static",
  "assets",
  "images",
  "upload",
  "found",
  "null",
  "undefined",
  "come",
  "you",
  "join",
  "mail",
  "setup",
  "auth",
  "callback",
  "enter",
  "support",
  "receipts",
  "subscription",
  "settings",
]);

const BLOCKLIST = new Set([
  "nigger",
  "nigga",
  "faggot",
  "hitler",
  "nazi",
]);

export function normalizeWord(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
}

export function validateSlug(
  slug: string,
): { ok: true } | { ok: false; error: string } {
  if (slug.length < 2) {
    return { ok: false, error: "Needs at least 2 characters." };
  }
  if (slug.length > 16) {
    return { ok: false, error: "Keep it under 16 characters." };
  }
  if (!/^[a-z0-9]+$/.test(slug)) {
    return { ok: false, error: "Letters and numbers only." };
  }
  if (RESERVED.has(slug) || BLOCKLIST.has(slug)) {
    return { ok: false, error: "That one’s taken by the void. Try another." };
  }
  return { ok: true };
}

const EMAIL_RESERVED = new Set([
  "postmaster",
  "abuse",
  "webmaster",
  "hostmaster",
  "noreply",
  "mail",
  "email",
  "support",
  "hello",
  "info",
  "contact",
  "root",
  "privacy",
]);

/** Optional public alias, shown as {local}@lost.pink. Display only. */
export function normalizeEmailLocal(input: string): string {
  const cut = input.trim().toLowerCase().split("@")[0] ?? "";
  return normalizeWord(cut);
}

export function validateEmailLocal(
  local: string,
): { ok: true } | { ok: false; error: string } {
  const check = validateSlug(local);
  if (!check.ok) return check;
  if (EMAIL_RESERVED.has(local)) {
    return { ok: false, error: "That one’s taken by the void. Try another." };
  }
  return { ok: true };
}

export function displayLostEmail(local: string): string {
  return `${local}@lost.pink`;
}

export function validRecoveryEmail(email: string): boolean {
  const value = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return false;
  return !value.endsWith("@lost.pink");
}
