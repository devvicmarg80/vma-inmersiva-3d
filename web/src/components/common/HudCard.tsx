"use client";

import type { ReactNode } from "react";
import { animated, to } from "@react-spring/web";
import { Inview } from "@/components/animation/springs/in-view";
import { useMagneticCard } from "@/hooks/useMagneticCard";

/**
 * Premium magnetic-tilt card: cursor-tracked 3D rotation (spring physics
 * via useMagneticCard, never linear), a radial spotlight + top-edge
 * reflection that track the pointer like polished glass, and depth-layered
 * content (icon/eyebrow/title/body at increasing translateZ) so the tilt
 * reads as real parallax. Neutral hairline border at rest — the electric-
 * blue "edge light" only blooms in on hover, so the card stays understated
 * until touched instead of glowing constantly.
 *
 * Perf note: the rotation-reactive shadow and the edge-light glow are both
 * done with `filter: drop-shadow()`, not `box-shadow` — box-shadow forces a
 * paint recalculation every frame, drop-shadow composites on the GPU
 * alongside the transform. Everything animated here is transform, opacity,
 * or filter — nothing that touches layout.
 */
const EDGE_LIGHT_RGB = ["125,211,252", "255,255,255", "56,189,248"];

const PARTICLES = [
  { top: "18%", left: "78%", size: 3, delay: "0s", duration: "8s" },
  { top: "62%", left: "88%", size: 2, delay: "1.5s", duration: "10s" },
  { top: "40%", left: "10%", size: 2, delay: "3s", duration: "9s" },
];

export function HudCard({
  index,
  icon,
  image,
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
  /** Path under /public — plain <img>, not next/image (see SiteHeader.tsx: the
   * image optimizer's cache writes come back corrupted on this filesystem). */
  image?: string;
  eyebrow?: string;
  title?: string;
  body: string;
  delay?: number;
  className?: string;
}) {
  const variant = index ? parseInt(index, 10) - 1 : 0;
  const edgeRgb = EDGE_LIGHT_RGB[((variant % 3) + 3) % 3];
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
      style={{ perspective: 1400 }}
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
          willChange: active ? "transform, filter" : "auto",
          // Soft ambient contact-shadow at rest, lengthens and softens
          // further with rotation — filter (not box-shadow) so it
          // composites with the transform instead of forcing a repaint.
          filter: to(
            [rotateX, rotateY],
            (rx, ry) =>
              `drop-shadow(${ry * 1.3}px ${10 - rx * 1.1}px ${20 + (Math.abs(rx) + Math.abs(ry)) * 1.3}px rgba(2,6,14,0.35))`,
          ),
        }}
      >
        {/* edge light — electric blue, hover-only, soft bloom */}
        <animated.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[24px]"
          style={{
            filter: glow.to(
              (g) => `drop-shadow(0 0 ${g * 16}px rgba(${edgeRgb},${g * 0.45}))`,
            ),
          }}
        />

        {/* card surface */}
        <div
          className="relative z-10 flex h-full flex-col rounded-[24px] border border-white/[0.08] p-6"
          style={{
            background: image ? undefined : "var(--panel)",
            transformStyle: "preserve-3d",
          }}
        >
          {image && (
            // Base plane, recessed behind the text (translateZ 0 — every
            // other layer below sits at a positive value). A literal
            // reading of "highest translateZ of any layer" for the
            // background would render it in front of the text under
            // preserve-3d instead of behind it, so the image anchors the
            // back of the stack and the rest keeps its relative ordering
            // (icon > title > eyebrow > body).
            <animated.img
              aria-hidden
              src={image}
              alt=""
              className="absolute inset-0 h-full w-full rounded-[24px] object-cover"
              style={{
                transform: to(
                  [spotX, spotY, glow],
                  (x, y, g) =>
                    `translateZ(0px) translate(${(50 - x) * 0.06 * g}px, ${(50 - y) * 0.06 * g}px) scale(${1 + g * 0.08})`,
                ),
              }}
            />
          )}
          {image && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[24px]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(8,17,31,0.3) 0%, rgba(8,17,31,0.6) 55%, rgba(8,17,31,0.94) 100%)",
                transform: "translateZ(1px)",
              }}
            />
          )}

          {/* ambient particles — under 8% opacity, slow independent drift */}
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              aria-hidden
              className="animate-card-particle pointer-events-none absolute rounded-full bg-white"
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                opacity: 0.06,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          ))}

          {/* cursor-tracked spotlight — a reflection sheen, not a spotlight
              on the content: soft-light blend keeps it from washing out text */}
          <animated.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[24px]"
            style={{
              background: to(
                [spotX, spotY],
                (x, y) =>
                  `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.9) 0%, rgba(125,211,252,0.4) 35%, transparent 70%)`,
              ),
              opacity: glow.to((g) => g * 0.18),
              mixBlendMode: "soft-light",
            }}
          />

          {/* micro-reflection — a thin highlight along the top edge that
              slides with the cursor, like light catching brushed glass */}
          <animated.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-[24px]"
            style={{
              background: spotX.to(
                (x) =>
                  `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) ${x}%, transparent 100%)`,
              ),
              opacity: glow.to((g) => g * 0.6),
            }}
          />

          <div
            className="relative flex items-start justify-between"
            style={{ transform: "translateZ(45px)" }}
          >
            {icon && (
              <animated.div
                className="text-white/90"
                style={{ transform: "translateZ(70px)" }}
              >
                {icon}
              </animated.div>
            )}
            {index && (
              <span
                className="font-mono text-xs text-white/40"
                style={{ transform: "translateZ(50px)" }}
              >
                {index}
              </span>
            )}
          </div>

          <div className="relative mt-auto pt-8" style={{ transform: "translateZ(25px)" }}>
            {eyebrow && (
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--cyan)]">
                {eyebrow}
              </p>
            )}
            {title && (
              <animated.p
                className={`font-semibold text-white ${eyebrow ? "mt-1" : ""} text-lg`}
                style={{
                  transform: glow.to((g) => `translateZ(60px) translateY(${-6 * g}px)`),
                  opacity: glow.to((g) => 0.9 + g * 0.1),
                  letterSpacing: glow.to((g) => `${g * 0.01}em`),
                }}
              >
                {title}
              </animated.p>
            )}
            <animated.p
              className="mt-2 text-sm leading-relaxed text-white/70 selection:bg-white/20"
              style={{
                transform: glow.to((g) => `translateY(${-3 * g}px)`),
                opacity: glow.to((g) => 0.7 + g * 0.1),
              }}
            >
              {body}
            </animated.p>
          </div>
        </div>
      </animated.div>
    </Inview>
  );
}
