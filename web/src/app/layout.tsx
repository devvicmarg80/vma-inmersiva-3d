import type { Metadata } from "next";
import { Roboto, Unbounded, JetBrains_Mono } from "next/font/google";
import { AdaptiveGrid } from "@/components/common/grid";
import { ReducedMotion } from "@/components/common/reduced-motion";
import { ScrollLayout } from "@/layouts/scroll-layout";
import SiteHeader from "@/components/SiteHeader";
import { CookieNotice } from "@/components/common/CookieNotice";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
});

// Titulares: geométrica y expresiva — trazo técnico/orbital que combina con
// el lenguaje visual del globo y las secciones cósmicas — ver --display en
// globals.css. Solo peso 700: es el único que se usa (h1-h3 y font-bold en
// globals.css/proyectos) — pedir más pesos solo infla el preload de fuentes.
const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-unbounded",
});

// Voz "de datos": eyebrows, índices numerados, cifras de impacto — ver
// --mono en globals.css. Solo peso 400: ningún uso actual pide semibold/bold
// en mono.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-jetbrains-mono",
});

const title = "VMA · Innovación y Desarrollo";
const description =
  "VMA Grupo Empresarial de Desarrollo e Innovación Internacional S.A.S. impulsa proyectos de educación, infraestructura, tecnología y sostenibilidad en Colombia y América Latina.";

export const metadata: Metadata = {
  // Without this, Next.js can't resolve the openGraph image below (or any
  // page's) into an absolute URL — link previews on WhatsApp/LinkedIn
  // silently show no image instead of erroring, which is why this was easy
  // to miss.
  metadataBase: new URL("https://vma-inmersiva-3d.grupoempresarialvicmarg.com"),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    siteName: "VMA · Innovación y Desarrollo",
    locale: "es_CO",
    type: "website",
    images: [{ url: "/img/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/img/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`h-full antialiased ${roboto.variable} ${unbounded.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full">
        <ScrollLayout>
          <AdaptiveGrid />
          <ReducedMotion />
          <SiteHeader />
          {children}
          <CookieNotice />
        </ScrollLayout>
      </body>
    </html>
  );
}
