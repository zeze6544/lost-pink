export const JUST_LEFT_KEY = "lost.pink:just-left";

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export function formatLeftHere(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const month = MONTHS[d.getUTCMonth()];
  const day = d.getUTCDate();
  if (d.getUTCFullYear() === now.getUTCFullYear()) {
    return `left here ${month} ${day}`;
  }
  return `left here ${month} ${day}, ${d.getUTCFullYear()}`;
}

export function formatHereFor(expiresAt: string, now: number): string {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return "almost lost";
  const hours = ms / 3_600_000;
  if (hours < 6) return "almost lost";
  const totalH = Math.floor(hours);
  const d = Math.floor(totalH / 24);
  const h = totalH % 24;
  if (d > 0) return `here for ${d}d ${h}h`;
  return `here for ${totalH}h`;
}

export function keepLabel(word: string): string {
  return `keep ${word} — A$5 once`;
}

export async function shareOrCopy(
  url: string,
  title: string,
): Promise<"shared" | "copied" | "cancelled"> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text: title, url });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return "cancelled";
      }
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}
