import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import { deleteImages } from "./images";
import {
  lookFromStored,
  defaultLookForSlug,
  type FontId,
  type Look,
  type Motif,
  type Palette,
  type Treatment,
} from "./looks";
import {
  blobExpireFreePages,
  blobGetPageById,
  blobIncrementFound,
  blobListAll,
  blobListByOwner,
  blobMarkKept,
  blobPeekSlug,
  blobPublishPage,
  blobUpdatePage,
} from "./pages-blob";
import { hashClaimToken } from "./claim";
import { isMailboxEmailTaken, isMailboxAliasLocked } from "./mailbox-store";
import {
  isMailboxOpen,
  parsePublicMailboxLabel,
  type PublicMailboxLabel,
} from "./mailbox-status";
import { isBlobConfigured, isSupabaseConfigured, supabaseUrl } from "./site";

export type { PublicMailboxLabel };
export type PageStatus = "free" | "kept";

export const MAILBOX_MS = 365 * 24 * 60 * 60 * 1000;

export type LostPage = {
  id: string;
  slug: string;
  word: string;
  line: string | null;
  palette: Palette;
  treatment: Treatment;
  motif: Motif;
  font: FontId;
  bg_url: string | null;
  token_url: string | null;
  found_count: number;
  status: PageStatus;
  expires_at: string | null;
  polar_order_id: string | null;
  created_at: string;
  owner_id: string | null;
  email_local: string | null;
  claim_token_hash?: string | null;
  mailbox_status: PublicMailboxLabel;
  mailbox_expires_at: string | null;
};

export type PublishFields = {
  slug: string;
  word: string;
  line: string | null;
  look: Look;
  bg_url: string | null;
  token_url: string | null;
  owner_id?: string | null;
  email_local?: string | null;
  claim_token_hash?: string | null;
};

export type UpdateOwnedFields = {
  slug: string;
  word: string;
  line: string | null;
  look: Look;
  bg_url: string | null;
  token_url: string | null;
  email_local: string | null;
};

const FREE_HOURS = 48;
const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "pages.json");

function newId(): string {
  return crypto.randomUUID();
}

function isActive(page: LostPage, now = Date.now()): boolean {
  if (page.status === "kept") return true;
  if (!page.expires_at) return false;
  return new Date(page.expires_at).getTime() > now;
}

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

async function readLocal(): Promise<LostPage[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const rows = JSON.parse(raw) as Record<string, unknown>[];
  return rows.map((row) => mapRow(row));
}

async function writeLocal(pages: LostPage[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(pages, null, 2), "utf8");
}

function pageStore(): "supabase" | "blob" | "local" {
  if (isSupabaseConfigured()) return "supabase";
  if (isBlobConfigured()) return "blob";
  return "local";
}

