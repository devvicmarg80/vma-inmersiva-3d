import type { Metadata } from "next";
import { ContactoSection } from "@/components/sections/ContactoSection";
import { SiteFooter } from "@/components/sections/SiteFooter";

export const metadata: Metadata = {
  title: "Contacto · VMA",
  description:
    "Escríbenos si buscas invertir en VMA o convertirte en aliado estratégico.",
};

export default function ContactoPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-[var(--ink)] pt-28">
      <div className="flex-1">
        <ContactoSection />
      </div>
      <SiteFooter />
    </main>
  );
}
