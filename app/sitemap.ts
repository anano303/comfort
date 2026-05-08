import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/app/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/travel/en"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          "en-US": absoluteUrl("/travel/en"),
          "ka-GE": absoluteUrl("/travel/ka"),
          "x-default": absoluteUrl("/travel/en"),
        },
      },
    },
    {
      url: absoluteUrl("/travel/ka"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: {
          "en-US": absoluteUrl("/travel/en"),
          "ka-GE": absoluteUrl("/travel/ka"),
          "x-default": absoluteUrl("/travel/en"),
        },
      },
    },
  ];
}
