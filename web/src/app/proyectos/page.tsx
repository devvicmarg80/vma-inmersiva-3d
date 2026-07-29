import type { Metadata } from "next";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { strategicAreas } from "@/content/company";
import { acts } from "@/content/copy";
import { ContactoSection } from "@/components/sections/ContactoSection";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { HudCard } from "@/components/common/HudCard";
import { CountUpStat } from "@/components/common/CountUpStat";

export const metadata: Metadata = {
  title: "Proyectos e impacto · VMA",
  description:
    "Cómo trabaja VMA — alianzas, áreas de acción y cómo medimos el impacto en Colombia y América Latina.",
};

const kpiCategories = [
  {
    label: "Impacto en educación",
    body: "Número de personas capacitadas en programas de formación.",
  },
  {
    label: "Infraestructura y obras",
    body: "Proyectos ejecutados en telecomunicaciones, vías y espacios comunitarios.",
  },
  {
    label: "Alcance tecnológico",
    body: "Comunidades con acceso a TIC y medios digitales.",
  },
  {
    label: "Sostenibilidad ambiental",
    body: "Reducción de impacto y adopción de energías renovables.",
  },
  {
    label: "Participación comunitaria",
    body: "Líderes formados y programas de empoderamiento.",
  },
  {
    label: "Transparencia y auditoría",
    body: "Evaluación del uso de recursos y efectividad de los programas.",
  },
];

export default function ProyectosPage() {
  const impact = acts.find((a) => a.id === "red-viva");

  return (
    <main className="bg-[var(--ink)] pt-28">
      <section className="scroll-mt-24 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="Proyectos e impacto">
            De la alianza a la ejecución.
          </SectionHeading>
          <p className="mt-6 max-w-2xl text-white/80">
            VMA opera mediante alianzas estratégicas con gobiernos, empresas
            privadas y organizaciones sociales — asegurando que cada
            proyecto esté alineado con principios de responsabilidad
            social, no solo con un objetivo comercial.
          </p>
        </div>
      </section>

      <section className="scroll-mt-24 px-6 py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--ember)]">
            Áreas de acción
          </p>
          <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {strategicAreas.map((area, i) => (
              <div
                key={area.label}
                className="flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:gap-8"
              >
                <span className="shrink-0 font-mono text-sm text-[var(--ember)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-base font-semibold text-white">
                    {area.label}
                  </p>
                  <p className="mt-1 text-sm text-white/70">{area.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {impact?.stats && (
        <section className="scroll-mt-24 px-6 py-16 md:py-20">
          <div className="mx-auto max-w-5xl">
            <SectionHeading eyebrow="2025">El impacto, medido.</SectionHeading>
            <dl className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-4">
              {impact.stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="font-display text-3xl font-bold text-[var(--ember)] md:text-4xl">
                    <CountUpStat value={stat.value} />
                  </dd>
                  <dt className="mt-2 text-sm text-white/70">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      <section className="scroll-mt-24 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading eyebrow="Rendición de cuentas">
            Cómo medimos el impacto.
          </SectionHeading>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kpiCategories.map((kpi, i) => (
              <HudCard
                key={kpi.label}
                index={String(i + 1).padStart(2, "0")}
                title={kpi.label}
                body={kpi.body}
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