function supabaseAdmin(): SupabaseClient {
  return createClient(
    supabaseUrl()!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function mapRow(row: Record<string, unknown>): LostPage {
  const slug = String(row.slug);
  const look = lookFromStored(slug, row);
  return {
    id: String(row.id),
    slug,
    word: String(row.word ?? slug),
    line: typeof row.line === "string" && row.line ? row.line : null,
    palette: look.palette,
    treatment: look.treatment,
    motif: look.motif,
    font: look.font,
    bg_url: typeof row.bg_url === "string" && row.bg_url ? row.bg_url : null,
    token_url:
      typeof row.token_url === "string" && row.token_url
        ? row.token_url
        : null,
    found_count: Number(row.found_count ?? 0) || 0,
    status: row.status as PageStatus,
    expires_at: (row.expires_at as string | null) ?? null,
    polar_order_id: (row.polar_order_id as string | null) ?? null,
    created_at: String(row.created_at),
    owner_id: typeof row.owner_id === "string" && row.owner_id ? row.owner_id : null,
    email_local:
      typeof row.email_local === "string" && row.email_local
        ? row.email_local
        : null,
    claim_token_hash:
      typeof row.claim_token_hash === "string" && row.claim_token_hash
        ? row.claim_token_hash
        : null,
    mailbox_status: parsePublicMailboxLabel(
      row.email_local ? row.mailbox_status || "display" : "none",
    ),
    mailbox_expires_at:
      typeof row.mailbox_expires_at === "string" && row.mailbox_expires_at
        ? row.mailbox_expires_at
        : null,
  };
}

function coercePage(page: LostPage | null): LostPage | null {
  if (!page) return null;
  return mapRow(page as unknown as Record<string, unknown>);
}

export function mailboxIsCurrent(page: LostPage, now = Date.now()): boolean {
  return isMailboxOpen(page.mailbox_status, page.mailbox_expires_at, now);
}

export function pageLook(page: LostPage): Look {
  return {
    palette: page.palette,
    treatment: page.treatment,
    motif: page.motif,
    font: page.font,
  };
}

export async function getPageBySlug(slug: string): Promise<LostPage | null> {
  if (pageStore() === "supabase") {
    const { data, error } = await supabaseAdmin()
      .from("pages")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const page = mapRow(data);
    return isActive(page) ? page : null;
  }

  if (pageStore() === "blob") {
    const page = await blobPeekSlug(slug);
    if (!page || !isActive(page)) return null;
    return coercePage(page);
  }

  const pages = await readLocal();
  const page = pages.find((p) => p.slug === slug) ?? null;
  if (!page || !isActive(page)) return null;
  return page;
}

export async function getPageById(id: string): Promise<LostPage | null> {
  if (pageStore() === "supabase") {
    const { data, error } = await supabaseAdmin()
      .from("pages")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapRow(data) : null;
  }

  if (pageStore() === "blob") {
    return coercePage(await blobGetPageById(id));
  }

  const pages = await readLocal();
  return pages.find((p) => p.id === id) ?? null;
}

function toInsert(page: LostPage) {
  return {
    id: page.id,
    slug: page.slug,
    word: page.word,
    line: page.line,
    palette: page.palette,
    treatment: page.treatment,
    motif: page.motif,
    font: page.font,
    bg_url: page.bg_url,
    token_url: page.token_url,
    found_count: page.found_count,
    status: page.status,
    expires_at: page.expires_at,
    polar_order_id: page.polar_order_id,
    created_at: page.created_at,
    owner_id: page.owner_id,
    email_local: page.email_local,
    mailbox_status: page.mailbox_status,
    mailbox_expires_at: page.mailbox_expires_at,
  };
}

export async function publishPage(
  fields: PublishFields,
): Promise<{ page: LostPage } | { conflict: true; kept: boolean }> {
  const existing = await peekSlug(fields.slug);
  if (existing && isActive(existing)) {
    return { conflict: true, kept: existing.status === "kept" };
  }

  const now = new Date();
  const page: LostPage = {
    id: newId(),
    slug: fields.slug,
    word: fields.word,
    line: fields.line,
    palette: fields.look.palette,
    treatment: fields.look.treatment,
    motif: fields.look.motif,
    font: fields.look.font,
    bg_url: fields.bg_url,
    token_url: fields.token_url,
    found_count: 0,
    status: "free",
    expires_at: new Date(
      now.getTime() + FREE_HOURS * 60 * 60 * 1000,
    ).toISOString(),
    polar_order_id: null,
    created_at: now.toISOString(),
    owner_id: fields.owner_id ?? null,
    email_local: fields.email_local ?? null,
    claim_token_hash: fields.claim_token_hash ?? null,
    mailbox_status: fields.email_local ? "display" : "none",
    mailbox_expires_at: null,
  };

  if (existing) {
    await deleteImages([existing.bg_url, existing.token_url]);
  }

  if (pageStore() === "supabase") {
    if (existing) {
      await supabaseAdmin().from("pages").delete().eq("slug", fields.slug);
    }
    const { data, error } = await supabaseAdmin()
      .from("pages")
      .insert(toInsert(page))
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") {
        return { conflict: true, kept: true };
      }
      throw error;
    }
    await writeClaim(page.id, page.claim_token_hash);
    return { page: mapRow(data) };
  }

  if (pageStore() === "blob") {
    return blobPublishPage(page, existing);
  }

  const pages = await readLocal();
  const next = pages.filter((p) => p.slug !== fields.slug);
  next.push(page);
  await writeLocal(next);
  return { page };
}

