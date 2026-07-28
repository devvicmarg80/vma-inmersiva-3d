"use client";

import { useEffect, useRef, useState } from "react";
import { Inview } from "@/components/animation/springs/in-view";
import { FilialesSection } from "./FilialesSection";
import { ProyectosSection } from "./ProyectosSection";
import { DifcSection } from "./DifcSection";
import { ProyeccionesSection } from "./ProyeccionesSection";
import { GobiernoSection } from "./GobiernoSection";
import { ContactoSection } from "./ContactoSection";
import { SiteFooter } from "./SiteFooter";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Fraction of a viewport height spent scrubbing the Earth video before it
// locks on its final frame and just holds as a backdrop. Everything past
// that point is normal document scroll — the video stays pinned (sticky)
// behind it the whole way down to the footer, but stops changing.
//
// Must be >= 100: the overlay content is pulled up by exactly one viewport
// height (`marginTop: -100dvh`) to sit flush with the sticky video's top, so
// a spacer shorter than one viewport can never fully occupy the viewport on
// its own — the next section's top edge would already be poking into view
// from the very start, before the video has scrubbed at all.
const SCRUB_VH = 100;

/**
 * Everything after the scroll-video story (`ScrollExperience`): a short
 * scroll-scrubbed clip of Earth (satellites orbiting, echoing Act 1) that
 * locks on its last frame and stays pinned as a backdrop while the business
 * sections scroll over it as translucent glass panels — the footer is the
 * final, fully-opaque panel that closes the video out.
 *
 * Built with the animation architecture ported from next16-claude-starter
 * (Lenis smooth scroll, react-spring, spring-text-engine, the adaptive grid)
 * — see src/lib, src/hooks/animation, src/components/animation/springs.
 */
export function PostVideoSections() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video && video.readyState >= 1) setReady(true);
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
      const video = videoRef.current;
      if (!container) {
        dirty = false;
        return;
      }

      const scrubPx = window.innerHeight * (SCRUB_VH / 100);
      const top = container.getBoundingClientRect().top;
      const distanceIn = clamp(-top, 0, scrubPx);
      const progress = scrubPx > 0 ? distanceIn / scrubPx : 1;

      if (video && video.duration && Number.isFinite(video.duration)) {
        if (!video.seeking) {
          video.currentTime = progress * video.duration;
        }
      }
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
              "linear-gradient(rgba(11,26,46,0.35), rgba(11,26,46,0.7)), url(/img/earth-orbit-poster.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <p className="max-w-sm text-center text-sm uppercase tracking-[0.18em] text-white/70">
            Del origen a la ejecución
          </p>
        </section>
        <FilialesSection />
        <ProyectosSection />
        <DifcSection />
        <ProyeccionesSection />
        <GobiernoSection />
        <ContactoSection />
        <SiteFooter />
      </>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="sticky top-0 z-0 h-dvh w-full overflow-hidden">
        <video
          ref={videoRef}
          src="/video/Earth_Orbit.mp4"
          muted
          playsInline
          preload="auto"
          poster="/img/earth-orbit-poster.jpg"
          onLoadedMetadata={() => setReady(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            // Mirror of ScrollExperience's widened-but-translucent bottom
            // fade — a diffused band at the top to soften the handoff,
            // capped well short of solid black so it doesn't dim the video's
            // normal viewing time.
            background:
              "linear-gradient(180deg, rgba(11,26,46,0.65) 0%, rgba(11,26,46,0.35) 30%, rgba(11,26,46,0.1) 50%, rgba(11,26,46,0.05) 60%, rgba(11,26,46,0.6) 100%)",
          }}
        />
        {!ready && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/img/earth-orbit-poster.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
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

        <FilialesSection />
        <ProyectosSection />
        <DifcSection />
        <ProyeccionesSection />
        <GobiernoSection />
        <ContactoSection />
        <SiteFooter />
      </div>
    </div>
  );
}
