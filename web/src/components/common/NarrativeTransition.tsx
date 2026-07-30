"use client";

import { useEffect, useRef, useState } from "react";
import { animated } from "@react-spring/web";
import { useProgressTrigger } from "@/hooks/animation/use-progress-trigger";
import { useWindowWidth } from "@/hooks/use-window-size";

const MOBILE_BREAKPOINT = 640;
const TABLET_BREAKPOINT = 1024;
const TABLET_MOTION_SCALE = 0.6; // ~40% reduction
const FLOAT_RANGE_PX = 26; // "20-30px", per the brief

// Progress bands (0-1 over the whole chapter) the caption/message crossfade
// and float across. Not evenly split: the caption gets a short early
// window, the message gets the long middle "held" window, both taper out
// before the next section's own entrance takes over.
// Pushed later than a "start counting the instant the chapter is
// geometrically reachable" split would suggest: ScrollExperience's own
// hero video is still finishing its fade over roughly the first third of
// this chapter's range (its bottom-fade gradient overlaps this section
// rather than cutting off cleanly), so the caption's real visible window
// only begins once that's clear — verified empirically, not guessed.
const BANDS = {
  captionOut: [0.32, 0.48],
  messageIn: [0.46, 0.62],
  messageOut: [0.82, 0.98],
};

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}
function bandProgress(p: number, [start, end]: number[]) {
  return clamp01((p - start) / (end - start));
}

/**
 * The scroll "chapter" between the hero globe and the next section: a small
 * caption that settles, then dissolves into a single institutional
 * statement that holds in place (sticky, like the globe behind it) and
 * drifts a few pixels while the user scrolls, then dissolves into whatever
 * comes next. One `useProgressTrigger` read drives every derived value
 * (opacity ×2, translateY, and an optional glow boost fed to the globe) so
 * nothing can drift out of sync with the others or with scroll itself.
 *
 * Deliberately not a general "hero copy" component — it owns the sticky
 * chapter layout (a tall spacer + a pinned inner viewport-height cell),
 * not just the text, because the float/hold behavior only reads correctly
 * with that structure in place.
 */
export function NarrativeTransition({
  caption,
  message,
  scrollDistance,
  onProgress,
  className = "",
}: {
  caption: string;
  message: string;
  /** Height of the scroll chapter, in dvh — how long the caption→message
   * sequence takes to play out before the next section arrives. */
  scrollDistance: number;
  /** Fires on every progress update (0-1) — used to feed a subtle glow
   * boost into the globe behind this without this component knowing
   * anything about the globe. */
  onProgress?: (progress: number) => void;
  className?: string;
}) {
  const chapterRef = useRef<HTMLDivElement>(null);
  const width = useWindowWidth();
  const isMobile = width > 0 && width <= MOBILE_BREAKPOINT;
  const isTablet = width > MOBILE_BREAKPOINT && width <= TABLET_BREAKPOINT;
  const motionScale = isMobile ? 0 : isTablet ? TABLET_MOTION_SCALE : 1;

  // Starts false to match the server-rendered pass exactly (matchMedia
  // doesn't exist during SSR), then updates post-hydration — reading it
  // synchronously here instead caused a real hydration mismatch (server
  // and client disagreeing on messageY's initial translateY).
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  const { interpolatedProgress } = useProgressTrigger({
    elementRef: chapterRef,
    start: "top bottom",
    end: "bottom top",
    config: { duration: 1 },
    onChange: ({ progress }) => onProgressRef.current?.(progress),
  });

  const captionOpacity = interpolatedProgress.to((p) =>
    p < BANDS.captionOut[0]
      ? 1
      : 1 - bandProgress(p, BANDS.captionOut),
  );
  const messageOpacity = interpolatedProgress.to((p) => {
    const in_ = bandProgress(p, BANDS.messageIn);
    const out = bandProgress(p, BANDS.messageOut);
    return Math.min(in_, 1 - out);
  });
  // Reduced motion / mobile: no continuous drift, opacity crossfade only.
  const messageY = interpolatedProgress.to((p) => {
    if (reducedMotion || motionScale === 0) return 0;
    const t = bandProgress(p, [BANDS.messageIn[0], 1]);
    return (FLOAT_RANGE_PX / 2 - t * FLOAT_RANGE_PX) * motionScale;
  });

  return (
    <div ref={chapterRef} style={{ height: `${scrollDistance}dvh` }}>
      <div className={`sticky top-0 h-dvh ${className}`}>
        <animated.div
          // Anchored from the top (not vertically centered like the message
          // below) — at this size a 2-line wrap centered in the full
          // viewport pushes it down into the globe's horizon (raised to
          // ~40% of viewport height), overlapping the curve instead of
          // sitting in the open sky above it.
          className="absolute inset-x-0 top-[16%] flex flex-col items-center gap-4 px-6 text-center"
          style={{ opacity: captionOpacity }}
        >
          <span
            className="font-display max-w-4xl text-balance font-bold uppercase tracking-[0.08em]"
            style={{
              // Fluid instead of stepped breakpoints — scales continuously
              // with viewport width instead of jumping at md, and reads at
              // roughly 1.5x the previous fixed 3rem/5rem sizes.
              fontSize: "clamp(2.25rem, 6vw, 4.5rem)",
              // --gradient-cta's dark navy/steel stops (tuned for buttons on
              // solid/glass backgrounds) disappear against this section's
              // own dark sky — --gradient-hero keeps every stop bright.
              // The two drop-shadows (dark for grounding against the bright
              // parts of the sky, cyan for the "más llamativo" glow) work
              // because filter: drop-shadow() reads the element's alpha
              // mask, so it still outlines the glyph shapes even though
              // their fill comes from background-clip, not `color`.
              background: "var(--gradient-hero)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter:
                "drop-shadow(0 2px 18px rgba(8,17,31,0.55)) drop-shadow(0 0 44px rgba(34,211,238,0.3))",
            }}
          >
            {caption}
          </span>
          {/* Fades with the caption (shares captionOpacity) — visible on
              arrival, gone by the time the user has scrolled past it. */}
          <span
            className="max-w-xl text-balance font-medium text-white/85 italic"
            style={{ fontSize: "clamp(0.95rem, 2.2vw, 1.375rem)" }}
          >
            “La educación es el arma más poderosa que puedes usar para
            cambiar el mundo.”
          </span>
          <span
            className="text-white/50 uppercase tracking-[0.14em]"
            style={{ fontSize: "clamp(0.7rem, 1.4vw, 0.875rem)" }}
          >
            — Nelson Mandela
          </span>
        </animated.div>
        <animated.p
          className="font-display absolute inset-0 flex items-center justify-center px-6 text-center text-2xl font-bold text-white md:text-4xl"
          style={{
            opacity: messageOpacity,
            transform: messageY.to((y) => `translateY(${y}px)`),
          }}
        >
          <span className="max-w-xl text-balance">{message}</span>
        </animated.p>
      </div>
    </div>
  );
}
