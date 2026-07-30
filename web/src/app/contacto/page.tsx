import { ContactoSection } from "@/components/sections/ContactoSection";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { HeroGlobeBackdrop } from "@/components/common/HeroGlobeBackdrop";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Contacto · VMA",
  description:
    "Escríbenos si buscas invertir en VMA o convertirte en aliado estratégico.",
  path: "/contacto",
});

export default function ContactoPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-[var(--ink)] pt-28">
      <div className="relative flex-1 overflow-hidden">
        <HeroGlobeBackdrop />
        <div className="relative z-10">
          <ContactoSection headingLevel="h1" />
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
