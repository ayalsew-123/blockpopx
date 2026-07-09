import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BlockPopX - Free Online Block Puzzle Game",
    short_name: "BlockPopX",
    description:
      "Play BlockPopX free online. Pop matching balls, solve puzzle missions, charge Pip Blast, and chase your high score.",
    start_url: "/play",
    scope: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#06b6d4",
    icons: [
      {
        src: "/blockpopx-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
