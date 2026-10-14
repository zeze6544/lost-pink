import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./jaws.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-jaws-display",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-jaws-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Jaws Fish & Chips",
    template: "%s · Jaws Fish & Chips",
  },
  description:
    "Jaws Fish & Chips, unit 2/79 Glenfern Rd, Ferntree Gully VIC 3156. Menu, hours, and links to order.",
  icons: { icon: "/jaws/mark.png" },
};

export default function JawsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${display.variable} ${sans.variable} jaws`}>{children}</div>
  );
}
