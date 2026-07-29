"use client";

import { useCallback, useRef, useState } from "react";
import { useSpring } from "@react-spring/web";
import { useWindowWidth } from "@/hooks/use-window-size";
import { isMobileDisabled, springsConfig } from "@/lib/springs/config";

const MAX_ROTATE_X = 8;
const MAX_ROTATE_Y = 10;
const TILT_CONFIG = { tension: 300, friction: 30 };
const SETTLE_CONFIG = { tension: 210, friction: 24 };

/**
 * Magnetic-tilt hover physics for a "premium product card": cursor-tracked
 * 3D rotation + elevation + spotlight position, all driven by one
 * react-spring instance so every value settles with the same physical feel
 * instead of drifting out of sync with each other.
 *
 * Reuses the project's existing mobile-viewport gating (`isMobileDisabled`,
 * same convention as Hover/Inview in components/animation/springs) rather
 * than a separate touch-detection scheme. Rotation is additionally gated on
 * `PointerEvent.pointerType === "mouse"` — touch still gets the
 * elevation/glow response, just never the tilt, since there's no cursor
 * position to tilt toward on a touchscreen. `prefers-reduced-motion` is
 * checked directly (not just left to react-spring's global skipAnimation)
 * because the requirement here is "never move", not "move instantly".
 */
export function useMagneticCard() {
  const ref = useRef<HTMLDivElement>(null);
  const width = useWindowWidth();
  const disabled = isMobileDisabled(springsConfig.disableOnMobile.hover, width);
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
      if (disabled || e.pointerType !== "mouse" || reducedMotion()) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      api.start({
        rotateX: (0.5 - py) * 2 * MAX_ROTATE_X,
        rotateY: (px - 0.5) * 2 * MAX_ROTATE_Y,
        spotX: px * 100,
        spotY: py * 100,
        config: TILT_CONFIG,
      });
    },
    [api, disabled, reducedMotion],
  );

  const handlePointerEnter = useCallback(() => {
    if (disabled) return;
    setActive(true);
    // Touch: elevation + glow only — rotation never starts because
    // handlePointerMove bails out on pointerType !== "mouse".
    api.start({ scale: 1.02, posY: -8, glow: 1, config: SETTLE_CONFIG });
  }, [api, disabled]);

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
    if (disabled) return;
    // Keyboard focus: the simplified version — elevation + glow, no tilt
    // (there's no cursor position to tilt toward).
    setActive(true);
    api.start({ posY: -4, scale: 1.01, glow: 1, config: SETTLE_CONFIG });
  }, [api, disabled]);

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
