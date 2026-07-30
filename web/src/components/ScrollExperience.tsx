"use client";

import { useEffect, useRef, useState } from "react";
import { acts } from "@/content/copy";
import CursorDistortion from "./CursorDistortion";
import HeroStarfield from "./HeroStarfield";

const ACT_COUNT = acts.length;

// Physical scroll distance per act. 100vh/act (600vh total for 6 acts) meant
// six full page-heights of scrolling to see the whole video — the dominant
// cause of the scrub feeling slow, independent of any scroll-smoothing
// config. This only changes how much wheel/touch input is needed to reach a
// given point in the video; the video's own 34s runtime and the acts'
// crossfade timing (still driven by 0..1 progress) are untouched.
const VH_PER_ACT = 62;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Fraction of a segment's width spent fading in/out at each edge. The
// remaining (1 - 2*FADE) in the middle holds at full opacity, so neighboring
// acts only overlap during a short 2*FADE-wide handoff instead of dwelling
// on top of each other's text for most of the scroll (which read as one
// section's copy superimposed on the next's).
const FADE = 0.12;

/**
 * Trapezoidal crossfade: flat-opaque hold in the middle of each act's
 * segment, fading only over the narrow FADE band at each edge. `p` is
 * overall progress scaled to act units (0..ACT_COUNT). Clamping `p` to the
 * first/last act's center keeps act 0 fully opaque at scroll start and the
 * last act fully opaque at scroll end, instead of fading from/to 0.
 */
function actOpacity(p: number, i: number) {
  const pClamped = clamp(p, 0.5, ACT_COUNT - 0.5);
  const distance = Math.abs(pClamped - (i + 0.5));
  const hold = 0.5 - FADE;
  if (distance <= hold) return 1;
  if (distance >= 0.5) return 0;
  return 1 - (distance - hold) / FADE;
}

export default function ScrollExperience() {
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeStyles, setActiveStyles] = useState<number[]>(
    Array(ACT_COUNT).fill(0)
  );
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [pointerFine, setPointerFine] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    // Only devices with a real mouse get the cursor-distortion layer — it's
    // wasted GPU/battery on touch, which never fires pointermove anyway.
    const mq = window.matchMedia("(pointer: fine) and (hover: hover)");
    setPointerFine(mq.matches);
    const onChange = () => setPointerFine(mq.matches);
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
    // Native progressive streaming (preload="auto") paces itself against
    // playback rate, not scroll speed — a fast scroll can seek well past
    // whatever's downloaded so far, and the browser then has to pause and
    // wait for that byte range before the seek resolves. That stall is
    // exactly what reads as "no tiene un tiempo adecuado de ejecucion."
    //
    // A prior version of this file fetched the whole file up front and
    // *blocked scroll* until it finished (see git history) — reverted
    // because that hurt initial load/SEO more than scrub smoothness was
    // worth. This is the same fetch-to-blob idea done the other way:
    // starts immediately in the background, never blocks anything, and
    // once it resolves (mid-size video, well under the time it takes to
    // actually scroll through 34s of content at a normal pace) every
    // subsequent seek is a pure local decode with zero network dependency
    // — fast scrolling can't outrun it anymore. If the fetch is slow or
    // fails, the native src keeps working exactly as it does today; this
    // is pure upside, never a hard dependency.
    if (reducedMotion) return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    fetch(video.currentSrc || video.src)
      .then((res) => {
        if (!res.ok) throw new Error(`video fetch failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        const resumeAt = video.currentTime;
        const onLoaded = () => {
          video.currentTime = resumeAt;
          video.removeEventListener("loadedmetadata", onLoaded);
        };
        video.addEventListener("loadedmetadata", onLoaded);
        video.src = objectUrl;
      })
      .catch(() => {
        // Swallow — the video already works via the native src regardless.
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [reducedMotion]);

  useEffect(() => {
    // Scroll is never gated on the video anymore (forcing a full download
    // before letting the page respond hurt load performance/SEO more than
    // scrub smoothness was worth) — the browser streams it progressively via
    // the native preload hint instead. Just surface the scroll hint shortly
    // after mount.
    if (reducedMotion) return;
    const t = setTimeout(() => setShowHint(true), 400);
    return () => clearTimeout(t);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    let raf = 0;
    let dirty = true;

    // Scroll position is a target, not a direct time-map — without this,
    // scrolling 2x faster made the video visibly play 2x faster (scroll
    // speed *was* playback speed, 1:1). displayedTime instead eases toward
    // whatever time the current scroll position implies, capped at
    // MAX_RATE video-seconds per real second in either direction, so the
    // video always reads as playing at roughly one constant pace —
    // scrolling fast just means it plays at that pace until it catches up,
    // rather than visibly speeding through the footage.
    const MAX_RATE = 2.2;
    let displayedTime = 0;
    let targetProgress = 0;
    let lastTickAt = 0;

    const onScroll = () => {
      dirty = true;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTickAt ? Math.min(0.1, (now - lastTickAt) / 1000) : 0;
      lastTickAt = now;

      // Recomputing progress needs a layout read (getBoundingClientRect),
      // so it's gated on `dirty` (an actual scroll happened). Advancing
      // displayedTime toward it must NOT be gated the same way — that was
      // the bug: once the user stopped scrolling, dirty went false and the
      // catch-up motion just stopped mid-frame, stranding the video well
      // short of wherever the scroll position said it should be (read as
      // "you cut the video"). Scrolling through the whole track in under
      // ~15s (34s / MAX_RATE) made this the common case, not an edge case.
      if (dirty) {
        const track = trackRef.current;
        if (track) {
          const totalScrollable = track.offsetHeight - window.innerHeight;
          const top = track.getBoundingClientRect().top;
          targetProgress = clamp(-top / totalScrollable, 0, 1);
          if (targetProgress > 0.02) setShowHint(false);
        }
        dirty = false;
      }

      const video = videoRef.current;
      if (video && video.duration && Number.isFinite(video.duration)) {
        const targetTime = targetProgress * video.duration;
        if (Math.abs(targetTime - displayedTime) > 0.001 && !video.seeking) {
          const maxStep = MAX_RATE * dt;
          const diff = targetTime - displayedTime;
          displayedTime += Math.max(-maxStep, Math.min(maxStep, diff));
          video.currentTime = displayedTime;
        }
      }

      const p = (displayedTime / (video?.duration || 1)) * ACT_COUNT;
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

  useEffect(() => {
    if (!reducedMotion) return;
    setShowHint(true);
    const onScroll = () => {
      if (window.scrollY > 24) setShowHint(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      <>
        {acts.map((act, i) => (
          <section
            key={act.id}
            id={act.id}
            className="relative min-h-dvh flex items-center justify-center px-6 py-24"
            style={{
              backgroundImage: `linear-gradient(rgba(11,26,46,0.55), rgba(11,26,46,0.75)), url(${act.poster})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <ActContent act={act} isFirst={i === 0} />
          </section>
        ))}
        <ScrollHint visible={showHint} />
      </>
    );
  }

  return (
    <>
      <div ref={trackRef} style={{ height: `${ACT_COUNT * VH_PER_ACT}vh` }} className="relative">
        <div className="sticky top-0 h-dvh w-full overflow-hidden">
          <video
            ref={videoRef}
            src="/video/VMA_Narrative.mp4"
            muted
            playsInline
            preload="auto"
            poster={acts[0].poster}
            onLoadedMetadata={() => setReady(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {pointerFine && ready && <CursorDistortion videoRef={videoRef} />}
          {ready && <HeroStarfield />}
          <div
            className="absolute inset-0"
            style={{
              background:
                // Wider, translucent (never solid) darkening toward the
                // bottom — enough of a diffused band to soften the handoff
                // into the Earth video below without capping at full black,
                // which dimmed the hero for its entire normal viewing time.
                "linear-gradient(180deg, rgba(11,26,46,0.35) 0%, rgba(11,26,46,0.15) 30%, rgba(11,26,46,0.55) 65%, rgba(11,26,46,0.65) 100%)",
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
              <ActContent act={act} isFirst={i === 0} />
            </div>
          ))}
        </div>
      </div>
      <ScrollHint visible={showHint} />
    </>
  );
}

