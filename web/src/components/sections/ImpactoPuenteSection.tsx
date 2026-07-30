import Link from "next/link";
import { Inview } from "@/components/animation/springs/in-view";
import { SectionHeading } from "./SectionHeading";
import { CountUpStat } from "@/components/common/CountUpStat";
import { acts } from "@/content/copy";

/**
 * Bridge between "Valores corporativos" and the contact form. Valores states
 * principles in the abstract; this section is the same measured Red Viva
 * numbers already seeded during the video hero, made to read as proof
 * rather than a repeated data dump: the description names the link to
 * Valores explicitly in words (not just layout order), and one stat is
 * pulled out as a lead figure with the rest revealed a beat after it —
 * a sentence with an emphasis, not four equal boxes. Stats pulled from
 * content/copy.ts (not restated) so the two never drift apart. Transparent
 * background, like every other post-video section — the globe stays the
 * only backdrop.
 */
export function ImpactoPuenteSection() {
  const impact = acts.find((a) => a.id === "red-viva");
  if (!impact?.stats || impact.stats.length === 0) return null;

  const [leadStat, ...supportingStats] = impact.stats;

  return (
    <section className="scroll-mt-24 bg-transparent px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Resultados en el territorio"
          align="center"
          description="Los valores de arriba no son una declaración de intenciones — así se ven aplicados en el territorio."
        >
          Esto ya lo hicimos.
        </SectionHeading>

        <dl className="mt-14 text-center">
          <Inview
            tag="div"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            mode="always"
            delayIn={150}
            config={{ tension: 190, friction: 24 }}
          >
            <dd className="font-display text-6xl font-bold text-[var(--cyan)] md:text-7xl">
              <CountUpStat value={leadStat.value} />
            </dd>
            <dt className="mt-3 text-base text-white/80">{leadStat.label}</dt>
          </Inview>

          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-8 border-t border-white/10 pt-10 sm:grid-cols-3">
            {supportingStats.map((stat, i) => (
              <Inview
                key={stat.label}
                tag="div"
                from={{ opacity: 0, y: 16 }}
                to={{ opacity: 1, y: 0 }}
                mode="always"
                delayIn={350 + i * 120}
                config={{ tension: 190, friction: 24 }}
              >
                <dd className="font-display text-2xl font-bold text-[var(--cyan)] md:text-3xl">
                  <CountUpStat value={stat.value} />
                </dd>
                <dt className="mt-2 text-sm text-white/70">{stat.label}</dt>
              </Inview>
            ))}
          </div>
        </dl>

        <Inview
          tag="div"
          from={{ opacity: 0, y: 16 }}
          to={{ opacity: 1, y: 0 }}
          mode="always"
          delayIn={700}
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
