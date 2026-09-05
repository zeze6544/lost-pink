import { useId } from "react";

const FLOOR = (() => {
  const w = 1600;
  const h = 900;
  const vpX = 800;
  const vpY = 110;
  const verts: string[] = [];
  const cols = 14;
  for (let i = 0; i <= cols; i++) {
    const x = (i / cols) * w;
    verts.push(`M${x} ${h} L${vpX} ${vpY}`);
  }
  const horiz: string[] = [];
  const rows = 11;
  for (let i = 1; i <= rows; i++) {
    const t = i / rows;
    const y = vpY + (h - vpY) * (t * t);
    const half = ((y - vpY) / (h - vpY)) * w * 0.82;
    horiz.push(`M${vpX - half} ${y} L${vpX + half} ${y}`);
  }
  return { w, h, verts, horiz };
})();

type AtmosphereVariant = "default" | "landing";

export function Atmosphere({
  wash = 1,
  variant = "default",
}: {
  wash?: number;
  variant?: AtmosphereVariant;
}) {
  const uid = useId().replace(/:/g, "");
  const fade = `atm-fade-${uid}`;
  const mask = `atm-mask-${uid}`;
  const soft = `atm-soft-${uid}`;
  const bloom = `atm-bloom-${uid}`;

  return (
    <div
      className={`atmosphere atmosphere--${variant} pointer-events-none absolute inset-0 overflow-hidden`}
      aria-hidden
    >
      <div className="atmosphere-wash absolute inset-0" style={{ opacity: wash }} />
      <div className="atmosphere-bloom atmosphere-bloom-a" />
      <div className="atmosphere-bloom atmosphere-bloom-b" />
      <div className="atmosphere-bloom atmosphere-bloom-c" />
      <div className="atmosphere-well" />
      <svg
        className="atmosphere-floor"
        viewBox={`0 0 ${FLOOR.w} ${FLOOR.h}`}
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <filter id={soft} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={variant === "landing" ? "2.2" : "11"}
            />
          </filter>
          <filter id={bloom} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={variant === "landing" ? "8" : "24"}
            />
          </filter>
          <linearGradient id={fade} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop
              offset="18%"
              stopColor="white"
              stopOpacity={variant === "landing" ? "0.04" : "0.02"}
            />
            <stop
              offset="34%"
              stopColor="white"
              stopOpacity={variant === "landing" ? "0.18" : "0.1"}
            />
            <stop
              offset="56%"
              stopColor="white"
              stopOpacity={variant === "landing" ? "0.42" : "0.28"}
            />
            <stop
              offset="78%"
              stopColor="white"
              stopOpacity={variant === "landing" ? "0.22" : "0.12"}
            />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id={mask}>
            <rect width="100%" height="100%" fill={`url(#${fade})`} />
          </mask>
        </defs>
        <g
          mask={`url(#${mask})`}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <g
            filter={`url(#${bloom})`}
            strokeWidth={variant === "landing" ? "3.2" : "6"}
            opacity={variant === "landing" ? "0.55" : "0.45"}
          >
            {FLOOR.verts.map((d) => (
              <path key={`b-${d}`} d={d} />
            ))}
            {FLOOR.horiz.map((d) => (
              <path key={`b-${d}`} d={d} />
            ))}
          </g>
          <g
            filter={`url(#${soft})`}
            strokeWidth={variant === "landing" ? "1.55" : "2.6"}
            opacity={variant === "landing" ? "0.95" : "1"}
          >
            {FLOOR.verts.map((d) => (
              <path key={d} d={d} />
            ))}
            {FLOOR.horiz.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </g>
      </svg>
      <div className="atmosphere-veil" />
      <div className="atmosphere-dither" />
    </div>
  );
}
