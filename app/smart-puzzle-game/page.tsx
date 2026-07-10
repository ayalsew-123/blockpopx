import type { Metadata } from "next";
import { SeoGamePage } from "../seo-game-page";

export const metadata: Metadata = {
  title: "Smart Puzzle Game",
  description:
    "BlockPopX is a smart puzzle game where players plan color pops, avoid fouls, use Mix and gravity, and solve increasingly tricky boards.",
  alternates: {
    canonical: "/smart-puzzle-game",
  },
};

export default function SmartPuzzleGamePage() {
  return (
    <SeoGamePage
      eyebrow="Smart Puzzle Game"
      title="A Smart Puzzle Game for Quick Breaks"
      description="BlockPopX is simple to start, then becomes a smarter puzzle as players plan group clears, protect open space, and choose the right tool at the right time."
      sections={[
        {
          title: "Think Before Tapping",
          body: "Small groups are easy, but bigger clears and cleaner runs create better scores. The best move is often the one that opens the next move.",
        },
        {
          title: "Clear Goals",
          body: "Every level has color goals and a score target. Players must balance fast popping with careful planning to avoid fouls.",
        },
        {
          title: "Growing Difficulty",
          body: "BlockPopX introduces features slowly, then combines them into richer puzzles with locks, pips, gravity, and rewards.",
        },
      ]}
    />
  );
}
