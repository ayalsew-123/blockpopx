import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlockPopX - Free Block Puzzle Game",
  description:
    "Play BlockPopX, a free block puzzle game where you tap matching blocks, score points, use your moves wisely, and beat your high score.",
  keywords: [
    "BlockPopX",
    "block puzzle game",
    "free puzzle game",
    "online block game",
    "matching blocks game",
    "free online puzzle game",
  ],
  authors: [{ name: "BlockPopX" }],
  creator: "BlockPopX",
  publisher: "BlockPopX",
  metadataBase: new URL("https://www.blockpopx.com"),
  openGraph: {
    title: "BlockPopX - Free Block Puzzle Game",
    description:
      "Tap matching blocks, score points, and beat your high score in BlockPopX.",
    url: "https://www.blockpopx.com",
    siteName: "BlockPopX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlockPopX - Free Block Puzzle Game",
    description:
      "Play BlockPopX, a free online block puzzle game. Tap matching blocks and beat your high score.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}