export const PHRASE_PRESETS = [
  {
    id: "pity-religion",
    text: "pity is a terrible religion",
    label: "pity",
    x: "50%",
    y: "42%",
    scale: 1,
    rotation: -1,
    opacity: 0.48,
    maxWidth: "40rem",
    align: "center",
  },
  {
    id: "victim-mindsets",
    text: "victim mindsets self-destruct",
    label: "mindsets",
    x: "28%",
    y: "38%",
    scale: 0.92,
    rotation: -2,
    opacity: 0.44,
    maxWidth: "38rem",
    align: "left",
  },
  {
    id: "comfort-cowards",
    text: "comfort makes cowards quietly",
    label: "cowards",
    x: "70%",
    y: "43%",
    scale: 0.94,
    rotation: 2,
    opacity: 0.44,
    maxWidth: "38rem",
    align: "right",
  },
  {
    id: "victimhood-audience",
    text: "victimhood loves an audience",
    label: "audience",
    x: "50%",
    y: "58%",
    scale: 1.04,
    rotation: 0,
    opacity: 0.42,
    maxWidth: "40rem",
    align: "center",
  },
  {
    id: "comfort-ambition",
    text: "comfort quietly kills ambition",
    label: "ambition",
    x: "46%",
    y: "30%",
    scale: 1.06,
    rotation: 1,
    opacity: 0.44,
    maxWidth: "42rem",
    align: "center",
  },
  {
    id: "fear-repetition",
    text: "fear survives on repetition",
    label: "repetition",
    x: "24%",
    y: "60%",
    scale: 0.94,
    rotation: 2,
    opacity: 0.46,
    maxWidth: "36rem",
    align: "left",
  },
  {
    id: "cage-shape",
    text: "the cage learns your shape",
    label: "the cage",
    x: "74%",
    y: "56%",
    scale: 1,
    rotation: -2,
    opacity: 0.44,
    maxWidth: "38rem",
    align: "right",
  },
  {
    id: "resentment-receipts",
    text: "resentment keeps receipts",
    label: "receipts",
    x: "50%",
    y: "46%",
    scale: 1.08,
    rotation: 0,
    opacity: 0.46,
    maxWidth: "40rem",
    align: "center",
  },
  {
    id: "prisons-walls",
    text: "some prisons have no walls",
    label: "no walls",
    x: "32%",
    y: "68%",
    scale: 0.96,
    rotation: -1,
    opacity: 0.42,
    maxWidth: "38rem",
    align: "left",
  },
  {
    id: "wound-becomes-you",
    text: "the wound wins when it becomes you",
    label: "the wound",
    x: "64%",
    y: "34%",
    scale: 0.92,
    rotation: 1,
    opacity: 0.44,
    maxWidth: "42rem",
    align: "right",
  },
] as const;

export type PhrasePresetId = (typeof PHRASE_PRESETS)[number]["id"];
export type PhrasePreset = (typeof PHRASE_PRESETS)[number];

export const LANDING_PHRASE_PRESET: PhrasePresetId = "pity-religion";

const BY_ID = new Map<string, PhrasePreset>(
  PHRASE_PRESETS.map((preset) => [preset.id, preset]),
);

const PATH_PRESETS: Record<string, PhrasePresetId> = {
  "/": "pity-religion",
  "/come": "fear-repetition",
  "/come/forgot": "cage-shape",
  "/join": "victim-mindsets",
  "/you": "resentment-receipts",
  "/setup/gmail": "comfort-cowards",
  "/support": "victimhood-audience",
  "/privacy": "prisons-walls",
  "/terms": "pity-religion",
  "/thanks": "wound-becomes-you",
};

export function presetById(id: string): PhrasePreset | undefined {
  return BY_ID.get(id);
}

export function presetForPath(pathname: string): PhrasePresetId {
  const path = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  return PATH_PRESETS[path] ?? presetForKey(path);
}

export function presetForKey(key: string): PhrasePresetId {
  let hash = 0x811c9dc5;
  for (const ch of key.trim().toLowerCase() || "lost.pink") {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 0x1000193);
  }
  return PHRASE_PRESETS[(hash >>> 0) % PHRASE_PRESETS.length].id;
}
