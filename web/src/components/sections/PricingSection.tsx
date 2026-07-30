import { SectionHeading } from "./SectionHeading";
import { PricingCard } from "@/components/common/PricingCard";
import { pricingServices } from "@/content/pricing";

export function PricingSection() {
  return (
    <section className="scroll-mt-24 bg-transparent px-6 py-12 md:py-16">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Servicios"
          description="Tres formas concretas de trabajar con VMA — no solo invertir, también capacitarte, aliarte o auditar."
        >
          Precios.
        </SectionHeading>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pricingServices.map(({ icon: Icon, ...service }, i) => (
            <PricingCard
              key={service.id}
              service={service}
              icon={<Icon size={30} strokeWidth={2} />}
              delay={i * 80}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