async function peekSlug(slug: string): Promise<LostPage | null> {
  if (pageStore() === "supabase") {
    const { data, error } = await supabaseAdmin()
      .from("pages")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data ? mapRow(data) : null;
  }
  if (pageStore() === "blob") {
    return coercePage(await blobPeekSlug(slug));
  }
  const pages = await readLocal();
  return pages.find((p) => p.slug === slug) ?? null;
}

export async function markKept(
  pageId: string,
  polarOrderId: string | null,
): Promise<LostPage | null> {
  if (pageStore() === "supabase") {
    const { data, error } = await supabaseAdmin()
      .from("pages")
      .update({
        status: "kept",
        expires_at: null,
        polar_order_id: polarOrderId,
      })
      .eq("id", pageId)
      .select("*")
      .single();
    if (error) throw error;
    return data ? mapRow(data) : null;
  }

  if (pageStore() === "blob") {
    return blobMarkKept(pageId, polarOrderId);
  }

  const pages = await readLocal();
  const idx = pages.findIndex((p) => p.id === pageId);
  if (idx < 0) return null;
  pages[idx] = {
    ...pages[idx],
    status: "kept",
    expires_at: null,
    polar_order_id: polarOrderId,
  };
  await writeLocal(pages);
  return pages[idx];
}

export async function incrementFound(slug: string): Promise<number | null> {
  if (pageStore() === "supabase") {
    const page = await getPageBySlug(slug);
    if (!page) return null;
    const next = page.found_count + 1;
    const { data, error } = await supabaseAdmin()
      .from("pages")
      .update({ found_count: next })
      .eq("id", page.id)
      .select("found_count")
      .single();
    if (error) throw error;
    return Number(data?.found_count ?? next);
  }

  if (pageStore() === "blob") {
    return blobIncrementFound(slug, isActive);
  }

  const pages = await readLocal();
  const idx = pages.findIndex((p) => p.slug === slug);
  if (idx < 0) return null;
  const page = pages[idx];
  if (!isActive(page)) return null;
  pages[idx] = { ...page, found_count: page.found_count + 1 };
  await writeLocal(pages);
  return pages[idx].found_count;
}

export async function expireFreePages(): Promise<number> {
  const now = new Date().toISOString();

  if (pageStore() === "supabase") {
    const { data: doomed, error: selectError } = await supabaseAdmin()
      .from("pages")
      .select("id, bg_url, token_url")
      .eq("status", "free")
      .lt("expires_at", now);
    if (selectError) throw selectError;
    await deleteImages(
      (doomed ?? []).flatMap((row) => [
        row.bg_url as string | null,
        row.token_url as string | null,
      ]),
    );
    const { data, error } = await supabaseAdmin()
      .from("pages")
      .delete()
      .eq("status", "free")
      .lt("expires_at", now)
      .select("id");
    if (error) throw error;
    return data?.length ?? 0;
  }

  if (pageStore() === "blob") {
    return blobExpireFreePages(now);
  }

  const pages = await readLocal();
  const expired = pages.filter(
    (p) =>
      p.status === "free" && (!p.expires_at || p.expires_at < now),
  );
  await deleteImages(
    expired.flatMap((p) => [p.bg_url, p.token_url]),
  );
  const kept = pages.filter(
    (p) => p.status === "kept" || (p.expires_at && p.expires_at >= now),
  );
  const removed = pages.length - kept.length;
  await writeLocal(kept);
  return removed;
}

