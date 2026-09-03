import { promises as fs } from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./site";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_DIR = path.join(process.cwd(), ".data", "images");
const BUCKET = "shrine-images";

export type ImageKind = "jpeg" | "png" | "webp";

export type SniffedImage = {
  kind: ImageKind;
  ext: string;
  mime: string;
};

function supabaseAdmin(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function sniffImage(buf: Uint8Array): SniffedImage | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { kind: "jpeg", ext: "jpg", mime: "image/jpeg" };
  }
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return { kind: "png", ext: "png", mime: "image/png" };
  }
  const riff = String.fromCharCode(buf[0], buf[1], buf[2], buf[3]);
  const webp = String.fromCharCode(buf[8], buf[9], buf[10], buf[11]);
  if (riff === "RIFF" && webp === "WEBP") {
    return { kind: "webp", ext: "webp", mime: "image/webp" };
  }
  return null;
}

export function imageKeyFromUrl(url: string): string | null {
  const pathPart = url.startsWith("http")
    ? (() => {
        try {
          return new URL(url).pathname;
        } catch {
          return url;
        }
      })()
    : url;
  const match = pathPart.match(
    /(?:\/api\/images\/|\/shrine-images\/)([A-Za-z0-9._-]+)$/,
  );
  return match?.[1] ?? null;
}

export function isAllowedImageUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  if (url.startsWith("/api/images/")) {
    return Boolean(imageKeyFromUrl(url));
  }
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  if (
    base &&
    url.startsWith(`${base}/storage/v1/object/public/${BUCKET}/`)
  ) {
    return Boolean(imageKeyFromUrl(url));
  }
  return false;
}

export async function saveImage(
  buf: Buffer,
  sniff: SniffedImage,
): Promise<string> {
  const key = `${crypto.randomUUID()}.${sniff.ext}`;

  if (isSupabaseConfigured()) {
    const { error } = await supabaseAdmin()
      .storage.from(BUCKET)
      .upload(key, buf, {
        contentType: sniff.mime,
        upsert: false,
      });
    if (error) throw error;
    const { data } = supabaseAdmin().storage.from(BUCKET).getPublicUrl(key);
    return data.publicUrl;
  }

  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.writeFile(path.join(IMAGE_DIR, key), buf);
  return `/api/images/${key}`;
}

export async function readLocalImage(
  id: string,
): Promise<{ buf: Buffer; mime: string } | null> {
  if (!/^[A-Za-z0-9._-]+$/.test(id)) return null;
  const filePath = path.join(IMAGE_DIR, id);
  try {
    const buf = await fs.readFile(filePath);
    const sniff = sniffImage(buf);
    return { buf, mime: sniff?.mime ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

export async function deleteImageByUrl(
  url: string | null | undefined,
): Promise<void> {
  if (!url) return;
  const key = imageKeyFromUrl(url);
  if (!key) return;

  if (isSupabaseConfigured() && url.includes(`/${BUCKET}/`)) {
    await supabaseAdmin().storage.from(BUCKET).remove([key]);
    return;
  }

  try {
    await fs.unlink(path.join(IMAGE_DIR, key));
  } catch {
    // already gone
  }
}

export async function deleteImages(
  urls: Array<string | null | undefined>,
): Promise<void> {
  await Promise.all(urls.map((url) => deleteImageByUrl(url)));
}
