"use client";

import { useCallback, useRef, useState } from "react";
import { useSpring } from "@react-spring/web";
import { useWindowWidth } from "@/hooks/use-window-size";

const MAX_ROTATE_X = 8;
const MAX_ROTATE_Y = 10;
const TABLET_ROTATE_SCALE = 0.4;
// This effect's own 3-tier breakpoints (full / reduced / none), distinct
// from the site-wide single 768px hover cutoff in lib/springs/config.ts —
// that binary cutoff doesn't have a "reduced" tier to reuse here.
const MOBILE_BREAKPOINT = 640;
const TABLET_BREAKPOINT = 1024;
const TILT_CONFIG = { tension: 300, friction: 30 };
const SETTLE_CONFIG = { tension: 210, friction: 24 };

/**
 * Magnetic-tilt hover physics for a "premium product card": cursor-tracked
 * 3D rotation + elevation + spotlight position, all driven by one
 * react-spring instance so every value settles with the same physical feel
 * instead of drifting out of sync with each other.
 *
 * Responsive in three tiers (desktop full tilt, tablet reduced tilt, mobile
 * no tilt) via viewport width, plus `PointerEvent.pointerType === "mouse"`
 * as a second, independent gate on rotation specifically — a touch device
 * at a tablet-width viewport still gets no tilt, just elevation/glow,
 * since there's no cursor position to tilt toward either way.
 * `prefers-reduced-motion` is checked directly (not just left to
 * react-spring's global skipAnimation) because the requirement is "never
 * move", not "move instantly".
 */
export function useMagneticCard() {
  const ref = useRef<HTMLDivElement>(null);
  const width = useWindowWidth();
  const rotateScale =
    width > 0 && width <= MOBILE_BREAKPOINT
      ? 0
      : width <= TABLET_BREAKPOINT
        ? TABLET_ROTATE_SCALE
        : 1;
  const [active, setActive] = useState(false);

  const [springs, api] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    posY: 0,
    scale: 1,
    spotX: 50,
    spotY: 50,
    glow: 0,
    config: TILT_CONFIG,
  }));

  const reducedMotion = useCallback(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (rotateScale === 0 || e.pointerType !== "mouse" || reducedMotion())
        return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      api.start({
        rotateX: (0.5 - py) * 2 * MAX_ROTATE_X * rotateScale,
        rotateY: (px - 0.5) * 2 * MAX_ROTATE_Y * rotateScale,
        spotX: px * 100,
        spotY: py * 100,
        config: TILT_CONFIG,
      });
    },
    [api, rotateScale, reducedMotion],
  );

  const handlePointerEnter = useCallback(() => {
    // Elevation + glow apply on every tier, including mobile/touch — only
    // rotation is gated (by rotateScale + the mouse-only check above).
    setActive(true);
    api.start({ scale: 1.02, posY: -8, glow: 1, config: SETTLE_CONFIG });
  }, [api]);

  const reset = useCallback(() => {
    setActive(false);
    api.start({
      rotateX: 0,
      rotateY: 0,
      posY: 0,
      scale: 1,
      spotX: 50,
      spotY: 50,
      glow: 0,
      config: SETTLE_CONFIG,
    });
  }, [api]);

  const handleFocus = useCallback(() => {
    // Keyboard focus: the simplified version — elevation + glow, no tilt
    // (there's no cursor position to tilt toward).
    setActive(true);
    api.start({ posY: -4, scale: 1.01, glow: 1, config: SETTLE_CONFIG });
  }, [api]);

  return {
    ref,
    active,
    springs,
    handlers: {
      onPointerMove: handlePointerMove,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: reset,
      onFocus: handleFocus,
      onBlur: reset,
    },
  };
}
