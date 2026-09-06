import { NAV_MARK } from "@/lib/product-rules";

type BrandMarkProps = {
  href?: string;
  className?: string;
  /** @deprecated Decorative only — never replaces the nav mark. */
  glyphOnly?: boolean;
};

export function BrandMark({
  href = "/",
  className = "",
  glyphOnly = false,
}: BrandMarkProps) {
  return (
    <a
      href={href}
      className={`brand-mark mark inline-flex items-center gap-2 ${className}`}
      aria-label={NAV_MARK}
    >
      {glyphOnly ? <span className="brand-glyph" aria-hidden /> : null}
      <span>{NAV_MARK}</span>
    </a>
  );
}
