import { MAIL_GRACE_DAYS } from "./product-rules";

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
  return `keep ${word}. A$5 once`;
}

export function inboxMonthLabel(): string {
  return "A$5";
}

export function inboxYearlyLabel(): string {
  return "A$20 annually";
}

export function inboxOnceLabel(): string {
  return "A$20 one-year";
}

export function inboxDayLabel(): string {
  return "A$1";
}

export function inboxLabel(): string {
  return "an inbox. A$1 a day, A$5 a month, or A$20 a year";
}

export function inboxNeedKeep(): string {
  return "keep first, then an inbox.";
}

export function inboxNeedAlias(): string {
  return "choose an alias, then an inbox";
}

export function comeBackLabel(): string {
  return "log in";
}

export function inboxNeedComeBack(alreadyOpen = false): string {
  return alreadyOpen ? "log in to read mail" : "log in to open an inbox";
}

export function inboxDisplayOnly(): string {
  return "display only";
}

export function inboxOpenLabel(): string {
  return "write";
}

export function inboxUntilKeep(): string {
  return "display only until you keep it";
}

export function inboxWaiting(local: string): string {
  return `${local}@lost.pink is waiting. check the mail we sent.`;
}

export function inboxDarkCopy(): string {
  return "this inbox went dark.";
}

export function inboxArriving(): string {
  return "the inbox is still arriving.";
}

export function inboxEmptyCopy(folder: "inbox" | "sent" | "trash" = "inbox"): string {
  if (folder === "sent") return "nothing has left yet.";
  if (folder === "trash") return "the fire already ate it.";
  return "the page is here. the letters aren't.";
}

export function inboxFailedCopy(): string {
  return "couldn't open it. try again, or write support.";
}

export function inboxTerminationNotice(): string {
  return `cancel, refund, or a failed renewal suspends the inbox. mail is kept for ${MAIL_GRACE_DAYS} days, then removed.`;
}

export function expiredInboxCopy(): string {
  return `when paid time ends, the inbox suspends. mail is kept for ${MAIL_GRACE_DAYS} days; the name stays reserved while mail is retained.`;
}

export function formatPaidDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function formatPaidThrough(iso: string): string {
  const date = formatPaidDate(iso);
  return date ? `paid through ${date}` : "";
}

export function formatTimeLeft(iso: string, now = Date.now()): string {
  const ms = new Date(iso).getTime() - now;
  if (Number.isNaN(new Date(iso).getTime())) return "";
  if (ms <= 0) return "paid time has ended";
  const days = Math.floor(ms / 86_400_000);
  if (days >= 60) {
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"} left`;
  }
  if (days >= 14) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} left`;
  }
  if (days >= 2) return `${days} days left`;
  if (days === 1) return "1 day left";
  const hours = Math.max(1, Math.floor(ms / 3_600_000));
  return hours === 1 ? "about an hour left" : `${hours} hours left`;
}

export function formatMemberSince(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `on lost.pink since ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function planLabel(plan: string | null | undefined): string {
  if (plan === "day") return "day";
  if (plan === "month") return "month";
  if (plan === "subscription") return "year · renews";
  if (plan === "once") return "year";
  return "unknown";
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

export function formatMailWhen(iso: string | null, now = new Date()): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const ms = now.getTime() - d.getTime();
  if (ms < 60_000) return "now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000 && d.getDate() === now.getDate()) {
    return `${Math.floor(ms / 3_600_000)}h`;
  }
  const month = MONTHS[d.getMonth()];
  if (d.getFullYear() === now.getFullYear()) {
    return `${month} ${d.getDate()}`;
  }
  return `${month} ${d.getDate()}, ${d.getFullYear()}`;
}

export function displayFrom(from: string): string {
  const trimmed = from.trim();
  if (!trimmed) return "someone";
  const named = /^(.*?)\s*<[^>]+>$/.exec(trimmed);
  if (named?.[1]?.trim()) return named[1].trim().replace(/^["']|["']$/g, "");
  return trimmed.replace(/^<|>$/g, "");
}
