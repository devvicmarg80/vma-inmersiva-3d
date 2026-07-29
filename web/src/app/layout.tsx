import type { Metadata } from "next";
import { Roboto, Unbounded, JetBrains_Mono } from "next/font/google";
import { AdaptiveGrid } from "@/components/common/grid";
import { ReducedMotion } from "@/components/common/reduced-motion";
import { ScrollLayout } from "@/layouts/scroll-layout";
import SiteHeader from "@/components/SiteHeader";
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

export const metadata: Metadata = {
  title: "VMA · Innovación y Desarrollo",
  description:
    "VMA Grupo Empresarial de Desarrollo e Innovación Internacional S.A.S. impulsa proyectos de educación, infraestructura, tecnología y sostenibilidad en Colombia y América Latina.",
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
        </ScrollLayout>
      </body>
    </html>
  );
}
