import Link from "next/link";
import { Inview } from "@/components/animation/springs/in-view";
import { SectionHeading } from "./SectionHeading";
import { CountUpStat } from "@/components/common/CountUpStat";
import { acts } from "@/content/copy";

/**
 * Bridge between "Valores corporativos" and the contact form — the story
 * so far has been principles (Valores); this section is proof before the
 * ask, the same measured Red Viva numbers already seeded during the video
 * hero, reinforced right before the CTA instead of only appearing once,
 * early, during scroll-jacking. Stats pulled from content/copy.ts (not
 * restated) so the two never drift apart. Transparent background, like
 * every other post-video section — the globe stays the only backdrop.
 */
export function ImpactoPuenteSection() {
  const impact = acts.find((a) => a.id === "red-viva");
  if (!impact?.stats) return null;

  return (
    <section className="scroll-mt-24 bg-transparent px-6 py-20 md:py-28">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Resultados en el territorio"
          align="center"
          description="Los mismos frentes de trabajo, ya ejecutados — no una proyección."
        >
          Esto ya lo hicimos.
        </SectionHeading>

        <dl className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {impact.stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <dd className="font-display text-3xl font-bold text-[var(--cyan)] md:text-4xl">
                <CountUpStat value={stat.value} />
              </dd>
              <dt className="mt-2 text-sm text-white/70">{stat.label}</dt>
            </div>
          ))}
        </dl>

        <Inview
          tag="div"
          from={{ opacity: 0, y: 16 }}
          to={{ opacity: 1, y: 0 }}
          mode="always"
          delayIn={200}
          config={{ tension: 190, friction: 24 }}
          className="mt-12 text-center"
        >
          <Link
            href="/proyectos"
            className="text-sm font-semibold text-[var(--cyan)] underline underline-offset-4"
          >
            Ver todos los proyectos →
          </Link>
        </Inview>
      </div>
    </section>
  );
}
