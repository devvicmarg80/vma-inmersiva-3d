import { SectionHeading } from "./SectionHeading";
import { coreValues } from "@/content/company";
import { HudCard } from "@/components/common/HudCard";

export function ValoresSection() {
  return (
    <section
      id="valores"
      className="scroll-mt-24 bg-transparent px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Cómo trabajamos"
          description="Siete principios que guían cada proyecto, de la formulación a la ejecución."
        >
          Valores corporativos.
        </SectionHeading>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
  );
}
