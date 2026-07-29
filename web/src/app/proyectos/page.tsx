import {
  GraduationCap,
  HardHat,
  Wifi,
  Leaf,
  Users,
  ShieldCheck,
} from "lucide-react";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { acts } from "@/content/copy";
import { ContactoSection } from "@/components/sections/ContactoSection";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { HudCard } from "@/components/common/HudCard";
import { CountUpStat } from "@/components/common/CountUpStat";
import { HeroGlobeBackdrop } from "@/components/common/HeroGlobeBackdrop";
import { StrategicAreasList } from "@/components/common/StrategicAreasList";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Proyectos e impacto · VMA",
  description:
    "Cómo trabaja VMA — alianzas, áreas de acción y cómo medimos el impacto en Colombia y América Latina.",
});

const kpiCategories = [
  {
    label: "Impacto en educación",
    body: "Número de personas capacitadas en programas de formación.",
    icon: GraduationCap,
    image: "/img/cards/educacion.jpg",
  },
  {
    label: "Infraestructura y obras",
    body: "Proyectos ejecutados en telecomunicaciones, vías y espacios comunitarios.",
    icon: HardHat,
    image: "/img/cards/infraestructura.jpg",
  },
  {
    label: "Alcance tecnológico",
    body: "Comunidades con acceso a TIC y medios digitales.",
    icon: Wifi,
    image: "/img/cards/tecnologico.jpg",
  },
  {
    label: "Sostenibilidad ambiental",
    body: "Reducción de impacto y adopción de energías renovables.",
    icon: Leaf,
    image: "/img/cards/sostenibilidad-ambiental.jpg",
  },
  {
    label: "Participación comunitaria",
    body: "Líderes formados y programas de empoderamiento.",
    icon: Users,
    image: "/img/cards/participacion.jpg",
  },
  {
    label: "Transparencia y auditoría",
    body: "Evaluación del uso de recursos y efectividad de los programas.",
    icon: ShieldCheck,
    image: "/img/cards/auditoria.jpg",
  },
];

export default function ProyectosPage() {
  const impact = acts.find((a) => a.id === "red-viva");

  return (
    <main className="bg-[var(--ink)] pt-28">
      <section className="relative flex min-h-[560px] scroll-mt-24 items-center overflow-hidden px-6 py-16 md:min-h-[640px] md:py-20">
        <HeroGlobeBackdrop />
        <div className="relative z-10 mx-auto max-w-3xl">
          <SectionHeading eyebrow="Proyectos e impacto" level="h1">
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
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--cyan)]">
            Áreas de acción
          </p>
          <StrategicAreasList className="mt-6" />
        </div>
      </section>

      {impact?.stats && (
        <section className="scroll-mt-24 px-6 py-16 md:py-20">
          <div className="mx-auto max-w-5xl">
            <SectionHeading eyebrow="2025">El impacto, medido.</SectionHeading>
            <dl className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-4">
              {impact.stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="font-display text-3xl font-bold text-[var(--cyan)] md:text-4xl">
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
                icon={<kpi.icon size={28} strokeWidth={2.5} />}
                image={kpi.image}
                title={kpi.label}
                body={kpi.body}
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
