export type PhrasePreset = {
  id: string;
  text: string;
  label: string;
  x: string;
  y: string;
  scale: number;
  rotation: number;
  opacity: number;
  maxWidth: string;
  align: "left" | "center" | "right";
};

export const PHRASE_PRESETS: readonly PhrasePreset[] = [
  {
    id: "pity-religion",
    text: "pity is a terrible religion",
    label: "pity",
    x: "50%",
    y: "28%",
    scale: 1,
    rotation: -1,
    opacity: 0.34,
    maxWidth: "72rem",
    align: "center",
  },
  {
    id: "victim-mindsets",
    text: "victim mindsets self-destruct",
    label: "mindsets",
    x: "28%",
    y: "38%",
    scale: 0.88,
    rotation: -4,
    opacity: 0.2,
    maxWidth: "60rem",
    align: "left",
  },
  {
    id: "comfort-cowards",
    text: "comfort makes cowards quietly",
    label: "cowards",
    x: "70%",
    y: "43%",
    scale: 0.94,
    rotation: 3,
    opacity: 0.2,
    maxWidth: "64rem",
    align: "right",
  },
  {
    id: "fear-repetition",
    text: "fear survives on repetition",
    label: "repetition",
    x: "50%",
    y: "26%",
    scale: 0.96,
    rotation: 2,
    opacity: 0.3,
    maxWidth: "64rem",
    align: "center",
  },
  {
    id: "cage-shape",
    text: "the cage learns your shape",
    label: "the cage",
    x: "50%",
    y: "30%",
    scale: 1.02,
    rotation: -2,
    opacity: 0.3,
    maxWidth: "68rem",
    align: "center",
  },
  {
    id: "prisons-walls",
    text: "some prisons have no walls",
    label: "no walls",
    x: "31%",
    y: "72%",
    scale: 0.96,
    rotation: -2,
    opacity: 0.2,
    maxWidth: "66rem",
    align: "left",
  },
] as const;

const BY_ID = new Map(PHRASE_PRESETS.map((p) => [p.id, p]));

const PATH_PRESETS: Record<string, string> = {
  "/": "pity-religion",
  "/come": "fear-repetition",
  "/come/forgot": "cage-shape",
  "/join": "victim-mindsets",
  "/login": "prisons-walls",
};

export function phraseById(id: string | null | undefined): PhrasePreset {
  return (id && BY_ID.get(id)) || PHRASE_PRESETS[0];
}

export function phraseIdForPath(pathname: string): string {
  const path = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  if (PATH_PRESETS[path]) return PATH_PRESETS[path];
  let hash = 0x811c9dc5;
  for (const ch of path.toLowerCase() || "lost.pink") {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 0x1000193);
  }
  return PHRASE_PRESETS[(hash >>> 0) % PHRASE_PRESETS.length].id;
}
