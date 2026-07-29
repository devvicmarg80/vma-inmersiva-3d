"use client";

import TextEngine from "spring-text-engine";
import { easings } from "@react-spring/web";
import { Inview } from "@/components/animation/springs/in-view";
import { SpringTrigger } from "@/components/animation/springs/spring-trigger";

/**
 * Line-by-line heading reveal — the "Common patterns" recipe from
 * spring-text-engine's docs, reused across every post-video section so they
 * all share one animated-heading language. The eyebrow and description
 * animate too (via `Inview`), staggered just after the heading, so the whole
 * block reads as one entrance instead of a heading reveal sitting on top of
 * static text.
 *
 * On top of that one-time entrance, each line is wrapped in its own
 * `SpringTrigger` (`mode="scrub"`) — a continuous, scroll-position-linked
 * drift, not a reveal — so the block keeps floating independently of the
 * page as it scrolls, at three slightly different rates (eyebrow < body <
 * title) for actual depth instead of one rigid block moving as a unit.
 * transform-only (`y`, react-spring's own translateY shorthand), so it
 * never touches layout — the surrounding flow doesn't shift, only the
 * already-laid-out text drifts on top of it.
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
        <SpringTrigger
          tag="div"
          innerTag="div"
          mode="scrub"
          start="top bottom"
          end="bottom top"
          from={{ y: 22 }}
          to={{ y: -18 }}
        >
          <Inview
            tag="p"
            from={{ opacity: 0, x: -90 }}
            to={{ opacity: 1, x: 0 }}
            mode="once"
            config={{ tension: 210, friction: 22 }}
            className={`mb-3 inline-block rounded-full bg-[var(--ink)] px-3 py-1 text-sm uppercase tracking-[0.14em] text-[var(--ember)] ${
              align === "center" ? "mx-auto text-center" : ""
            }`}
          >
            {eyebrow}
          </Inview>
        </SpringTrigger>
      )}
      <SpringTrigger
        tag="div"
        innerTag="div"
        mode="scrub"
        start="top bottom"
        end="bottom top"
        from={{ y: 50 }}
        to={{ y: -35 }}
      >
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
      </SpringTrigger>
      {description && (
        <SpringTrigger
          tag="div"
          innerTag="div"
          mode="scrub"
          start="top bottom"
          end="bottom top"
          from={{ y: 32 }}
          to={{ y: -24 }}
        >
          <Inview
            tag="p"
            from={{ opacity: 0, x: -90 }}
            to={{ opacity: 1, x: 0 }}
            mode="once"
            delayIn={200}
            config={{ tension: 190, friction: 24 }}
            className={`mt-4 max-w-2xl text-white/80 ${
              align === "center" ? "mx-auto text-center" : "text-left"
            }`}
          >
            {description}
          </Inview>
        </SpringTrigger>
      )}
    </div>
  );
}
