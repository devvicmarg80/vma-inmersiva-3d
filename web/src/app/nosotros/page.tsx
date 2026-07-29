import { Target, Compass, Eye } from "lucide-react";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { identity, coreValues } from "@/content/company";
import { ContactoSection } from "@/components/sections/ContactoSection";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { HudCard } from "@/components/common/HudCard";
import { HeroGlobeBackdrop } from "@/components/common/HeroGlobeBackdrop";
import { StrategicAreasList } from "@/components/common/StrategicAreasList";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Nosotros · VMA",
  description:
    "Misión, visión y valores de VMA Grupo Empresarial de Desarrollo e Innovación S.A.S.",
});

export default function NosotrosPage() {
  return (
    <main className="bg-[var(--ink)] pt-28">
      <section className="relative flex min-h-[560px] scroll-mt-24 items-center overflow-hidden px-6 py-16 md:min-h-[640px] md:py-20">
        <HeroGlobeBackdrop />
        <div className="relative z-10 mx-auto max-w-3xl">
          <SectionHeading eyebrow="Quiénes somos" level="h1">
            Desarrollo con propósito.
          </SectionHeading>
          <p className="mt-6 max-w-2xl text-white/80">
            VMA Grupo Empresarial de Desarrollo e Innovación Internacional
            S.A.S. es una organización comprometida con la transformación
            social a través de la educación, la infraestructura, la
            innovación tecnológica y la sostenibilidad — mejorando la
            calidad de vida de comunidades en Colombia y América Latina.
          </p>
        </div>
      </section>

      <section className="scroll-mt-24 px-6 py-12 md:py-16">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
          <HudCard
            index="01"
            icon={<Target size={28} strokeWidth={2.5} />}
            image="/img/cards/proposito.jpg"
            title="Propósito superior"
            body={identity.proposito}
          />
          <HudCard
            index="02"
            icon={<Compass size={28} strokeWidth={2.5} />}
            image="/img/cards/mision.jpg"
            title="Misión"
            body={identity.mision}
            delay={80}
          />
          <HudCard
            index="03"
            icon={<Eye size={28} strokeWidth={2.5} />}
            image="/img/cards/vision.jpg"
            title="Visión"
            body={identity.vision}
            delay={160}
          />
        </div>
      </section>

      <section className="scroll-mt-24 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading eyebrow="Cómo trabajamos">
            Cinco frentes, un mismo territorio.
          </SectionHeading>
          <StrategicAreasList />
        </div>
      </section>

      <section className="scroll-mt-24 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading eyebrow="Cómo lo hacemos">
            Valores corporativos.
          </SectionHeading>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coreValues.map((value, i) => (
              <HudCard
                key={value.title}
                index={String(i + 1).padStart(2, "0")}
                icon={<value.icon size={28} strokeWidth={2.5} />}
                image={value.image}
                title={value.title}
                body={value.body}
                delay={i * 80}
              />
            ))}
          </div>
        </div>
      </section>

      <ContactoSection />
      <SiteFooter />
    </main>
  );
}
