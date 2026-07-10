import type { Metadata } from "next";
import { Analytics } from "./analytics";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BlockPopX - Free Online Block Puzzle Game",
    template: "%s | BlockPopX",
  },
  description:
    "Play BlockPopX free online. Pop matching balls on a 10x10 board, solve tricky puzzle missions, charge Pip Blast, avoid fouls, and chase a new high score.",
  keywords: [
    "BlockPopX",
    "Block Pop X",
    "block puzzle game",
    "free puzzle game",
    "free block puzzle game",
    "online block game",
    "matching blocks game",
    "free online puzzle game",
    "pop blocks game",
    "browser puzzle game",
    "mobile puzzle game",
    "Pip Blast",
  ],
  applicationName: "BlockPopX",
  authors: [{ name: "BlockPopX" }],
  creator: "BlockPopX",
  publisher: "BlockPopX",
  category: "game",
  metadataBase: new URL("https://www.blockpopx.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/blockpopx-mark.svg",
    apple: "/blockpopx-icon-512.png",
  },
  appleWebApp: {
    capable: true,
    title: "BlockPopX",
    statusBarStyle: "black-translucent",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "BlockPopX - Free Online Block Puzzle Game",
    description:
      "Pop matching balls, solve tricky puzzle missions, charge Pip Blast, avoid fouls, and beat your high score in BlockPopX.",
    url: "https://www.blockpopx.com",
    siteName: "BlockPopX",
    images: [
      {
        url: "/blockpopx-logo.png",
        width: 1200,
        height: 675,
        alt: "BlockPopX free online block puzzle game logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlockPopX - Free Online Block Puzzle Game",
    description:
      "Play BlockPopX free online. Pop matching balls, solve puzzle missions, charge Pip Blast, and beat your high score.",
    images: ["/blockpopx-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
