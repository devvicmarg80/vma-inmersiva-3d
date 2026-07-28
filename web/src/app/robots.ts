import type { MetadataRoute } from "next";

const SITE_URL = "https://vma-inmersiva-3d.grupoempresarialvicmarg.com";

/**
 * Generates /robots.txt. Allows all crawlers and points them at the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
