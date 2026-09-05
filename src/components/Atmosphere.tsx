"use client";

import { useId } from "react";

const FLOOR = (() => {
  const verts: string[] = [];
  for (let i = 0; i <= 14; i++) {
    const x = (i / 14) * 1600;
    verts.push(`M${x} 900 L800 110`);
  }
  const horiz: string[] = [];
  for (let i = 1; i <= 11; i++) {
    const a = i / 11;
    const y = 110 + a * a * 790;
    const s = ((y - 110) / 790) * 1312;
    horiz.push(`M${800 - s} ${y} L${800 + s} ${y}`);
  }
  return { w: 1600, h: 900, verts, horiz };
})();

export function Atmosphere({
  wash = 1,
  variant = "default",
}: {
  wash?: number;
  variant?: "default" | "landing";
}) {
  const rawId = useId().replace(/:/g, "");
  const soft = `atm-soft-${rawId}`;
  const bloom = `atm-bloom-${rawId}`;
  const fade = `atm-fade-${rawId}`;
  const mask = `atm-mask-${rawId}`;

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
            <feGaussianBlur in="SourceGraphic" stdDeviation="11" />
          </filter>
          <filter id={bloom} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="24" />
          </filter>
          <linearGradient id={fade} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="22%" stopColor="white" stopOpacity="0.02" />
            <stop offset="38%" stopColor="white" stopOpacity="0.1" />
            <stop offset="58%" stopColor="white" stopOpacity="0.28" />
            <stop offset="78%" stopColor="white" stopOpacity="0.12" />
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
          <g filter={`url(#${bloom})`} strokeWidth="6" opacity="0.45">
            {FLOOR.verts.map((d) => (
              <path key={`b-${d}`} d={d} />
            ))}
            {FLOOR.horiz.map((d) => (
              <path key={`bh-${d}`} d={d} />
            ))}
          </g>
          <g filter={`url(#${soft})`} strokeWidth="2.6">
            {FLOOR.verts.map((d) => (
              <path key={`s-${d}`} d={d} />
            ))}
            {FLOOR.horiz.map((d) => (
              <path key={`sh-${d}`} d={d} />
            ))}
          </g>
        </g>
      </svg>
      <div className="atmosphere-veil" />
      <div className="atmosphere-dither" />
    </div>
  );
}
