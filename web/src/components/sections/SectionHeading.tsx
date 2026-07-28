"use client";

import TextEngine from "spring-text-engine";
import { easings } from "@react-spring/web";
import { Inview } from "@/components/animation/springs/in-view";

/**
 * Line-by-line heading reveal — the "Common patterns" recipe from
 * spring-text-engine's docs, reused across every post-video section so they
 * all share one animated-heading language. The eyebrow and description
 * animate too (via `Inview`), staggered just after the heading, so the whole
 * block reads as one entrance instead of a heading reveal sitting on top of
 * static text.
 */
export function SectionHeading({
  eyebrow,
  children,
  description,
  align = "left",
  className = "",
}: {
  eyebrow?: string;
  children: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  const alignClass =
    align === "center" ? "text-center justify-center" : "text-left justify-start";

  return (
    <div>
      {eyebrow && (
        <Inview
          tag="p"
          from={{ opacity: 0, x: -90 }}
          to={{ opacity: 1, y: 0 }}
          mode="once"
          config={{ tension: 210, friction: 22 }}
          className={`mb-3 inline-block rounded-full bg-[var(--ink)] px-3 py-1 text-sm uppercase tracking-[0.14em] text-[var(--ember)] ${
            align === "center" ? "mx-auto text-center" : ""
          }`}
        >
          {eyebrow}
        </Inview>
      )}
      <TextEngine
        tag="h2"
        mode="once"
        start="top bottom-=120"
        className={`leading-display font-bold text-3xl md:text-5xl text-[var(--cyan)] ${alignClass} ${className}`}
        lineIn={{ y: "0%", opacity: 1 }}
        lineOut={{ y: "100%", opacity: 0 }}
        lineStagger={110}
        lineConfig={{ duration: 950, easing: easings.easeOutCubic }}
        overflow
      >
        {children}
      </TextEngine>
      {description && (
        <Inview
          tag="p"
          from={{ opacity: 0, x: -90 }}
          to={{ opacity: 1, y: 0 }}
          mode="once"
          delayIn={200}
          config={{ tension: 190, friction: 24 }}
          className={`mt-4 max-w-2xl text-white/80 ${
            align === "center" ? "mx-auto text-center" : "text-left"
          }`}
        >
          {description}
        </Inview>
      )}
    </div>
  );
}
