"use client";

import { useEffect, useRef, useState } from "react";
import PhotoGlobe from "@/components/PhotoGlobe";
import { NarrativeTransition } from "@/components/common/NarrativeTransition";
import { WhyVmaSection } from "./WhyVmaSection";
import { ValoresSection } from "./ValoresSection";
import { ImpactoPuenteSection } from "./ImpactoPuenteSection";
import { ContactoSection } from "./ContactoSection";
import { SiteFooter } from "./SiteFooter";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Height of the caption spacer at the top, in dvh. Must be >= 100: the
// overlay content below is pulled up by exactly one viewport height
// (`marginTop: -100dvh`) to sit flush with the sticky globe's top, so a
// spacer shorter than one viewport can never fully occupy the viewport on
// its own — the next section's top edge would already be poking into view
// from the very start.
const SCRUB_VH = 100;

/**
 * Everything after the scroll-video story (`ScrollExperience`): a photoreal,
 * hand-rendered Earth (`PhotoGlobe`) that spins on its own and stays pinned
 * as a backdrop while the business sections scroll over it as translucent
 * glass panels — the footer is the final, fully-opaque panel that closes it
 * out. Unlike the Earth_Orbit.mp4 clip this replaced, the globe's own
 * position/scale keeps changing across the *whole* section (see
 * `progress` below), not just the first viewport — it grows to dominate
 * Valores, then shrinks aside for Contacto, instead of freezing on one frame.
 *
 * Built with the animation architecture ported from next16-claude-starter
 * (Lenis smooth scroll, react-spring, spring-text-engine, the adaptive grid)
 * — see src/lib, src/hooks/animation, src/components/animation/springs.
 */
export function PostVideoSections() {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeProgressRef = useRef(0);
  const glowBoostRef = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let raf = 0;
    let dirty = true;
    const onScroll = () => {
      dirty = true;
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!dirty) return;

      const container = containerRef.current;
      if (!container) {
        dirty = false;
        return;
      }

      // Progress across the *entire* section (not just one viewport) — this
      // is what lets the globe grow behind Valores and shrink aside for
      // Contacto instead of freezing after the first 100dvh.
      const totalScrollable = container.offsetHeight - window.innerHeight;
      const top = container.getBoundingClientRect().top;
      globeProgressRef.current = totalScrollable > 0 ? clamp(-top / totalScrollable, 0, 1) : 0;
      dirty = false;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      <>
        <section
          className="relative flex h-dvh flex-col items-center justify-center gap-6 overflow-hidden bg-[var(--ink)] px-6"
          style={{
            backgroundImage:
              "linear-gradient(rgba(11,26,46,0.35), rgba(11,26,46,0.7)), url(/img/earth-day.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <p
            className="font-display max-w-4xl text-balance text-center font-bold uppercase tracking-[0.08em]"
            style={{
              fontSize: "clamp(2.25rem, 6vw, 4.5rem)",
              background: "var(--gradient-hero)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter:
                "drop-shadow(0 2px 18px rgba(8,17,31,0.55)) drop-shadow(0 0 44px rgba(34,211,238,0.3))",
            }}
          >
            Del origen a la ejecución
          </p>
          <p className="font-display max-w-xl text-balance text-center text-2xl font-bold text-white md:text-4xl">
            Cada proyecto comienza con un propósito.
          </p>
          <p
            className="max-w-xl text-balance text-center font-medium text-white/85 italic"
            style={{ fontSize: "clamp(0.95rem, 2.2vw, 1.375rem)" }}
          >
            “La educación es el arma más poderosa que puedes usar para
            cambiar el mundo.”
          </p>
          <p
            className="text-center text-white/50 uppercase tracking-[0.14em]"
            style={{ fontSize: "clamp(0.7rem, 1.4vw, 0.875rem)" }}
          >
            — Nelson Mandela
          </p>
        </section>
        <WhyVmaSection />
        <ValoresSection />
        <ImpactoPuenteSection />
        <ContactoSection />
        <SiteFooter />
      </>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="sticky top-0 z-0 h-dvh w-full overflow-hidden bg-[var(--ink)]">
        <PhotoGlobe progressRef={globeProgressRef} glowBoostRef={glowBoostRef} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            // Mirror of ScrollExperience's widened-but-translucent bottom
            // fade — a diffused band at the top to soften the handoff,
            // capped well short of solid black so it doesn't dim the globe's
            // normal viewing time.
            background:
              "linear-gradient(180deg, rgba(11,26,46,0.5) 0%, rgba(11,26,46,0.2) 30%, rgba(11,26,46,0.1) 50%, rgba(11,26,46,0.05) 60%, rgba(11,26,46,0.55) 100%)",
          }}
        />
      </div>

      <div className="relative z-10" style={{ marginTop: "-100dvh" }}>
        <NarrativeTransition
          caption="Del origen a la ejecución"
          message="Cada proyecto comienza con un propósito."
          scrollDistance={SCRUB_VH}
          onProgress={(p) => {
            glowBoostRef.current = p;
          }}
        />

        <WhyVmaSection />
        <ValoresSection />
        <ImpactoPuenteSection />
        <ContactoSection />
        <SiteFooter />
      </div>
    </div>
  );
}
