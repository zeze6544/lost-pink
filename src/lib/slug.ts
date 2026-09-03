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
