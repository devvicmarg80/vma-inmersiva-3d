import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "VMA · Innovación y Desarrollo",
  description:
    "VMA canaliza capital global hacia proyectos de educación, infraestructura, tecnología y sostenibilidad en Colombia y América Latina.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`h-full antialiased ${roboto.variable}`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
