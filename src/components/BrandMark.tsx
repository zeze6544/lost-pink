type BrandMarkProps = {
  href?: string;
  className?: string;
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
      aria-label={glyphOnly ? "lost.pink" : undefined}
    >
      <span className="brand-glyph" aria-hidden />
      {glyphOnly ? null : <span>lost.pink</span>}
    </a>
  );
}
