"use client";

import { Inview } from "@/components/animation/springs/in-view";
import { SectionHeading } from "./SectionHeading";
import { filiales } from "@/content/company";

export function FilialesSection() {
  return (
    <section
      id="filiales"
      className="scroll-mt-24 bg-transparent px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Estructura"
          description="VMA Global Capital Holding opera a través de seis filiales, cada una responsable de un frente distinto de la misma misión."
        >
          Un ecosistema, seis filiales.
        </SectionHeading>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filiales.map((filial, i) => (
            <Inview
              key={filial.name}
              tag="div"
              from={{ opacity: 0, x: i % 2 === 0 ? -90 : 90 }}
              to={{ opacity: 1, x: 0 }}
              mode="always"
              delayIn={i * 300}
              config={{ tension: 120, friction: 26 }}
              className="rounded-lg border border-[var(--rule)] bg-[var(--paper-raised)] p-6"
            >
              <p className="text-base font-semibold text-[var(--ink)]">
                {filial.name}
              </p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                {filial.focus}
              </p>
            </Inview>
          ))}
        </div>
      </div>
    </section>
  );
}
