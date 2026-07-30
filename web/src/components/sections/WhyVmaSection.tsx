import { whyVma } from "@/content/company";
import { SectionHeading } from "./SectionHeading";
import { Inview } from "@/components/animation/springs/in-view";

/**
 * The argument, not the principles — comes right after the video hero and
 * before "Valores corporativos": Valores says what VMA believes, this says
 * why that translates into lower risk for whoever partners with it. Three
 * structural facts (not values), each grounded in the SAS's constituted
 * objeto social — see content/company.ts's `whyVma` for sourcing.
 */
export function WhyVmaSection() {
  return (
    <section className="scroll-mt-24 bg-transparent px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Por qué VMA"
          description="La ejecución y la transparencia no son un discurso — están en la razón de ser legal de VMA, no solo en sus valores declarados."
        >
          No es una promesa. Es un mandato.
        </SectionHeading>

        <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
          {whyVma.map((item, i) => (
            <Inview
              key={item.title}
              tag="div"
              mode="once"
              from={{ opacity: 0, x: -40 }}
              to={{ opacity: 1, x: 0 }}
              config={{ tension: 190, friction: 24 }}
              delayIn={i * 120}
              className="flex flex-col gap-4 py-8 sm:flex-row sm:items-start"
            >
              <item.icon
                size={28}
                strokeWidth={2}
                className="shrink-0 text-[var(--cyan)]"
              />
              <div>
                <p className="text-lg font-semibold text-white">{item.title}</p>
                <p className="mt-2 max-w-xl text-white/70">{item.body}</p>
              </div>
            </Inview>
          ))}
        </div>
      </div>
    </section>
  );
}
