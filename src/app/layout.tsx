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
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: "lost.pink",
    template: "%s · lost.pink",
  },
  description: "A shrine you gift. Type a name. Dress it. Send it.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  openGraph: {
    title: "lost.pink",
    description: "A shrine you gift. Type a name. Dress it. Send it.",
    siteName: "lost.pink",
    type: "website",
  },
};

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontVars} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
