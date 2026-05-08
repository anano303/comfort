import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/app/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/travel/en/auth/",
        "/travel/ka/auth/",
        "/travel/en/dashboard",
        "/travel/ka/dashboard",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
