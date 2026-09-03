import { del, get, list, put } from "@vercel/blob";
import { deleteImages } from "./images";
import type { LostPage } from "./pages";


const ID_PREFIX = "pages/id/";
const SLUG_PREFIX = "pages/slug/";

function idPath(id: string): string {
  return `${ID_PREFIX}${id}.json`;
}

function slugPath(slug: string): string {
  return `${SLUG_PREFIX}${slug}.json`;
}

async function readJson<T>(pathname: string): Promise<T | null> {
  try {
    const result = await get(pathname, { access: "public", useCache: false });
    if (!result || result.statusCode !== 200) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function writeJson(
  pathname: string,
  data: unknown,
  overwrite: boolean,
): Promise<void> {
  await put(pathname, JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: overwrite,
    cacheControlMaxAge: 0,
  });
}

function isAlreadyExists(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const message = "message" in err ? String(err.message) : "";
  return /already exists/i.test(message);
}

export async function blobGetPageById(id: string): Promise<LostPage | null> {
  return readJson<LostPage>(idPath(id));
}

export async function blobPeekSlug(slug: string): Promise<LostPage | null> {
  const pointer = await readJson<{ id: string }>(slugPath(slug));
  if (!pointer?.id) return null;
  return blobGetPageById(pointer.id);
}

export async function blobPublishPage(
  page: LostPage,
  existing: LostPage | null,
): Promise<{ page: LostPage } | { conflict: true; kept: boolean }> {
  if (existing && existing.id !== page.id) {
    await del(idPath(existing.id)).catch(() => undefined);
  }

  try {
    await writeJson(idPath(page.id), page, Boolean(existing));
    await writeJson(slugPath(page.slug), { id: page.id }, Boolean(existing));
  } catch (err) {
    if (isAlreadyExists(err)) {
      const raced = await blobPeekSlug(page.slug);
      return { conflict: true, kept: raced?.status === "kept" };
    }
    throw err;
  }

  return { page };
}

export async function blobMarkKept(
  pageId: string,
  polarOrderId: string | null,
): Promise<LostPage | null> {
  const page = await blobGetPageById(pageId);
  if (!page) return null;
  const next: LostPage = {
    ...page,
    status: "kept",
    expires_at: null,
    polar_order_id: polarOrderId,
  };
  await writeJson(idPath(pageId), next, true);
  return next;
}

export async function blobIncrementFound(
  slug: string,
  isActive: (page: LostPage) => boolean,
): Promise<number | null> {
  const page = await blobPeekSlug(slug);
  if (!page || !isActive(page)) return null;
  const next: LostPage = { ...page, found_count: page.found_count + 1 };
  await writeJson(idPath(page.id), next, true);
  return next.found_count;
}

export async function blobUpdatePage(
  page: LostPage,
  oldSlug: string,
): Promise<void> {
  await writeJson(idPath(page.id), page, true);
  if (oldSlug !== page.slug) {
    await del(slugPath(oldSlug)).catch(() => undefined);
  }
  await writeJson(slugPath(page.slug), { id: page.id }, true);
}

export async function blobListAll(): Promise<LostPage[]> {
  const found: LostPage[] = [];
  let cursor: string | undefined;
  do {
    const result = await list({ prefix: ID_PREFIX, cursor, limit: 1000 });
    for (const blob of result.blobs) {
      const page = await readJson<LostPage>(blob.pathname);
      if (page) found.push(page);
    }
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);
  return found;
}

export async function blobListByOwner(ownerId: string): Promise<LostPage[]> {
  const found: LostPage[] = [];
  let cursor: string | undefined;
  do {
    const result = await list({ prefix: ID_PREFIX, cursor, limit: 1000 });
    for (const blob of result.blobs) {
      const page = await readJson<LostPage>(blob.pathname);
      if (page?.owner_id === ownerId) found.push(page);
    }
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);
  found.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return found;
}

export async function blobExpireFreePages(
  now: string,
): Promise<number> {
  let removed = 0;
  let cursor: string | undefined;

  do {
    const result = await list({ prefix: ID_PREFIX, cursor, limit: 1000 });
    for (const blob of result.blobs) {
      const page = await readJson<LostPage>(blob.pathname);
      if (!page) continue;
      const expired =
        page.status === "free" &&
        (!page.expires_at || page.expires_at < now);
      if (!expired) continue;
      await deleteImages([page.bg_url, page.token_url]);
      await del([idPath(page.id), slugPath(page.slug)]).catch(() => undefined);
      removed += 1;
    }
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return removed;
}
