"use client";

import type { ReactNode } from "react";
import { animated, to } from "@react-spring/web";
import { Inview } from "@/components/animation/springs/in-view";
import { useMagneticCard } from "@/hooks/useMagneticCard";

/**
 * Glowing gradient-border card with a magnetic-tilt hover system: the card
 * rotates toward the cursor (spring physics via useMagneticCard, never
 * linear), a radial spotlight tracks the pointer like a reflection on
 * glass, and icon/index/title/body sit at increasing translateZ depths so
 * the tilt reads as real parallax instead of a flat rotated rectangle.
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
  const { ref, active, springs, handlers } = useMagneticCard();
  const { rotateX, rotateY, posY, scale, spotX, spotY, glow } = springs;

  return (
    <Inview
      tag="div"
      mode="once"
      from={{ opacity: 0, y: 30 }}
      to={{ opacity: 1, y: 0 }}
      config={{ tension: 100, friction: 18 }}
      delayIn={delay}
      className={`h-full ${className}`}
      style={{ perspective: 1200 }}
    >
      <animated.div
        ref={ref}
        {...handlers}
        className="group relative h-full touch-pan-y outline-none"
        style={{
          transform: to(
            [rotateX, rotateY, posY, scale],
            (rx, ry, ty, s) =>
              `translateY(${ty}px) scale(${s}) rotateX(${rx}deg) rotateY(${ry}deg)`,
          ),
          transformStyle: "preserve-3d",
          willChange: active ? "transform" : "auto",
          // Longer, softer shadow the further the card tilts; shrinks back
          // to a resting contact-shadow at rest.
          boxShadow: to(
            [rotateX, rotateY, glow],
            (rx, ry, g) =>
              `${ry * 1.6}px ${8 - rx * 1.6}px ${24 + (Math.abs(rx) + Math.abs(ry)) * 1.6}px rgba(4,10,20,${0.35 + g * 0.25})`,
          ),
        }}
      >
        {/* blurred ambient glow — rides along as part of the rigid card */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[32px] opacity-50"
          style={{ background: gradient, filter: "blur(40px)" }}
        />

        {/* animated border glow — brightens only while hovered/focused */}
        <animated.div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-[32px]"
          style={{
            boxShadow: glow.to(
              (g) => `0 0 ${g * 22}px rgba(125,211,252,${g * 0.45})`,
            ),
          }}
        />

        {/* gradient-border panel — the physical card surface */}
        <div
          className="relative z-10 flex h-full flex-col rounded-[32px] border-[6px] border-transparent p-6"
          style={{
            background: `linear-gradient(var(--panel), var(--panel)) padding-box, ${gradient} border-box`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* cursor-tracked spotlight — a reflection sheen, not a spotlight
              on the content: soft-light blend keeps it from washing out text */}
          <animated.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[26px]"
            style={{
              background: to(
                [spotX, spotY],
                (x, y) =>
                  `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.9) 0%, rgba(125,211,252,0.4) 35%, transparent 70%)`,
              ),
              opacity: glow.to((g) => g * 0.25),
              mixBlendMode: "soft-light",
            }}
          />

          <div
            className="relative flex items-start justify-between"
            style={{ transform: "translateZ(40px)" }}
          >
            {icon && (
              <animated.div
                className="text-white/90"
                style={{ transform: "translateZ(60px)" }}
              >
                {icon}
              </animated.div>
            )}
            {index && (
              <span
                className="font-mono text-xs text-white/40"
                style={{ transform: "translateZ(35px)" }}
              >
                {index}
              </span>
            )}
          </div>

          <animated.div
            className="relative mt-auto pt-8"
            style={{
              transform: glow.to(
                (g) => `translateZ(30px) translateY(${-3 * g}px)`,
              ),
            }}
          >
            {eyebrow && (
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--cyan)]">
                {eyebrow}
              </p>
            )}
            {title && (
              <animated.p
                className={`font-semibold text-white tracking-tight ${eyebrow ? "mt-1" : ""} text-lg`}
                style={{ opacity: glow.to((g) => 0.9 + g * 0.1) }}
              >
                {title}
              </animated.p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-white/70 selection:bg-white/20">
              {body}
            </p>
          </animated.div>
        </div>
      </animated.div>
    </Inview>
  );
}