async function writeClaim(pageId: string, tokenHash: string | null | undefined) {
  if (!tokenHash) return;
  if (pageStore() === "supabase") {
    await supabaseAdmin().from("page_claims").upsert({
      page_id: pageId,
      token_hash: tokenHash,
    });
  }
}

export async function isEmailLocalTaken(
  local: string,
  exceptId?: string,
): Promise<boolean> {
  if (pageStore() === "supabase") {
    let q = supabaseAdmin()
      .from("pages")
      .select("id")
      .eq("email_local", local)
      .limit(1);
    if (exceptId) q = q.neq("id", exceptId);
    const { data, error } = await q;
    if (error) throw error;
    if (data?.length) return true;
    return isMailboxEmailTaken(local, exceptId);
  }
  if (pageStore() === "blob") {
    const pages = await blobListAll();
    return pages.some(
      (p) => p.email_local === local && p.id !== exceptId && isActive(p),
    );
  }
  const pages = await readLocal();
  return pages.some(
    (p) => p.email_local === local && p.id !== exceptId && isActive(p),
  );
}

export async function listOwnedPages(ownerId: string): Promise<LostPage[]> {
  if (pageStore() === "supabase") {
    const { data, error } = await supabaseAdmin()
      .from("pages")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => mapRow(row)).filter((p) => isActive(p));
  }
  if (pageStore() === "blob") {
    return (await blobListByOwner(ownerId))
      .map((p) => coercePage(p))
      .filter((p): p is LostPage => p !== null && isActive(p));
  }
  const pages = await readLocal();
  return pages
    .filter((p) => p.owner_id === ownerId && isActive(p))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function claimPage(
  pageId: string,
  userId: string,
  token: string,
): Promise<LostPage | null> {
  const page = await getPageById(pageId);
  if (!page || !isActive(page)) return null;
  if (page.owner_id && page.owner_id !== userId) return null;
  if (page.owner_id === userId) return page;

  const tokenHash = hashClaimToken(token);

  if (pageStore() === "supabase") {
    const { data: claim, error: claimError } = await supabaseAdmin()
      .from("page_claims")
      .select("token_hash")
      .eq("page_id", pageId)
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claim || claim.token_hash !== tokenHash) return null;
    const { data, error } = await supabaseAdmin()
      .from("pages")
      .update({ owner_id: userId, updated_at: new Date().toISOString() })
      .eq("id", pageId)
      .is("owner_id", null)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    await supabaseAdmin().from("page_claims").delete().eq("page_id", pageId);
    return mapRow(data);
  }

  const storedHash = page.claim_token_hash;
  if (!storedHash || storedHash !== tokenHash) return null;
  const next: LostPage = {
    ...page,
    owner_id: userId,
    claim_token_hash: null,
  };

  if (pageStore() === "blob") {
    await blobUpdatePage(next, page.slug);
    return next;
  }

  const pages = await readLocal();
  const idx = pages.findIndex((p) => p.id === pageId);
  if (idx < 0) return null;
  pages[idx] = next;
  await writeLocal(pages);
  return next;
}

export async function setPageOwner(
  pageId: string,
  ownerId: string,
): Promise<LostPage | null> {
  const page = await getPageById(pageId);
  if (!page) return null;
  if (page.owner_id && page.owner_id !== ownerId) return null;
  if (page.owner_id === ownerId) return page;

  if (pageStore() === "supabase") {
    const { data, error } = await supabaseAdmin()
      .from("pages")
      .update({ owner_id: ownerId, updated_at: new Date().toISOString() })
      .eq("id", pageId)
      .select("*")
      .single();
    if (error) throw error;
    return data ? mapRow(data) : null;
  }

  const next: LostPage = { ...page, owner_id: ownerId };
  if (pageStore() === "blob") {
    await blobUpdatePage(next, page.slug);
    return next;
  }
  const pages = await readLocal();
  const idx = pages.findIndex((p) => p.id === pageId);
  if (idx < 0) return null;
  pages[idx] = next;
  await writeLocal(pages);
  return next;
}

