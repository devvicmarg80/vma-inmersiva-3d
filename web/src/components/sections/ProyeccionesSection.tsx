"use client";

import { useRef } from "react";
import { StatCounter } from "./StatCounter";
import { SectionHeading } from "./SectionHeading";
import { Inview } from "@/components/animation/springs/in-view";
import { financialProjections, sdgGoals } from "@/content/company";

export function ProyeccionesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="proyecciones"
      className="scroll-mt-24 bg-transparent px-6 py-20 md:py-28"
    >
      <div ref={sectionRef} className="mx-auto max-w-5xl">
        <SectionHeading eyebrow="2025 – 2030">
          Proyecciones financieras.
        </SectionHeading>

        <dl className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {financialProjections.map((stat, i) => (
            <Inview
              key={stat.label}
              tag="div"
              from={{ opacity: 0, x: i % 2 === 0 ? -90 : 90 }}
              to={{ opacity: 1, x: 0 }}
              mode="always"
              delayIn={i * 300}
              config={{ tension: 120, friction: 26 }}
            >
              <dd className="text-4xl font-bold tabular-nums text-[var(--ember)] md:text-5xl">
                <StatCounter
                  trigger={sectionRef}
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              </dd>
              <dt className="mt-2 text-sm text-white/70">{stat.label}</dt>
            </Inview>
          ))}
        </dl>

        <div className="mt-12 border-t border-white/10 pt-8">
          <p className="text-sm uppercase tracking-[0.14em] text-white/50">
            Impacto medido en objetivos ODS
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {sdgGoals.map((goal, i) => (
              <Inview
                key={goal}
                tag="span"
                from={{ opacity: 0, scale: 0.5 }}
                to={{ opacity: 1, scale: 1 }}
                mode="always"
                delayIn={900 + i * 80}
                config={{ tension: 260, friction: 16 }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-sm font-semibold text-white"
              >
                {goal}
              </Inview>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