function ScrollHint({ visible }: { visible: boolean }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex flex-col items-center gap-2 transition-opacity duration-700 sm:bottom-8"
      style={{
        opacity: visible ? 1 : 0,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex h-9 w-6 items-start justify-center rounded-full border-2 border-white/50 p-1">
        <div className="h-1.5 w-1.5 rounded-full bg-white/80 animate-scroll-hint-dot" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/60">
        Desplázate para explorar
      </p>
    </div>
  );
}

function ActContent({
  act,
  isFirst = false,
}: {
  act: (typeof acts)[number];
  isFirst?: boolean;
}) {
  const HeadlineTag = isFirst ? "h1" : "h2";
  return (
    <div className="max-w-4xl w-full text-center">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/30 px-3.5 py-1.5 text-xs uppercase tracking-[0.14em] text-white/80 backdrop-blur-sm sm:text-sm">
        {act.tag}
      </div>
      {act.eyebrow && (
        <p className="mb-3 text-sm uppercase tracking-[0.1em] text-[var(--cyan)]">
          {act.eyebrow}
        </p>
      )}
      <HeadlineTag className="text-3xl md:text-5xl text-white mb-4">
        {act.headline}
      </HeadlineTag>
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
        <dl className="grid grid-cols-1 gap-3 mb-6 max-w-3xl mx-auto sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
          {act.stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-white/10 bg-black/40 px-4 py-4 backdrop-blur-sm"
            >
              <dt className="text-xs uppercase tracking-wide text-white/60 sm:text-sm">
                {s.label}
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-white tabular-nums sm:text-3xl">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {act.pillars && (
        <ul className="grid gap-4 text-left mb-6 sm:grid-cols-2">
          {act.pillars.map((p) => (
            <li
              key={p.label}
              className="rounded-lg border border-white/10 bg-black/40 px-5 py-4 backdrop-blur-sm"
            >
              <p className="text-base font-semibold text-white mb-1.5 sm:text-lg">
                {p.label}
              </p>
              <p className="text-sm text-white/75 sm:text-base">{p.body}</p>
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
                  ? "rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/30"
                  : "rounded-full border border-white/40 bg-black/30 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/50"
              }
              style={i === 0 ? { background: "var(--gradient-cta)" } : undefined}
            >
              {c.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
