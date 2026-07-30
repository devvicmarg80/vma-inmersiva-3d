import { SectionHeading } from "@/components/sections/SectionHeading";
import { PricingSection } from "@/components/sections/PricingSection";
import { ContactoSection } from "@/components/sections/ContactoSection";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { HeroGlobeBackdrop } from "@/components/common/HeroGlobeBackdrop";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Precios · VMA",
  description:
    "Servicios de VMA para empresarios y aliados: capacitación, alianzas estratégicas y auditoría.",
  path: "/precios",
});

export default function PreciosPage() {
  return (
    <main className="bg-[var(--ink)] pt-28">
      <section className="relative flex min-h-[560px] scroll-mt-24 items-center overflow-hidden px-6 py-16 md:min-h-[640px] md:py-20">
        <HeroGlobeBackdrop />
        <div className="relative z-10 mx-auto max-w-3xl">
          <SectionHeading eyebrow="Servicios" level="h1">
            Trabaja con VMA.
          </SectionHeading>
          <p className="mt-6 max-w-2xl text-white/80">
            Tres formas concretas de trabajar con VMA, más allá de invertir
            — capacitación, alianzas estratégicas y auditoría, cada una con
            el mismo respaldo legal que ya nos distingue.
          </p>
        </div>
      </section>

      <PricingSection />

      <ContactoSection />
      <SiteFooter />
    </main>
  );
}
