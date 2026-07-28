"use client";

import { Inview } from "@/components/animation/springs/in-view";
import { SectionHeading } from "./SectionHeading";
import { flagshipProjects } from "@/content/company";

export function ProyectosSection() {
  return (
    <section
      id="proyectos"
      className="scroll-mt-24 bg-transparent px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <SectionHeading eyebrow="2025">
          Proyectos bandera.
        </SectionHeading>

        <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
          {flagshipProjects.map((project, i) => (
            <Inview
              key={project.name}
              tag="div"
              from={{ opacity: 0, x: i % 2 === 0 ? -90 : 90 }}
              to={{ opacity: 1, x: 0 }}
              mode="always"
              delayIn={i * 300}
              config={{ tension: 120, friction: 26 }}
              className="flex flex-col gap-2 py-8 sm:flex-row sm:items-baseline sm:gap-8"
            >
              <span className="shrink-0 font-mono text-sm text-[var(--ember)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-lg font-semibold text-white">
                  {project.name}
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {project.description}
                </p>
              </div>
            </Inview>
          ))}
        </div>
      </div>
    </section>
  );
}
