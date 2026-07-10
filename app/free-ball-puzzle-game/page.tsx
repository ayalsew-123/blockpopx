import type { Metadata } from "next";
import { SeoGamePage } from "../seo-game-page";

export const metadata: Metadata = {
  title: "Free Ball Puzzle Game",
  description:
    "Play BlockPopX, a free ball puzzle game with matching colors, smart levels, fouls, pips, locks, and mobile-friendly browser play.",
  alternates: {
    canonical: "/free-ball-puzzle-game",
  },
};

export default function FreeBallPuzzleGamePage() {
  return (
    <SeoGamePage
      eyebrow="Free Ball Puzzle Game"
      title="Play a Free Ball Puzzle Game Online"
      description="BlockPopX is a free ball puzzle game where you pop matching colors, clear level goals, and keep your run alive without installing anything."
      sections={[
        {
          title: "Easy Start",
          body: "The first level focuses on one clear rule: tap two or more same-color balls. More tools unlock after players understand the basics.",
        },
        {
          title: "Smart Challenge",
          body: "Later levels add Mix, gravity, locks, pips, prizes, and trickier board patterns so each run asks for better planning.",
        },
        {
          title: "Mobile Ready",
          body: "BlockPopX works in a phone browser and can be installed to the home screen as a web app.",
        },
      ]}
    />
  );
}