export async function deleteUnownedPage(pageId: string): Promise<void> {
  const page = await getPageById(pageId);
  if (!page || page.owner_id) return;
  await deleteImages([page.bg_url, page.token_url]);
  if (pageStore() === "supabase") {
    await supabaseAdmin().from("pages").delete().eq("id", pageId);
    return;
  }
  if (pageStore() === "blob") {
    await blobUpdatePage({ ...page, status: "free", expires_at: new Date(0).toISOString() }, page.slug);
    return;
  }
  const pages = await readLocal();
  await writeLocal(pages.filter((p) => p.id !== pageId));
}

export async function reserveKeptAlias(local: string): Promise<LostPage> {
  const existing = await peekSlug(local);
  if (existing && isActive(existing) && existing.owner_id) {
    return existing;
  }
  if (existing && isActive(existing) && !existing.owner_id) {
    const kept = await markKept(existing.id, null);
    if (kept) {
      return (await setPageEmailLocal(kept.id, local)) ?? kept;
    }
  }
  if (existing && !isActive(existing)) {
    await deleteImages([existing.bg_url, existing.token_url]);
    if (pageStore() === "supabase") {
      await supabaseAdmin().from("pages").delete().eq("id", existing.id);
    }
  }

  const look = defaultLookForSlug(local);
  const now = new Date().toISOString();
  const page: LostPage = {
    id: newId(),
    slug: local,
    word: local,
    line: null,
    palette: look.palette,
    treatment: look.treatment,
    motif: look.motif,
    font: look.font,
    bg_url: null,
    token_url: null,
    found_count: 0,
    status: "kept",
    expires_at: null,
    polar_order_id: null,
    created_at: now,
    owner_id: null,
    email_local: local,
    mailbox_status: "display",
    mailbox_expires_at: null,
  };

  if (pageStore() === "supabase") {
    const { data, error } = await supabaseAdmin()
      .from("pages")
      .insert(toInsert(page))
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") {
        const again = await peekSlug(local);
        if (again) return again;
      }
      throw error;
    }
    return mapRow(data);
  }

  if (pageStore() === "blob") {
    const published = await blobPublishPage(page, existing);
    if ("page" in published) {
      return (await markKept(published.page.id, null)) ?? published.page;
    }
    throw new Error("couldn't hold that name.");
  }

  const pages = await readLocal();
  const next = pages.filter((p) => p.slug !== local);
  next.push(page);
  await writeLocal(next);
  return page;
}

async function setPageEmailLocal(
  pageId: string,
  emailLocal: string,
): Promise<LostPage | null> {
  if (pageStore() === "supabase") {
    const { data, error } = await supabaseAdmin()
      .from("pages")
      .update({
        email_local: emailLocal,
        mailbox_status: "display",
        updated_at: new Date().toISOString(),
      })
      .eq("id", pageId)
      .select("*")
      .single();
    if (error) throw error;
    return data ? mapRow(data) : null;
  }
  const page = await getPageById(pageId);
  if (!page) return null;
  const next = { ...page, email_local: emailLocal, mailbox_status: "display" as const };
  if (pageStore() === "blob") {
    await blobUpdatePage(next, page.slug);
    return next;
  }
  const pages = await readLocal();
  const idx = pages.findIndex((p) => p.id === pageId);
  if (idx < 0) return null;
  pages[idx] = next;
  await writeLocal(pages);
  return next;
}

export async function updateOwnedPage(
  pageId: string,
  ownerId: string,
  fields: UpdateOwnedFields,
): Promise<
  | { page: LostPage }
  | { error: string; status: number }
