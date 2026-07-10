import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BlockPopX - Free Online Block Puzzle Game",
    short_name: "BlockPopX",
    id: "/play",
    description:
      "Play BlockPopX free online. Pop matching balls, solve puzzle missions, charge Pip Blast, and chase your high score.",
    start_url: "/play",
    scope: "/",
    display: "standalone",
    display_override: ["fullscreen", "standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#020617",
    theme_color: "#06b6d4",
    categories: ["games", "entertainment", "puzzle"],
    icons: [
      {
        src: "/blockpopx-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/blockpopx-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/blockpopx-logo.png",
        sizes: "1200x675",
        type: "image/png",
        form_factor: "wide",
        label: "BlockPopX preview",
      },
      {
        src: "/blockpopx-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        form_factor: "narrow",
        label: "BlockPopX mobile icon",
      },
    ],
  };
}
