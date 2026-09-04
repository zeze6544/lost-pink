const ALLOWED = new Set([
  "p",
  "br",
  "div",
  "span",
  "a",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "h1",
  "h2",
  "h3",
  "h4",
  "hr",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
]);

function hrefOf(tag: string): string | null {
  const match = /\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
  const raw = match?.[2] ?? match?.[3] ?? match?.[4] ?? "";
  if (!raw) return null;
  const href = raw.trim();
  if (/^(https?:|mailto:)/i.test(href)) return href;
  return null;
}

function srcOf(tag: string): string | null {
  const match = /\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
  const raw = match?.[2] ?? match?.[3] ?? match?.[4] ?? "";
  if (!raw) return null;
  const src = raw.trim();
  if (/^https?:/i.test(src)) return src;
  return null;
}

export function sanitizeMailHtml(html: string, allowImages: boolean): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(iframe|object|embed|link|meta|form|input|button)[\s\S]*?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

  return stripped.replace(
    /<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g,
    (full, tag: string) => {
      const name = tag.toLowerCase();
      const closing = full.startsWith("</");
      if (name === "img") {
        if (!allowImages || closing) return "";
        const src = srcOf(full);
        if (!src) return "";
        return `<img src="${src.replace(/"/g, "")}" alt="">`;
      }
      if (!ALLOWED.has(name)) return "";
      if (closing) return `</${name}>`;
      if (name === "br" || name === "hr") return `<${name}>`;
      if (name === "a") {
        const href = hrefOf(full);
        if (!href) return "<a>";
        return `<a href="${href.replace(/"/g, "")}" rel="noreferrer noopener" target="_blank">`;
      }
      return `<${name}>`;
    },
  );
}

export function textFromHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
