"use client";

import { useEffect, useRef, useState } from "react";
import { Inview } from "@/components/animation/springs/in-view";
import PhotoGlobe from "@/components/PhotoGlobe";
import { ValoresSection } from "./ValoresSection";
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
          className="relative flex h-dvh items-center justify-center overflow-hidden bg-[var(--ink)] px-6"
          style={{
            backgroundImage:
              "linear-gradient(rgba(11,26,46,0.35), rgba(11,26,46,0.7)), url(/img/earth-day.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <p className="max-w-sm text-center text-sm uppercase tracking-[0.18em] text-white/70">
            Del origen a la ejecución
          </p>
        </section>
        <ValoresSection />
        <ContactoSection />
        <SiteFooter />
      </>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="sticky top-0 z-0 h-dvh w-full overflow-hidden bg-[var(--ink)]">
        <PhotoGlobe progressRef={globeProgressRef} />
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
        <div
          style={{ height: `${SCRUB_VH}dvh` }}
          className="flex items-center justify-center px-6"
        >
          <Inview
            tag="p"
            from={{ opacity: 0, y: 16 }}
            to={{ opacity: 1, y: 0 }}
            mode="once"
            className="max-w-sm text-center text-sm uppercase tracking-[0.18em] text-white/70"
          >
            Del origen a la ejecución
          </Inview>
        </div>

        <ValoresSection />
        <ContactoSection />
        <SiteFooter />
      </div>
    </div>
  );
}
