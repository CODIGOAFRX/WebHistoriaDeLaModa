import type { MetadataRoute } from "next";

const origin = "https://historiadelamoda.net";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/podcasts",
    "/conferencias",
    "/escuela",
    "/archivo",
    "/biblioteca",
    "/contacto",
  ];

  return paths.map((path, index) => ({
    url: `${origin}${path}`,
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.7,
  }));
}
