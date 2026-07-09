import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Play BlockPopX Free - Falling Ball Puzzle Game",
  description:
    "Play BlockPopX free online. Clear hundreds of falling balls, solve puzzle modes, charge Pip Blast, unlock prizes, and stop the pile from reaching the bottom.",
  alternates: {
    canonical: "/play",
  },
  openGraph: {
    title: "Play BlockPopX Free - Falling Ball Puzzle Game",
    description:
      "Start BlockPopX in your browser and clear falling ball waves with missions, prizes, pips, locks, rockets, and Pip Blast.",
    url: "https://www.blockpopx.com/play",
    images: [
      {
        url: "/blockpopx-logo.png",
        width: 1200,
        height: 675,
        alt: "Play BlockPopX free online",
      },
    ],
  },
};

export default function PlayLayout({ children }: { children: ReactNode }) {
  return children;
}
