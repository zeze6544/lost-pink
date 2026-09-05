import { phraseById, type PhrasePreset } from "@/lib/phrases";

export function PhraseBackdrop({
  preset,
  variant = "stage",
  className = "",
}: {
  preset: string | PhrasePreset;
  variant?: "stage" | "site";
  className?: string;
}) {
  const p = typeof preset === "string" ? phraseById(preset) : preset;
  return (
    <div
      aria-hidden
      className={`phrase-backdrop phrase-backdrop--${variant} ${className}`}
      data-preset={p.id}
    >
      <p
        className="phrase-backdrop__text"
        style={
          {
            "--phrase-x": p.x,
            "--phrase-y": p.y,
            "--phrase-scale": p.scale,
            "--phrase-rotation": `${p.rotation}deg`,
            "--phrase-opacity": p.opacity,
            "--phrase-max": p.maxWidth,
            "--phrase-align": p.align,
          } as React.CSSProperties
        }
      >
        {p.text}
      </p>
    </div>
  );
}
