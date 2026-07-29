"use client";

import type { ReactNode } from "react";
import { Inview } from "@/components/animation/springs/in-view";

/**
 * Glowing gradient-border card — a blurred gradient glow behind a
 * gradient-bordered panel (background-clip padding-box/border-box trick).
 * Gradients stay in the brand's blue family; rotate through them by index
 * so a grid of many cards doesn't read as one flat repeated tile.
 */
const BLUE_GRADIENTS = [
  "linear-gradient(137deg, #22d3ee 0%, #3e77ac 55%, #123a5c 100%)",
  "linear-gradient(137deg, #ffffff 0%, #7dd3fc 45%, #06b6d4 100%)",
  "linear-gradient(137deg, #bae6fd 0%, #38bdf8 45%, #1d4ed8 100%)",
];

export function HudCard({
  index,
  icon,
  eyebrow,
  title,
  body,
  delay = 0,
  className = "",
}: {
  index?: string;
  // Already-rendered element (e.g. `<Target size={28} strokeWidth={2.5} />`),
  // not a component reference — the callers are Server Components and RSC
  // can't serialize a bare function across into this Client Component.
  icon?: ReactNode;
  eyebrow?: string;
  title?: string;
  body: string;
  delay?: number;
  className?: string;
}) {
  const variant = index ? parseInt(index, 10) - 1 : 0;
  const gradient = BLUE_GRADIENTS[((variant % 3) + 3) % 3];

  return (
    <Inview
      tag="div"
      mode="once"
      from={{ opacity: 0, y: 30 }}
      to={{ opacity: 1, y: 0 }}
      config={{ tension: 100, friction: 18 }}
      delayIn={delay}
      className={`relative flex h-full flex-col ${className}`}
    >
      {/* blurred glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[32px] opacity-50"
        style={{ background: gradient, filter: "blur(40px)" }}
      />

      {/* gradient-border panel */}
      <div
        className="relative z-10 flex h-full flex-col rounded-[32px] border-[6px] border-transparent p-6"
        style={{
          background: `linear-gradient(var(--panel), var(--panel)) padding-box, ${gradient} border-box`,
        }}
      >
        <div className="flex items-start justify-between">
          {icon && <div className="text-white/90">{icon}</div>}
          {index && (
            <span className="font-mono text-xs text-white/40">{index}</span>
          )}
        </div>

        <div className="mt-auto pt-8">
          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--cyan)]">
              {eyebrow}
            </p>
          )}
          {title && (
            <p
              className={`font-semibold text-white tracking-tight ${eyebrow ? "mt-1" : ""} text-lg`}
            >
              {title}
            </p>
          )}
          <p className="mt-2 text-sm leading-relaxed text-white/70 selection:bg-white/20">
            {body}
          </p>
        </div>
      </div>
    </Inview>
  );
}
