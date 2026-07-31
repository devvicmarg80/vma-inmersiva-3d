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
  // Act opacity/transform is written straight to the DOM every animation
  // frame (see the tick loop below) instead of through React state — on a
  // throttled mobile CPU, routing a 60fps value through setState forced a
  // full re-render every frame and was the dominant cause of dropped
  // frames during scroll (confirmed via CDP: ~60% of frames missed the
  // 16.6ms budget under 4x CPU throttling before this change). The refs
  // are populated by each act `<div ref>` below; initial inline styles
  // cover the first paint before the tick loop's first frame runs.
  const actRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Shared between the blob-fetch effect and the tick effect below — see the
  // tick loop's targetTime clamp for why the tick loop needs to know this.
  const blobReadyRef = useRef(false);
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
          // Only now — once the blob is actually the active source and has
          // loaded — can the tick loop stop clamping seeks to the buffered
          // range. Setting this before `onLoaded` fires would let it seek
          // freely against a video element that hasn't finished swapping
          // sources yet.
          blobReadyRef.current = true;
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

    // Scroll position is a target, not a direct time-map. displayedTime
    // eases toward whatever time the current scroll position implies rather
    // than jump-cutting to it on every scroll event.
    //
    // This used to be a fixed-rate cap (video-seconds per real second),
    // first a flat 2.2, then briefly an estimate of the user's *current*
    // scroll velocity. Both had the same failure: Windows Chrome's default
    // wheel-scroll step is a much bigger pixel jump per notch than macOS's
    // trackpad scrolling, so a fast wheel-spin covers the 372vh track in a
    // couple of seconds — and the instant that spin stops, current scroll
    // velocity drops to ~0. A velocity-based rate collapses right along
    // with it, at exactly the moment a large backlog (built up during the
    // fast spin) most needs a *high* rate to close — measured this
    // directly: after an 8-notch/~500ms burst, the video was still 6+
    // seconds of footage behind and closing that gap at barely above the
    // rate floor for 3+ more seconds, reading as the video ambling along on
    // its own well after the user's hand had stopped. That's what "va más
    // rápido" turned out to mean — not the video outrunning the scroll
    // while scrolling, but continuing to visibly move for seconds after
    // scrolling had already stopped.
    //
    // Proportional (exponential) easing fixes this by construction: the
    // step size scales with the *size of the remaining gap*, not with how
    // fast the target is currently moving. A large backlog closes quickly
    // (most of it within a few hundred ms) precisely because it's large;
    // a small, steady gap during ordinary continuous scrolling closes at a
    // correspondingly small, steady rate. No separate "how fast is the user
    // scrolling right now" estimate needed.
    const CATCHUP_RESPONSE = 10; // higher = snappier catch-up, closes ~95% of any gap in ~300ms
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
      // "you cut the video").
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
        let targetTime = targetProgress * video.duration;

        // Before the background blob fetch finishes (see the effect above),
        // this is still the native <video preload="auto">, which streams
        // progressively — seeking past whatever byte range it's actually
        // downloaded so far blocks on the network until that range arrives.
        // Measured directly on a real connection via the ?scrolldebug=1
        // overlay: a 4.6s continuous `video.seeking` stall, reported as
        // "se queda pegado por segundos" / "se devuelve" (the sudden
        // multi-second catch-up once a stalled seek finally resolves reads
        // as a jump, easy to mistake for going backward). Clamping the
        // requested seek to what's actually buffered — instead of firing a
        // seek that will block — turns that into "keeps up with whatever's
        // downloaded so far, catches up smoothly as more arrives" rather
        // than a hard freeze. Once the blob swap completes this is skipped
        // entirely and seeking is unclamped, matching the original design.
        if (!blobReadyRef.current) {
          const buffered = video.buffered;
          let bufferedEnd = 0;
          for (let i = 0; i < buffered.length; i++) {
            if (buffered.start(i) <= displayedTime && displayedTime <= buffered.end(i)) {
              bufferedEnd = buffered.end(i);
              break;
            }
          }
          const SEEK_SAFETY_MARGIN = 1.5; // stay this far behind the buffered edge
          targetTime = Math.min(targetTime, Math.max(displayedTime, bufferedEnd - SEEK_SAFETY_MARGIN));
        }

        const diff = targetTime - displayedTime;
        if (Math.abs(diff) > 0.001 && !video.seeking) {
          displayedTime += diff * (1 - Math.exp(-CATCHUP_RESPONSE * dt));
          video.currentTime = displayedTime;
        }
      }

      const p = (displayedTime / (video?.duration || 1)) * ACT_COUNT;
      for (let i = 0; i < ACT_COUNT; i++) {
        const el = actRefs.current[i];
        if (!el) continue;
        const opacity = actOpacity(p, i);
        el.style.opacity = String(opacity);
        el.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
        el.style.transform = `translateY(${(1 - opacity) * 16}px)`;
      }
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

          {acts.map((act, i) => {
            const initialOpacity = i === 0 ? 1 : 0;
            return (
              <div
                key={act.id}
                id={act.id}
                ref={(el) => {
                  actRefs.current[i] = el;
                }}
                // pt-20 (~header height) so a content-heavy act (e.g. the
                // 5-pillar grid) centers within the space below the fixed
                // header instead of overlapping it — confirmed via a live
                // header height measurement (81px at 390px viewport).
                className="absolute inset-0 flex items-center justify-center px-6 pt-20 sm:pt-0"
                style={{
                  opacity: initialOpacity,
                  pointerEvents: initialOpacity > 0.5 ? "auto" : "none",
                  transform: `translateY(${(1 - initialOpacity) * 16}px)`,
                }}
              >
                <ActContent act={act} isFirst={i === 0} />
              </div>
            );
          })}
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
      <p className="text-xs uppercase tracking-[0.14em] text-white/70">
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
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/30 px-3.5 py-1.5 text-sm uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm sm:text-base">
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
              <dt className="text-sm uppercase tracking-wide text-white/75 sm:text-base">
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
        // grid-cols-2 from the start (not just sm:) — with real (post font-size
        // fix) mobile type sizes, 5 stacked full-width cards ran taller than
        // one viewport and pushed the tag/headline behind the fixed header.
        // Two columns keeps this act's content within the viewport with the
        // header safely clear, confirmed via a live height measurement.
        <ul className="grid grid-cols-2 gap-2.5 text-left mb-6 sm:gap-4">
          {act.pillars.map((p) => (
            <li
              key={p.label}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-3 backdrop-blur-sm sm:px-5 sm:py-4"
            >
              <p className="text-base font-semibold text-white mb-1 sm:text-lg sm:mb-1.5">
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
