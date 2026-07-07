import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlockPopX - Free Block Puzzle Game",
  description:
    "Play BlockPopX, a free arcade puzzle game where you pop matching balls, charge Pip Blast, avoid fouls, and beat your high score.",
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
  icons: {
    icon: "/blockpopx-mark.svg",
  },
  openGraph: {
    title: "BlockPopX - Free Block Puzzle Game",
    description:
      "Pop matching balls, charge Pip Blast, avoid fouls, and beat your high score in BlockPopX.",
    url: "https://www.blockpopx.com",
    siteName: "BlockPopX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlockPopX - Free Block Puzzle Game",
    description:
      "Play BlockPopX, a free online puzzle game. Pop matching balls, charge Pip Blast, and beat your high score.",
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