> {
  const current = await getPageById(pageId);
  if (!current || !isActive(current)) {
    return { error: "gone.", status: 404 };
  }
  if (current.owner_id !== ownerId) {
    return { error: "not yours.", status: 403 };
  }

  if (fields.slug !== current.slug) {
    const taken = await peekSlug(fields.slug);
    if (taken && taken.id !== pageId && isActive(taken)) {
      return {
        error: taken.status === "kept"
          ? "that word is already kept."
          : "Someone just claimed that. Try another.",
        status: 409,
      };
    }
  }

  const mailboxLocked = await isMailboxAliasLocked(current.id);
  if (mailboxLocked && fields.email_local !== current.email_local) {
    return {
      error: "that inbox is tied to this name for now.",
      status: 409,
    };
  }

  if (fields.email_local) {
    const taken =
      (await isEmailLocalTaken(fields.email_local, pageId)) ||
      (await isMailboxEmailTaken(fields.email_local, pageId));
    if (taken) {
      return { error: "that alias is already spoken for.", status: 409 };
    }
  }

  const oldImages = [current.bg_url, current.token_url];
  const next: LostPage = {
    ...current,
    slug: fields.slug,
    word: fields.word,
    line: fields.line,
    palette: fields.look.palette,
    treatment: fields.look.treatment,
    motif: fields.look.motif,
    font: fields.look.font,
    bg_url: fields.bg_url,
    token_url: fields.token_url,
    email_local: fields.email_local,
  };

  if (pageStore() === "supabase") {
    if (fields.slug !== current.slug) {
      const leftover = await peekSlug(fields.slug);
      if (leftover && leftover.id !== pageId) {
        await supabaseAdmin().from("pages").delete().eq("id", leftover.id);
      }
    }
    const { data, error } = await supabaseAdmin()
      .from("pages")
      .update({
        slug: next.slug,
        word: next.word,
        line: next.line,
        palette: next.palette,
        treatment: next.treatment,
        motif: next.motif,
        font: next.font,
        bg_url: next.bg_url,
        token_url: next.token_url,
        email_local: next.email_local,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pageId)
      .eq("owner_id", ownerId)
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") {
        return { error: "that word or alias is already spoken for.", status: 409 };
      }
      throw error;
    }
    await deleteReplacedImages(oldImages, [next.bg_url, next.token_url]);
    return { page: mapRow(data) };
  }

  if (pageStore() === "blob") {
    await blobUpdatePage(next, current.slug);
    await deleteReplacedImages(oldImages, [next.bg_url, next.token_url]);
    return { page: next };
  }

  const pages = await readLocal();
  const idx = pages.findIndex((p) => p.id === pageId);
  if (idx < 0) return { error: "gone.", status: 404 };
  pages[idx] = next;
  await writeLocal(pages);
  await deleteReplacedImages(oldImages, [next.bg_url, next.token_url]);
  return { page: next };
}

async function deleteReplacedImages(
  previous: Array<string | null>,
  next: Array<string | null>,
) {
  const keep = new Set(next.filter(Boolean));
  await deleteImages(previous.filter((url) => url && !keep.has(url)));
}

export function publicPageFields(page: LostPage): Pick<
  LostPage,
  | "id"
  | "slug"
  | "word"
  | "line"
  | "palette"
  | "treatment"
  | "motif"
  | "font"
  | "bg_url"
  | "token_url"
  | "found_count"
  | "status"
  | "expires_at"
  | "created_at"
  | "email_local"
  | "mailbox_status"
  | "mailbox_expires_at"
> {
  return {
    id: page.id,
    slug: page.slug,
    word: page.word,
    line: page.line,
    palette: page.palette,
    treatment: page.treatment,
    motif: page.motif,
    font: page.font,
    bg_url: page.bg_url,
    token_url: page.token_url,
    found_count: page.found_count,
    status: page.status,
    expires_at: page.expires_at,
    created_at: page.created_at,
    email_local: page.email_local,
    mailbox_status: page.mailbox_status,
    mailbox_expires_at: page.mailbox_expires_at,
  };
}
