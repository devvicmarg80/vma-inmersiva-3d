"use client";

import { useEffect, useRef, useState } from "react";
import { acts } from "@/content/copy";

const ACT_COUNT = acts.length;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Triangular crossfade centered on each act's midpoint, one segment wide.
 * `p` is overall progress scaled to act units (0..ACT_COUNT). Clamping `p`
 * to the first/last act's center keeps act 0 fully opaque at scroll start
 * and the last act fully opaque at scroll end, instead of fading from/to 0.
 */
function actOpacity(p: number, i: number) {
  const pClamped = clamp(p, 0.5, ACT_COUNT - 0.5);
  const distance = Math.abs(pClamped - (i + 0.5));
  return clamp(1 - distance, 0, 1);
}

export default function ScrollExperience() {
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeStyles, setActiveStyles] = useState<number[]>(
    Array(ACT_COUNT).fill(0)
  );
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
    // The browser can start loading <video preload="auto"> from the raw
    // SSR'd HTML before React hydrates and binds onLoadedMetadata, so that
    // event can fire (and be missed) before the listener exists. Poll the
    // element's readyState directly as a fallback.
    const video = videoRef.current;
    if (video && video.readyState >= 1) {
      setReady(true);
    }
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

      const track = trackRef.current;
      const video = videoRef.current;
      if (!track) {
        dirty = false;
        return;
      }

      const totalScrollable = track.offsetHeight - window.innerHeight;
      const top = track.getBoundingClientRect().top;
      const progress = clamp(-top / totalScrollable, 0, 1);

      // Skip the seek while a previous one is still resolving so seeks
      // never queue up behind fast scrolling; `dirty` stays true so this
      // retries next frame instead of dropping the update entirely.
      if (video && video.duration && Number.isFinite(video.duration)) {
        if (video.seeking) {
          return;
        }
        video.currentTime = progress * video.duration;
      }
      dirty = false;

      const p = progress * ACT_COUNT;
      const next = acts.map((_, i) => actOpacity(p, i));
      setActiveStyles(next);
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
      <main>
        {acts.map((act) => (
          <section
            key={act.id}
            id={act.id}
            className="relative min-h-screen flex items-center justify-center px-6 py-24"
            style={{
              backgroundImage: `linear-gradient(rgba(11,26,46,0.55), rgba(11,26,46,0.75)), url(${act.poster})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <ActContent act={act} />
          </section>
        ))}
        <ClosingFooter />
      </main>
    );
  }

  return (
    <main>
      <div ref={trackRef} style={{ height: `${ACT_COUNT * 100}vh` }} className="relative">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            poster={acts[0].poster}
            onLoadedMetadata={() => setReady(true)}
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/video/VMA_Narrative.mp4" type="video/mp4" />
          </video>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(11,26,46,0.35) 0%, rgba(11,26,46,0.15) 35%, rgba(11,26,46,0.55) 100%)",
            }}
          />
          {!ready && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${acts[0].poster})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}

          {acts.map((act, i) => (
            <div
              key={act.id}
              id={act.id}
              className="absolute inset-0 flex items-center justify-center px-6"
              style={{
                opacity: activeStyles[i],
                pointerEvents: activeStyles[i] > 0.5 ? "auto" : "none",
                transform: `translateY(${(1 - activeStyles[i]) * 16}px)`,
              }}
            >
              <ActContent act={act} />
            </div>
          ))}
        </div>
      </div>
      <ClosingFooter />
    </main>
  );
}

function ActContent({ act }: { act: (typeof acts)[number] }) {
  return (
    <div className="max-w-3xl w-full text-center">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-white/80 backdrop-blur-sm">
        {act.tag}
      </div>
      {act.eyebrow && (
        <p className="mb-3 text-sm uppercase tracking-[0.1em] text-[var(--ember)]">
          {act.eyebrow}
        </p>
      )}
      <h2 className="text-3xl md:text-5xl text-white mb-4">{act.headline}</h2>
      {act.subheadline && (
        <p className="text-lg md:text-xl text-white/85 mb-6 max-w-2xl mx-auto">
          {act.subheadline}
        </p>
      )}
      {act.body && (
        <p className="text-base text-white/80 mb-6 max-w-xl mx-auto">
          {act.body}
        </p>
      )}

      {act.stats && (
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 max-w-2xl mx-auto">
          {act.stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-black/25 px-3 py-3">
              <dt className="text-[11px] uppercase tracking-wide text-white/60">
                {s.label}
              </dt>
              <dd className="text-xl font-semibold text-white tabular-nums">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {act.pillars && (
        <ul className="grid sm:grid-cols-2 gap-4 text-left mb-6">
          {act.pillars.map((p) => (
            <li key={p.label} className="rounded-lg bg-black/25 px-4 py-3">
              <p className="text-sm font-semibold text-white mb-1">
                {p.label}
              </p>
              <p className="text-sm text-white/75">{p.body}</p>
            </li>
          ))}
        </ul>
      )}

      {act.cta && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          {act.cta.map((c, i) => (
            <a
              key={c.label}
              href={c.href}
              className={
                i === 0
                  ? "rounded-full bg-[var(--ember)] px-6 py-3 text-sm font-semibold text-[var(--ink)] shadow-lg shadow-black/30"
                  : "rounded-full border border-white/40 bg-black/30 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/50"
              }
            >
              {c.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ClosingFooter() {
  return (
    <footer
      id="contacto"
      className="border-t border-white/10 bg-[var(--ink)] px-6 py-16 text-center"
    >
      <p className="text-2xl font-bold text-white mb-2">
        VMA · Innovación y Desarrollo
      </p>
      <p className="text-sm text-white/60">
        Contacto pendiente de confirmar antes de publicar este sitio.
      </p>
    </footer>
  );
}
