import { NAV_MARK } from "@/lib/product-rules";

const SHORT_MARK = "lp.";

type BrandMarkProps = {
  href?: string;
  className?: string;
  /** Compact mark for login chrome. Full NAV_MARK stays the accessible name. */
  short?: boolean;
  /** @deprecated Decorative only — never replaces the nav mark. */
  glyphOnly?: boolean;
};

export function BrandMark({
  href = "/",
  className = "",
  short = false,
  glyphOnly = false,
}: BrandMarkProps) {
  return (
    <a
      href={href}
      className={`brand-mark mark inline-flex items-center gap-2 ${className}`}
      aria-label={NAV_MARK}
    >
      {glyphOnly ? <span className="brand-glyph" aria-hidden /> : null}
      <span>{short ? SHORT_MARK : NAV_MARK}</span>
    </a>
  );
}
