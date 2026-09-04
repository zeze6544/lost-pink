import {
  displayWord,
  FONT_META,
  PALETTE_COLORS,
  fontWeightFor,
  type Look,
} from "@/lib/looks";

const WIDTH = 1080;
const HEIGHT = 1920;

export type ExportPayload = {
  word: string;
  look: Look;
  line?: string | null;
  alias?: string | null;
  bgUrl?: string | null;
  tokenUrl?: string | null;
  watermark?: boolean;
};

export async function downloadLockScreen(payload: ExportPayload) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  await document.fonts.ready;
  await paintShrine(ctx, payload);

  const link = document.createElement("a");
  link.download = `lost-pink-${payload.word}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function paintShrine(
  ctx: CanvasRenderingContext2D,
  payload: ExportPayload,
) {
  const { word, look, line, alias, bgUrl, tokenUrl, watermark } = payload;
  const colors = PALETTE_COLORS[look.palette];
  const shown = displayWord(word, look.treatment);

  const bg = bgUrl ? await loadImage(bgUrl) : null;
  if (bg) {
    drawCover(ctx, bg, WIDTH, HEIGHT);
    ctx.fillStyle = colors.a;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
  }

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, colors.a);
  gradient.addColorStop(0.45, colors.c);
  gradient.addColorStop(1, colors.b);
  ctx.globalAlpha = bg ? 0.45 : 1;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.globalAlpha = 1;

  if (look.motif === "grain") {
    drawGrain(ctx);
  }

  const family = fontFamilyFor(look.font);
  const weight = fontWeightFor(look.font, look.treatment);
  const tracking =
    look.treatment === "whisper"
      ? 0.3
      : look.treatment === "shout"
        ? 0.04
        : -0.045;

  let size =
    look.treatment === "whisper" ? 72 : look.treatment === "shout" ? 288 : 196;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${weight} ${size}px ${family}`;
  while (measureTracked(ctx, shown, size, tracking) > WIDTH * 0.82 && size > 48) {
    size -= 6;
    ctx.font = `${weight} ${size}px ${family}`;
  }

  const token = tokenUrl ? await loadImage(tokenUrl) : null;
  const tokenW = 200;
  const tokenH = 258;
  const wordY =
    look.treatment === "whisper"
      ? HEIGHT * 0.55
      : look.treatment === "shout"
        ? HEIGHT * 0.44
        : HEIGHT * 0.48;
  const tokenY = wordY - size * 0.7 - tokenH / 2 - 28;

  if (token) {
    ctx.save();
    ctx.translate(WIDTH / 2, tokenY + tokenH / 2);
    ctx.rotate((-1.5 * Math.PI) / 180);
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    roundRectImage(ctx, token, -tokenW / 2, -tokenH / 2, tokenW, tokenH, 6);
    ctx.restore();
  }

  if (look.motif === "grid") {
    drawGrid(ctx, colors.ink);
  }

  if (look.motif === "echo") {
    ctx.fillStyle = colors.ink;
    ctx.globalAlpha = 0.08;
    fillTracked(
      ctx,
      shown,
      WIDTH / 2 + size * 0.14,
      wordY - size * 0.18,
      size * 1.05,
      tracking,
    );
    ctx.globalAlpha = 0.04;
    fillTracked(
      ctx,
      shown,
      WIDTH / 2 - size * 0.16,
      wordY + size * 0.2,
      size * 0.94,
      tracking,
    );
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = colors.ink;
  fillTracked(ctx, shown, WIDTH / 2, wordY, size, tracking);

  if (line) {
    ctx.globalAlpha = 0.7;
    ctx.font = `400 32px ${fontFamilyFor("outfit")}, system-ui, sans-serif`;
    wrapText(ctx, line, WIDTH / 2, wordY + size * 0.7, WIDTH * 0.72, 42);
    ctx.globalAlpha = 1;
  }

  if (watermark) {
    ctx.globalAlpha = 0.32;
    ctx.font = `400 26px system-ui, sans-serif`;
    ctx.fillText("lost.pink", WIDTH / 2, HEIGHT - 110);
    ctx.globalAlpha = 1;
  }

  if (alias) {
    ctx.globalAlpha = 0.32;
    ctx.font = `400 22px system-ui, sans-serif`;
    ctx.fillText(`${alias}@lost.pink`, WIDTH / 2, HEIGHT - (watermark ? 160 : 110));
    ctx.globalAlpha = 1;
  }
}

function fontFamilyFor(font: Look["font"]): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(FONT_META[font].cssVar)
    .trim();
  return raw || `"${FONT_META[font].google}", Georgia, serif`;
}

function measureTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  size: number,
  tracking: number,
) {
  const extra = tracking * size * Math.max(text.length - 1, 0);
  return ctx.measureText(text).width + extra;
}

function fillTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  tracking: number,
) {
  if (Math.abs(tracking) < 0.01) {
    ctx.fillText(text, x, y);
    return;
  }
  const extra = tracking * size;
  let width = 0;
  for (const ch of text) width += ctx.measureText(ch).width + extra;
  width -= extra;
  let cursor = x - width / 2;
  const baseline = ctx.textBaseline;
  const align = ctx.textAlign;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + extra;
  }
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  const start = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, x, start + i * lineHeight));
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function roundRectImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.clip();
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, ink: string) {
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.1;
  ctx.lineWidth = 1;
  const step = 48;
  for (let x = 0; x <= WIDTH; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGrain(ctx: CanvasRenderingContext2D) {
  const tile = 256;
  const noise = document.createElement("canvas");
  noise.width = tile;
  noise.height = tile;
  const nctx = noise.getContext("2d");
  if (!nctx) return;
  const data = nctx.createImageData(tile, tile);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.random() * 255;
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 36;
  }
  nctx.putImageData(data, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = 0.22;
  const pattern = ctx.createPattern(noise, "repeat");
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  ctx.restore();
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (!url.startsWith("blob:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
