import type { CSSProperties } from "react";
import {
  presetById,
  type PhrasePresetId,
} from "@/lib/phrase-presets";

export function PhraseBackdrop({
  preset,
  variant = "stage",
  className = "",
}: {
  preset: PhrasePresetId;
  variant?: "stage" | "site";
  className?: string;
}) {
  const phrase = presetById(preset);
  if (!phrase) return null;

  return (
    <div
      aria-hidden
      className={`phrase-backdrop phrase-backdrop--${variant} ${className}`}
      data-preset={preset}
    >
      <p
        className="phrase-backdrop__text"
        style={
          {
            "--phrase-x": phrase.x,
            "--phrase-y": phrase.y,
            "--phrase-scale": phrase.scale,
            "--phrase-rotation": `${phrase.rotation}deg`,
            "--phrase-opacity": phrase.opacity,
            "--phrase-max": phrase.maxWidth,
            "--phrase-align": phrase.align,
          } as CSSProperties
        }
      >
        {phrase.text}
      </p>
    </div>
  );
}
