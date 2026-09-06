export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function isPolarConfigured(): boolean {
  return Boolean(
    process.env.POLAR_ACCESS_TOKEN && process.env.POLAR_PRODUCT_KEEP,
  );
}

import {
  isMailboxPolarConfigured,
  mailboxProductId,
} from "./mailbox-pricing";

export { isMailboxPolarConfigured, mailboxProductId };

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.MIGADU_SMTP_USER && process.env.MIGADU_SMTP_PASSWORD,
  );
}

export function isMigaduConfigured(): boolean {
  return Boolean(
    process.env.MIGADU_USER &&
      process.env.MIGADU_API_KEY &&
      process.env.MIGADU_DOMAIN,
  );
}

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function supabaseUrl(): string | undefined {
  return (
    process.env.SUPABASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function supabasePublicUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl();
}

export function supabasePublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isAuthConfigured(): boolean {
  return Boolean(supabasePublicUrl() && supabasePublishableKey());
}

/** In-app path only. Blocks open redirects. */
export function safeNextPath(raw: unknown, fallback = "/you"): string {
  if (typeof raw !== "string") return fallback;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return fallback;
  }
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return fallback;
  }
  // Block /\evil.com and encoded backslash host tricks.
  if (
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    decoded.includes("://")
  ) {
    return fallback;
  }
  try {
    const origin = new URL(siteUrl()).origin;
    const resolved = new URL(path, origin);
    if (resolved.origin !== origin) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}

export function polarJoinSuccessUrl(): string {
  return `${siteUrl()}/join?checkout_id={CHECKOUT_ID}`;
}
