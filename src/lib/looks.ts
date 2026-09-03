export const PALETTES = [
  "soft",
  "bloom",
  "dusk",
  "ink",
  "pearl",
  "veil",
  "wine",
  "gilt",
] as const;
export type Palette = (typeof PALETTES)[number];

export const TREATMENTS = ["display", "whisper", "shout"] as const;
export type Treatment = (typeof TREATMENTS)[number];

export const MOTIFS = ["grain", "plain", "heart", "echo"] as const;
export type Motif = (typeof MOTIFS)[number];

export const FONTS = [
  "fraunces",
  "playfair",
  "cormorant",
  "instrument",
  "outfit",
  "plex",
  "vibes",
  "newsreader",
] as const;
export type FontId = (typeof FONTS)[number];

export type Look = {
  palette: Palette;
  treatment: Treatment;
  motif: Motif;
  font: FontId;
};

export const PALETTE_COLORS: Record<
  Palette,
  { a: string; b: string; c: string; ink: string; swatch: string }
> = {
  soft: {
    a: "#ffd6e5",
    b: "#f7a8c4",
    c: "#ffe8f0",
    ink: "#3a1a28",
    swatch: "#f7a8c4",
  },
  bloom: {
    a: "#ffc2d4",
    b: "#ff8fb3",
    c: "#fff0f5",
    ink: "#401828",
    swatch: "#ff8fb3",
  },
  dusk: {
    a: "#e8a0b8",
    b: "#c45d7a",
    c: "#f2c4d4",
    ink: "#2a121c",
    swatch: "#c45d7a",
  },
  ink: {
    a: "#3a1424",
    b: "#6b1f3a",
    c: "#1a0a12",
    ink: "#ffd6e5",
    swatch: "#2a1018",
  },
  pearl: {
    a: "#f7eef2",
    b: "#ead7df",
    c: "#fff9fb",
    ink: "#4a3038",
    swatch: "#f4ecef",
  },
  veil: {
    a: "#d4c0d8",
    b: "#8b6b92",
    c: "#e8dcec",
    ink: "#1c1222",
    swatch: "#8b6b92",
  },
  wine: {
    a: "#5c2438",
    b: "#8b3048",
    c: "#3a1424",
    ink: "#f4d0da",
    swatch: "#5c2438",
  },
  gilt: {
    a: "#f3dcc8",
    b: "#e8b89a",
    c: "#fbf0e4",
    ink: "#3a2418",
    swatch: "#e8c4a8",
  },
};

export const FONT_META: Record<
  FontId,
  { label: string; cssVar: string; google: string }
> = {
  fraunces: {
    label: "Fraunces",
    cssVar: "--font-fraunces",
    google: "Fraunces",
  },
  playfair: {
    label: "Playfair Display",
    cssVar: "--font-playfair",
    google: "Playfair Display",
  },
  cormorant: {
    label: "Cormorant",
    cssVar: "--font-cormorant",
    google: "Cormorant Garamond",
  },
  instrument: {
    label: "Instrument Serif",
    cssVar: "--font-instrument",
    google: "Instrument Serif",
  },
  outfit: {
    label: "Outfit",
    cssVar: "--font-outfit",
    google: "Outfit",
  },
  plex: {
    label: "IBM Plex Mono",
    cssVar: "--font-plex",
    google: "IBM Plex Mono",
  },
  vibes: {
    label: "Great Vibes",
    cssVar: "--font-vibes",
    google: "Great Vibes",
  },
  newsreader: {
    label: "Newsreader",
    cssVar: "--font-newsreader",
    google: "Newsreader",
  },
};

export const DEFAULT_LOOK: Look = {
  palette: "soft",
  treatment: "display",
  motif: "grain",
  font: "fraunces",
};

export const LINE_MAX = 120;

export function isPalette(v: unknown): v is Palette {
  return typeof v === "string" && (PALETTES as readonly string[]).includes(v);
}

export function isTreatment(v: unknown): v is Treatment {
  return typeof v === "string" && (TREATMENTS as readonly string[]).includes(v);
}

export function isMotif(v: unknown): v is Motif {
  return typeof v === "string" && (MOTIFS as readonly string[]).includes(v);
}

export function isFontId(v: unknown): v is FontId {
  return typeof v === "string" && (FONTS as readonly string[]).includes(v);
}

function hashSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash + slug.charCodeAt(i) * (i + 1)) % 997;
  }
  return hash;
}

/** Generator defaults when they never pick. Font stays Fraunces. */
export function defaultLookForSlug(slug: string): Look {
  if (!slug) return { ...DEFAULT_LOOK };
  const h = hashSlug(slug);
  return {
    palette: PALETTES[h % PALETTES.length],
    treatment: TREATMENTS[Math.floor(h / 5) % TREATMENTS.length],
    motif: MOTIFS[Math.floor(h / 15) % MOTIFS.length],
    font: "fraunces",
  };
}

export function parseLook(input: {
  palette?: unknown;
  treatment?: unknown;
  motif?: unknown;
  font?: unknown;
}): Look | { error: string } {
  if (input.palette !== undefined && !isPalette(input.palette)) {
    return { error: "Unknown palette." };
  }
  if (input.treatment !== undefined && !isTreatment(input.treatment)) {
    return { error: "Unknown type treatment." };
  }
  if (input.motif !== undefined && !isMotif(input.motif)) {
    return { error: "Unknown motif." };
  }
  if (input.font !== undefined && !isFontId(input.font)) {
    return { error: "Unknown font." };
  }
  return {
    palette: isPalette(input.palette) ? input.palette : DEFAULT_LOOK.palette,
    treatment: isTreatment(input.treatment)
      ? input.treatment
      : DEFAULT_LOOK.treatment,
    motif: isMotif(input.motif) ? input.motif : DEFAULT_LOOK.motif,
    font: isFontId(input.font) ? input.font : DEFAULT_LOOK.font,
  };
}

export function lookFromStored(
  slug: string,
  raw: {
    palette?: unknown;
    treatment?: unknown;
    motif?: unknown;
    font?: unknown;
  },
): Look {
  const fallback = defaultLookForSlug(slug);
  return {
    palette: isPalette(raw.palette) ? raw.palette : fallback.palette,
    treatment: isTreatment(raw.treatment) ? raw.treatment : fallback.treatment,
    motif: isMotif(raw.motif) ? raw.motif : fallback.motif,
    font: isFontId(raw.font) ? raw.font : fallback.font,
  };
}

export function sanitizeLine(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.replace(/\s+/g, " ").trim().slice(0, LINE_MAX);
  return s.length ? s : null;
}

export function fontWeightFor(font: FontId, treatment: Treatment): number {
  if (font === "vibes" || font === "instrument") return 400;
  if (treatment === "whisper") return 400;
  if (treatment === "shout") return font === "plex" ? 600 : 700;
  return 600;
}

export function displayWord(word: string, treatment: Treatment): string {
  return treatment === "shout" ? word.toUpperCase() : word;
}
