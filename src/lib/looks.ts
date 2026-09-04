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

export const MOTIFS = ["grain", "plain", "grid", "echo"] as const;
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
    a: "#2a2a28",
    b: "#3f3e3a",
    c: "#1c1c1a",
    ink: "#d6d2ca",
    swatch: "#3f3e3a",
  },
  bloom: {
    a: "#2c2824",
    b: "#4a443c",
    c: "#1a1816",
    ink: "#e2dbd2",
    swatch: "#4a443c",
  },
  dusk: {
    a: "#1c2228",
    b: "#2e3a46",
    c: "#12161a",
    ink: "#c5ced6",
    swatch: "#2e3a46",
  },
  ink: {
    a: "#161616",
    b: "#242422",
    c: "#0c0c0c",
    ink: "#eceae4",
    swatch: "#1a1a1a",
  },
  pearl: {
    a: "#c8c6c0",
    b: "#a8a69e",
    c: "#d8d6d0",
    ink: "#2a2926",
    swatch: "#c8c6c0",
  },
  veil: {
    a: "#22262e",
    b: "#3a4250",
    c: "#16181c",
    ink: "#cdd2da",
    swatch: "#3a4250",
  },
  wine: {
    a: "#1c1612",
    b: "#322820",
    c: "#100e0c",
    ink: "#e4d6c6",
    swatch: "#322820",
  },
  gilt: {
    a: "#26221c",
    b: "#4e463c",
    c: "#161410",
    ink: "#ece4d6",
    swatch: "#4e463c",
  },
};

export const PALETTE_LABELS: Record<Palette, string> = {
  soft: "fog",
  bloom: "ash",
  dusk: "night",
  ink: "void",
  pearl: "dust",
  veil: "slate",
  wine: "umber",
  gilt: "bone",
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
  palette: "ink",
  treatment: "display",
  motif: "grain",
  font: "newsreader",
};

export function stageStyle(look: Look) {
  const colors = PALETTE_COLORS[look.palette];
  return {
    "--stage-a": colors.a,
    "--stage-b": colors.b,
    "--stage-c": colors.c,
    "--stage-ink": colors.ink,
  };
}

export const LINE_MAX = 120;

export function isPalette(v: unknown): v is Palette {
  return typeof v === "string" && (PALETTES as readonly string[]).includes(v);
}

export function isTreatment(v: unknown): v is Treatment {
  return typeof v === "string" && (TREATMENTS as readonly string[]).includes(v);
}

export function coerceMotif(v: unknown): Motif | null {
  if (v === "heart" || v === "grid") return "grid";
  if (typeof v === "string" && (MOTIFS as readonly string[]).includes(v)) {
    return v as Motif;
  }
  return null;
}

export function isMotif(v: unknown): v is Motif {
  return coerceMotif(v) !== null;
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

const HASH_PALETTES = PALETTES.filter((palette) => palette !== "pearl");
const HASH_TREATMENTS = ["display", "whisper"] as const;

/** Generator defaults when they never pick. Font stays Newsreader. */
export function defaultLookForSlug(slug: string): Look {
  if (!slug) return { ...DEFAULT_LOOK };
  const h = hashSlug(slug);
  return {
    palette: HASH_PALETTES[h % HASH_PALETTES.length],
    treatment: HASH_TREATMENTS[Math.floor(h / 5) % HASH_TREATMENTS.length],
    motif: MOTIFS[Math.floor(h / 15) % MOTIFS.length],
    font: "newsreader",
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
  if (input.motif !== undefined && coerceMotif(input.motif) === null) {
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
    motif: coerceMotif(input.motif) ?? DEFAULT_LOOK.motif,
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
    motif: coerceMotif(raw.motif) ?? fallback.motif,
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
