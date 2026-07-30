import type { MetadataRoute } from "next";

const SITE_URL = "https://vma-inmersiva-3d.grupoempresarialvicmarg.com";

// Public, indexable routes only — /portal is login-gated (its own metadata
// already sets robots: noindex) and /api/* isn't a page. Add an entry here
// whenever a new public route/page is created.
const ROUTES = ["", "/nosotros", "/proyectos", "/precios", "/contacto"];

/** Generates /sitemap.xml. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
