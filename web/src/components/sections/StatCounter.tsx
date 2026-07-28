"use client";

import { RefObject } from "react";
import { animated } from "@react-spring/web";
import { useSpringTrigger } from "@/hooks/animation/use-spring-trigger";

/**
 * Counts a number up from 0 as `trigger` scrolls through the viewport —
 * built on the same `useSpringTrigger` hook `<SpringTrigger>` wraps, just
 * driving text content instead of a style, so it needs the hook directly.
 */
export function StatCounter({
  trigger,
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  trigger: RefObject<HTMLElement | null>;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const { springs } = useSpringTrigger({
    elementRef: trigger,
    start: "top bottom",
    end: "bottom center",
    from: { n: 0 },
    to: { n: value },
    mode: "scrub",
    config: { duration: 1 },
  });

  return (
    <animated.span>
      {springs.n.to((n) => `${prefix}${Number(n).toFixed(decimals)}${suffix}`)}
    </animated.span>
  );
}
