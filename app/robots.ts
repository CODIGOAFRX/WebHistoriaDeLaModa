import type { MetadataRoute } from "next";

const origin = "https://historiadelamoda.net";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/admin"],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
