import type { Metadata } from "next";

const SITE_NAME = "VMA · Innovación y Desarrollo";
const OG_IMAGE = { url: "/img/og-image.jpg", width: 1200, height: 630 };

/**
 * Every page's title/description doubles as its link-share preview.
 * Written once here instead of copy-pasted per page — Next.js doesn't
 * deep-merge a segment's `openGraph`/`twitter` object with its parent's
 * (a child that redefines `openGraph` replaces the whole object, image
 * included), so each page has to re-specify the shared image itself or
 * silently lose it when shared.
 */
export function pageMetadata({
  title,
  description,
}: {
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      locale: "es_CO",
      type: "website",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
