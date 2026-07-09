import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Play BlockPopX Free - Online Matching Puzzle Game",
  description:
    "Play BlockPopX free online. Match balls, clear 12 puzzle missions, charge Pip Blast, unlock prizes, avoid fouls, and chase a high score.",
  alternates: {
    canonical: "/play",
  },
  openGraph: {
    title: "Play BlockPopX Free - Online Matching Puzzle Game",
    description:
      "Start BlockPopX in your browser and play a free matching puzzle game with missions, prizes, pips, locks, and Pip Blast.",
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
