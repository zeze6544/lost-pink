"use client";

import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { Atmosphere } from "@/components/Atmosphere";
import { PhraseBackdrop } from "@/components/PhraseBackdrop";
import { DEFAULT_LOOK, stageStyle } from "@/lib/looks";
import { presetForPath } from "@/lib/phrase-presets";

export function SiteAtmosphere() {
  const pathname = usePathname() ?? "/";
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={stageStyle(DEFAULT_LOOK) as CSSProperties}
    >
      <Atmosphere variant="landing" />
      <PhraseBackdrop preset={presetForPath(pathname)} variant="site" />
    </div>
  );
}
