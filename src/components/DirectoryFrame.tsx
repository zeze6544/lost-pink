import { Instrument_Serif, Outfit, Source_Serif_4 } from "next/font/google";
import "./studio.css";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-studio-display",
});

const text = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-studio-text",
});

const sans = Outfit({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-studio-sans",
});

export function DirectoryFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${text.variable} ${sans.variable} studio`}>
      <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        {children}
      </div>
    </div>
  );
}

export function StudioMark() {
  return (
    <svg className="studio-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="4" width="16" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="8" width="16" height="20" fill="var(--paper)" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
