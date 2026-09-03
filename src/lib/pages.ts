import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import { deleteImages } from "./images";
import {
  lookFromStored,
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
  blobMarkKept,
  blobPeekSlug,
  blobPublishPage,
} from "./pages-blob";
import { isBlobConfigured, isSupabaseConfigured } from "./site";

export type PageStatus = "free" | "kept";

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
};

export type PublishFields = {
  slug: string;
  word: string;
  line: string | null;
  look: Look;
  bg_url: string | null;
  token_url: string | null;
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
    process.env.SUPABASE_URL!,
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
  };
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
    return page;
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
    return blobGetPageById(id);
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
    return blobPeekSlug(slug);
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
