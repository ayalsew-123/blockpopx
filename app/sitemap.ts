import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.blockpopx.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.blockpopx.com/play",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://www.blockpopx.com/how-to-play",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.blockpopx.com/free-ball-puzzle-game",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: "https://www.blockpopx.com/smart-puzzle-game",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: "https://www.blockpopx.com/block-puzzle-game",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: "https://www.blockpopx.com/privacy",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://www.blockpopx.com/terms",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.45,
    },
    {
      url: "https://www.blockpopx.com/contact",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.45,
    },
  ];
}
