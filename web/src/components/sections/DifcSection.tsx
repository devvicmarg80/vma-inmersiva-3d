"use client";

import { useRef } from "react";
import { Inview } from "@/components/animation/springs/in-view";
import { Hover } from "@/components/animation/springs/hover";
import { SectionHeading } from "./SectionHeading";
import { difcAdvantages } from "@/content/company";

function AdvantageCard({
  title,
  body,
  delay,
  fromLeft,
}: {
  title: string;
  body: string;
  delay: number;
  fromLeft: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <Inview
      tag="div"
      from={{ opacity: 0, x: fromLeft ? -90 : 90 }}
      to={{ opacity: 1, x: 0 }}
      mode="always"
      delayIn={delay}
      config={{ tension: 120, friction: 26 }}
    >
      <div
        ref={cardRef}
        className="rounded-lg border border-[var(--rule)] bg-[var(--paper-raised)] p-6"
      >
        <Hover
          tag="div"
          trigger={cardRef}
          from={{ x: 0 }}
          to={{ x: 6 }}
          config={{ tension: 300, friction: 22 }}
        >
          <p className="text-base font-semibold text-[var(--ink)]">{title}</p>
        </Hover>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{body}</p>
      </div>
    </Inview>
  );
}

export function DifcSection() {
  return (
    <section
      id="difc"
      className="scroll-mt-24 bg-transparent px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="DIFC · Dubái"
          description="VMA Global Capital Holding opera desde el Dubai International Financial Centre — un marco regulatorio diseñado para inversión institucional transfronteriza."
        >
          Por qué Dubái.
        </SectionHeading>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {difcAdvantages.map((adv, i) => (
            <AdvantageCard
              key={adv.title}
              title={adv.title}
              body={adv.body}
              delay={i * 300}
              fromLeft={i % 2 === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
