export type LinePart = { text: string; href?: string };

export function safeHttpsHref(raw: string): string | null {
  let candidate = raw.trim();
  if (!candidate) return null;
  if (/^(javascript|data|vbscript|file|blob):/i.test(candidate)) return null;
  if (/^http:\/\//i.test(candidate)) return null;
  if (/^www\./i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  return url.href;
}

export function splitLineLinks(text: string): LinePart[] {
  const parts: LinePart[] = [];
  const re = /https:\/\/[^\s<>"']+|www\.[^\s<>"']+/gi;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ text: text.slice(last, match.index) });
    }
    const raw = match[0];
    const trimmed = raw.replace(/[),.;!?]+$/g, "");
    const trail = raw.slice(trimmed.length);
    const href = safeHttpsHref(trimmed);
    if (href) {
      parts.push({ text: trimmed, href });
      if (trail) parts.push({ text: trail });
    } else {
      parts.push({ text: raw });
    }
    last = match.index + raw.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts.length ? parts : [{ text }];
}
