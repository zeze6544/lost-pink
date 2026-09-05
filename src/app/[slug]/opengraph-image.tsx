import { ImageResponse } from "next/og";
import {
  displayWord,
  FONT_META,
  PALETTE_COLORS,
  fontWeightFor,
} from "@/lib/looks";
import { loadOgFont, resolveOgImageSrc } from "@/lib/og";
import { getPageBySlug, pageLook } from "@/lib/pages";

export const alt = "lost.pink";
export const size = { width: 1080, height: 1920 };
export const contentType = "image/png";
export const runtime = "nodejs";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: Props) {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const page = await getPageBySlug(slug);

  if (!page) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#121212",
            color: "#eceae4",
            fontSize: 72,
          }}
        >
          {slug}
        </div>
      ),
      { ...size },
    );
  }

  const look = pageLook(page);
  const colors = PALETTE_COLORS[look.palette];
  const shown = displayWord(page.word, look.treatment);
  const fontText = `${shown} ${page.line ?? ""} lost.pink`;
  const loaded = await loadOgFont(look.font, look.treatment, fontText);
  const bgSrc = await resolveOgImageSrc(page.bg_url);
  const tokenSrc = await resolveOgImageSrc(page.token_url);
  const fontName = loaded?.name ?? FONT_META[look.font].google;
  const weight = loaded?.weight ?? fontWeightFor(look.font, look.treatment);
  const wordSize =
    look.treatment === "whisper" ? 56 : look.treatment === "shout" ? 210 : 156;
  const letterSpacing =
    look.treatment === "whisper"
      ? 16
      : look.treatment === "shout"
        ? 6
        : -5;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: colors.a,
          color: colors.ink,
        }}
      >
        {bgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bgSrc}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            background: `linear-gradient(160deg, ${colors.a}, ${colors.c} 45%, ${colors.b})`,
            opacity: bgSrc ? 0.22 : 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 64,
          }}
        >
          {tokenSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tokenSrc}
              alt=""
              width={176}
              height={228}
              style={{
                width: 176,
                height: 228,
                objectFit: "cover",
                borderRadius: 6,
                marginBottom: 36,
                transform: "rotate(-1.5deg)",
              }}
            />
          ) : null}
          {look.motif === "grid" ? (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                backgroundImage:
                  "linear-gradient(to right, rgba(236,234,228,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(236,234,228,0.08) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
          ) : null}
          {look.motif === "echo" ? (
            <div
              style={{
                position: "absolute",
                display: "flex",
                fontSize: wordSize,
                fontFamily: fontName,
                fontWeight: weight,
                letterSpacing,
                opacity: 0.08,
                transform: "translate(36px, -48px)",
              }}
            >
              {shown}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              fontSize: wordSize,
              fontFamily: fontName,
              fontWeight: weight,
              letterSpacing,
              lineHeight: 0.9,
              textAlign: "center",
            }}
          >
            {shown}
          </div>
          {page.line ? (
            <div
              style={{
                display: "flex",
                marginTop: 36,
                fontSize: 32,
                opacity: 0.7,
                textAlign: "center",
                maxWidth: 720,
              }}
            >
              {page.line}
            </div>
          ) : null}
          {page.email_local ? (
            <div
              style={{
                display: "flex",
                marginTop: 20,
                fontSize: 22,
                opacity: 0.35,
                letterSpacing: 3,
              }}
            >
              {page.email_local}@lost.pink
            </div>
          ) : null}
        </div>
        {page.status === "free" ? (
          <div
            style={{
              position: "absolute",
              bottom: 80,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              fontSize: 28,
              opacity: 0.45,
            }}
          >
            lost.pink
          </div>
        ) : null}
      </div>
    ),
    {
      ...size,
      fonts: loaded
        ? [
            {
              name: loaded.name,
              data: loaded.data,
              weight: loaded.weight as 400 | 600 | 700,
              style: "normal",
            },
          ]
        : [],
    },
  );
}
