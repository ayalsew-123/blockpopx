import type { Metadata } from "next";
import { SeoGamePage } from "../seo-game-page";

export const metadata: Metadata = {
  title: "Block Puzzle Game",
  description:
    "Play BlockPopX, a free block puzzle game with matching balls, color goals, level progression, fouls, and mobile-friendly browser play.",
  alternates: {
    canonical: "/block-puzzle-game",
  },
};

export default function BlockPuzzleGamePage() {
  return (
    <SeoGamePage
      eyebrow="Block Puzzle Game"
      title="Free Online Block Puzzle Game"
      description="BlockPopX turns classic block puzzle play into a colorful ball-clearing challenge with goals, levels, and satisfying pop moments."
      sections={[
        {
          title: "Match Blocks",
          body: "Find connected balls of the same color, tap to clear them, and leave open spaces until the next wave drops from the top.",
        },
        {
          title: "Beat Each Level",
          body: "Score points and finish color goals while avoiding fouls. Each level adds a new idea so the game stays understandable.",
        },
        {
          title: "Play Anywhere",
          body: "The game runs in modern browsers on mobile, tablet, and desktop with no account required to start playing.",
        },
      ]}
    />
  );
}
