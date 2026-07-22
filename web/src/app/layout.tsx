import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
