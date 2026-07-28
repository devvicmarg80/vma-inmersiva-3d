"use client";

import { Inview } from "@/components/animation/springs/in-view";
import { SectionHeading } from "./SectionHeading";
import { governanceCommittees } from "@/content/company";

export function GobiernoSection() {
  return (
    <section
      id="gobierno"
      className="scroll-mt-24 bg-transparent px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Transparencia"
          description="Cada decisión de inversión pasa por comités de apoyo dedicados — informes trimestrales y salidas pactadas, no promesas verbales."
        >
          Gobierno corporativo.
        </SectionHeading>

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {governanceCommittees.map((committee, i) => (
            <Inview
              key={committee}
              tag="li"
              from={{ opacity: 0, x: i % 2 === 0 ? -90 : 90 }}
              to={{ opacity: 1, x: 0 }}
              mode="always"
              delayIn={i * 300}
              config={{ tension: 120, friction: 26 }}
              className="rounded-lg border border-[var(--rule)] bg-[var(--paper-raised)] p-6 text-sm font-semibold text-[var(--ink)]"
            >
              {committee}
            </Inview>
          ))}
        </ul>
      </div>
    </section>
  );
}
