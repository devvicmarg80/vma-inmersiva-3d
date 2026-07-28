import type { MetadataRoute } from "next";

const SITE_URL = "https://vma-inmersiva-3d.grupoempresarialvicmarg.com";

/**
 * Generates /sitemap.xml. Currently lists only the home route — add an
 * entry per public route as the site grows beyond a single page.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
