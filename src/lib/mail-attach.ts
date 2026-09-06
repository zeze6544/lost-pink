export const ATTACH_MAX_FILES = 4;
export const ATTACH_MAX_BYTES = 8 * 1024 * 1024;
export const ATTACH_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/heic,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,application/pdf";

const TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp4",
  "application/pdf",
]);

const EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  pdf: "application/pdf",
};

const DANGEROUS_EXT = new Set([
  "app",
  "bat",
  "bin",
  "cmd",
  "com",
  "cpl",
  "dll",
  "dmg",
  "exe",
  "hta",
  "iso",
  "jar",
  "js",
  "jse",
  "lnk",
  "msi",
  "msp",
  "ps1",
  "scr",
  "sh",
  "vbe",
  "vbs",
  "wsf",
]);

export function safeAttachName(raw: string): string {
  const base = raw.split(/[/\\]/).pop() ?? "file";
  const clean = base.replace(/[^\w.\- ()[\]]+/g, "_").trim();
  return (clean || "file").slice(0, 80);
}

export function attachKind(file: { name: string; type: string }): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (DANGEROUS_EXT.has(ext)) return null;

  const type = (file.type || "").toLowerCase().split(";")[0].trim();
  if (type === "application/octet-stream") return null;
  if (type) {
    if (!TYPES.has(type)) return null;
    const extensionType = EXT[ext];
    if (ext && !extensionType) return null;
    if (extensionType && extensionType !== type) return null;
    return type;
  }
  return EXT[ext] ?? null;
}

export function attachProblem(
  file: { name: string; type: string; size: number },
  already: Array<{ size: number }>,
): string | null {
  if (already.length >= ATTACH_MAX_FILES) {
    return "four files is enough for one letter.";
  }
  if (!attachKind(file)) {
    return "photos, video, audio, or pdf only.";
  }
  if (file.size <= 0) return "that file is empty.";
  const total = already.reduce((n, item) => n + item.size, 0) + file.size;
  if (file.size > ATTACH_MAX_BYTES || total > ATTACH_MAX_BYTES) {
    return "keep attachments under 8MB.";
  }
  return null;
}
