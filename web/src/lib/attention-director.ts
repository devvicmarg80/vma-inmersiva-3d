/**
 * Attention Director — subliminal, randomized emphasis cycling across
 * PhotoGlobe's separable draw layers (nebula, stars, atmosphere, rim,
 * orbital rings, satellite glow). Adapted from a design brief written for
 * a WebGL scene (SceneManager/shaders/GSAP timelines) that doesn't exist
 * in this project — PhotoGlobe is a single Canvas 2D `requestAnimationFrame`
 * loop, so this is a plain state machine ticked once per frame from
 * inside that existing loop, not a new render/animation system.
 *
 * Deliberately not a React hook: every value here is read imperatively
 * inside PhotoGlobe's `draw(now)` and mutates canvas alpha/lineWidth
 * values directly — introducing React state here would mean a re-render
 * on every frame, exactly what this needs to avoid.
 */

export type AttentionElement =
  | "nebula"
  | "stars"
  | "atmosphere"
  | "rim"
  | "orbitalRings"
  | "energyNetwork";

export type AttentionMultipliers = Record<AttentionElement, number>;

const ELEMENTS: AttentionElement[] = [
  "nebula",
  "stars",
  "atmosphere",
  "rim",
  "orbitalRings",
  "energyNetwork",
];

// Peak multiplier ceiling per element — see the plan's mapping table for
// which requested variation (glow/brightness/bloom/particle density/
// opacity/light intensity) each one stands in for. All comfortably below
// the threshold of conscious perception.
const PEAK_CEILING: AttentionMultipliers = {
  atmosphere: 1.03, // glow +3%
  rim: 1.02, // light intensity +2%
  orbitalRings: 1.02, // bloom +2%
  energyNetwork: 1.02, // light intensity +2%
  stars: 1.02, // particle density +2% — approximated as opacity, not a
  // per-frame star count change (that would mean allocating/filtering the
  // stars array every frame, which the brief's own performance rules rule
  // out: "do not create additional render loops," reused here as "do not
  // add per-frame allocations" in the same spirit).
  nebula: 1.01, // opacity +1%
};

const MIN_WAIT_MS = 18_000;
const MAX_WAIT_MS = 35_000;
const MIN_TRANSITION_MS = 6_000;
const MAX_TRANSITION_MS = 10_000;
const MIN_HOLD_MS = 2_000;
const MAX_HOLD_MS = 5_000;
// Interaction suspends the cycle — ease back to baseline quickly rather
// than lingering at the normal 6-10s pace while the visitor is actively
// engaged with the page ("immediately suspend" reads as prompt, not lazy).
const INTERACTION_EASE_OUT_MS = 1_200;
// How long the page must stay quiet before the director resumes.
const IDLE_RESUME_MS = 2_000;

type Phase = "waiting" | "in" | "hold" | "out" | "aborting";

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}
function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}
function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}
function baselineMultipliers(): AttentionMultipliers {
  return { nebula: 1, stars: 1, atmosphere: 1, rim: 1, orbitalRings: 1, energyNetwork: 1 };
}

export function createAttentionDirector({
  reduceMotion,
  disabled,
}: {
  reduceMotion: boolean;
  /** Narrow viewports skip this entirely — same 640px tier as
   * useMagneticCard's mobile cutoff, and the graceful-degradation
   * requirement is trivially satisfied by just not running at all there. */
  disabled: boolean;
}) {
  const inert = reduceMotion || disabled;

  let phase: Phase = "waiting";
  let phaseStart = 0;
  let phaseDuration = 0;
  let element: AttentionElement | null = null;
  let lastElement: AttentionElement | null = null;
  let peak = 1;
  let progress = 0; // 0 = baseline, 1 = fully at `peak`
  let abortFrom = 0;
  let lastInteractionAt = -Infinity;
  let initialized = false;

  function enterPhase(next: Phase, now: number, duration: number) {
    phase = next;
    phaseStart = now;
    phaseDuration = duration;
  }

  function pickNextElement(): AttentionElement {
    const choices = ELEMENTS.filter((e) => e !== lastElement);
    const next = choices[Math.floor(Math.random() * choices.length)];
    lastElement = next;
    return next;
  }

  /** Called from window-level scroll/pointermove/keydown/touchstart
   * listeners — see PhotoGlobe.tsx for where those are registered
   * alongside its existing drag listeners. */
  function registerInteraction() {
    lastInteractionAt = performance.now();
  }

  function update(now: number): AttentionMultipliers {
    if (inert) return baselineMultipliers();

    if (!initialized) {
      enterPhase("waiting", now, randomBetween(MIN_WAIT_MS, MAX_WAIT_MS));
      initialized = true;
    }

    const interacting = now - lastInteractionAt < IDLE_RESUME_MS;

    if (interacting && phase !== "aborting" && phase !== "waiting") {
      abortFrom = progress;
      enterPhase("aborting", now, INTERACTION_EASE_OUT_MS);
    } else if (interacting && phase === "waiting") {
      // Nothing visible to abort yet — just push the wait window back so
      // a new cycle can't kick off mid-interaction/mid-scroll.
      phaseStart = now;
    }

    const t = clamp01((now - phaseStart) / phaseDuration);

    switch (phase) {
      case "waiting":
        progress = 0;
        if (t >= 1) {
          const chosen = pickNextElement();
          element = chosen;
          const ceiling = PEAK_CEILING[chosen];
          peak = randomBetween(1 + (ceiling - 1) * 0.5, ceiling);
          enterPhase("in", now, randomBetween(MIN_TRANSITION_MS, MAX_TRANSITION_MS));
        }
        break;
      case "in":
        progress = smoothstep(t);
        if (t >= 1) enterPhase("hold", now, randomBetween(MIN_HOLD_MS, MAX_HOLD_MS));
        break;
      case "hold":
        progress = 1;
        if (t >= 1) enterPhase("out", now, randomBetween(MIN_TRANSITION_MS, MAX_TRANSITION_MS));
        break;
      case "out":
        progress = 1 - smoothstep(t);
        if (t >= 1) {
          element = null;
          enterPhase("waiting", now, randomBetween(MIN_WAIT_MS, MAX_WAIT_MS));
        }
        break;
      case "aborting":
        progress = abortFrom * (1 - smoothstep(t));
        if (t >= 1) {
          element = null;
          enterPhase("waiting", now, randomBetween(MIN_WAIT_MS, MAX_WAIT_MS));
        }
        break;
    }

    const result = baselineMultipliers();
    if (element && progress > 0) {
      result[element] = 1 + (peak - 1) * progress;
    }
    return result;
  }

  return { update, registerInteraction };
}
