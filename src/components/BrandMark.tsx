import { NAV_MARK } from "@/lib/product-rules";

type BrandMarkProps = {
  href?: string;
  className?: string;
};

export function BrandMark({ href = "/", className = "" }: BrandMarkProps) {
  return (
    <a
      href={href}
      className={`brand-mark mark inline-flex items-center ${className}`}
      aria-label={NAV_MARK}
    >
      <span>{NAV_MARK}</span>
    </a>
  );
}
