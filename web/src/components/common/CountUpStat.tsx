"use client";

import { useEffect, useRef, useState } from "react";
import { useDynamicInView } from "@/hooks/animation/use-dynamic-in-view";

/**
 * Animated count-up for stat figures like "7.000+" — parses the leading
 * digit run (dots as thousands separators, Colombian format) and any
 * trailing suffix ("+", "%"), then counts up from 0 once the stat scrolls
 * into view.
 */
function parseStat(raw: string) {
  const match = raw.match(/^([\d.]+)(.*)$/);
  if (!match) return { target: 0, suffix: raw };
  const [, digits, suffix] = match;
  return { target: parseInt(digits.replace(/\./g, ""), 10) || 0, suffix };
}

export function CountUpStat({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const { target, suffix } = parseStat(value);
  const [display, setDisplay] = useState(0);
  const [setNode, inView] = useDynamicInView({ threshold: 0.4 });
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;

    const skipAnimation =
      target === 0 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = skipAnimation ? 0 : 1400;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return (
    <span ref={setNode} className={`tabular-nums ${className}`}>
      {display.toLocaleString("es-CO")}
      {suffix}
    </span>
  );
}
