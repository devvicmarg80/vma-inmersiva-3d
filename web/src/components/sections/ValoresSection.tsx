"use client";

import { Inview } from "@/components/animation/springs/in-view";
import { SectionHeading } from "./SectionHeading";
import { coreValues } from "@/content/company";

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
            <Inview
              key={value.title}
              tag="div"
              from={{ opacity: 0, x: -90 }}
              to={{ opacity: 1, x: 0 }}
              mode="always"
              delayIn={i * 150}
              config={{ tension: 120, friction: 26 }}
              className="rounded-lg border border-[var(--rule)] bg-[var(--paper-raised)] p-6"
            >
              <p className="text-base font-semibold text-[var(--ink)]">
                {value.title}
              </p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                {value.body}
              </p>
            </Inview>
          ))}
        </div>
      </div>
    </section>
  );
}
