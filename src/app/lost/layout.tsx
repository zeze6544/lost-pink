import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Fraunces,
  Great_Vibes,
  IBM_Plex_Mono,
  Instrument_Serif,
  Newsreader,
  Outfit,
  Playfair_Display,
} from "next/font/google";
import { LostBaseProvider } from "@/components/LostBridge";
import { currentLostBase } from "@/lib/lost-nav";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const plex = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const vibes = Great_Vibes({
  variable: "--font-vibes",
  subsets: ["latin"],
  weight: "400",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

const fontVars = [
  fraunces.variable,
  playfair.variable,
  cormorant.variable,
  instrument.variable,
  outfit.variable,
  plex.variable,
  vibes.variable,
  newsreader.variable,
].join(" ");

export const metadata: Metadata = {
  title: {
    default: "lost.pink",
    template: "%s · lost.pink",
  },
  description: "An inbox you keep. A page you can leave.",
  openGraph: {
    title: "lost.pink",
    description: "An inbox you keep. A page you can leave.",
    siteName: "lost.pink",
    type: "website",
  },
};

export default async function LostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const base = await currentLostBase();
  return (
    <div className={`${fontVars} lost-app`}>
      <LostBaseProvider base={base}>{children}</LostBaseProvider>
    </div>
  );
}
