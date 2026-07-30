import type { MetadataRoute } from "next";

const SITE_URL = "https://vma-inmersiva-3d.grupoempresarialvicmarg.com";

/**
 * Generates /robots.txt. Allows crawlers everywhere except the login-gated
 * portal and the API routes — neither is content to index (/portal's own
 * page metadata already sets noindex too; this is defense in depth so
 * crawlers don't even bother requesting it).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
