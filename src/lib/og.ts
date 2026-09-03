import { imageKeyFromUrl, readLocalImage, sniffImage } from "@/lib/images";
import {
  FONT_META,
  fontWeightFor,
  type FontId,
  type Look,
} from "@/lib/looks";

const TTF_UA =
  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1";

export async function loadOgFont(
  font: FontId,
  treatment: Look["treatment"],
  text: string,
): Promise<{ name: string; data: ArrayBuffer; weight: number } | null> {
  const family = FONT_META[font].google;
  const weight = fontWeightFor(font, treatment);
  const encoded = family.replace(/ /g, "+");
  const url = `https://fonts.googleapis.com/css2?family=${encoded}:wght@${weight}&text=${encodeURIComponent(text)}`;
  try {
    const cssRes = await fetch(url, {
      headers: { "User-Agent": TTF_UA },
    });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!match?.[1]) return null;
    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) return null;
    return { name: family, data: await fontRes.arrayBuffer(), weight };
  } catch {
    return null;
  }
}

export async function resolveOgImageSrc(
  url: string | null,
): Promise<string | null> {
  if (!url) return null;
  const key = imageKeyFromUrl(url);
  if (key && url.startsWith("/api/images/")) {
    const local = await readLocalImage(key);
    if (local) {
      return `data:${local.mime};base64,${local.buf.toString("base64")}`;
    }
  }
  try {
    const abs = url.startsWith("http")
      ? url
      : `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${url}`;
    const res = await fetch(abs);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const sniff = sniffImage(buf);
    if (!sniff) return null;
    return `data:${sniff.mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
