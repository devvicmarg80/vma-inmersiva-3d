"use client";

import { Hover } from "@/components/animation/springs/hover";

/**
 * Schematic/HUD card — corner brackets + a mono-font index instead of the
 * generic `rounded-lg border bg-white/[0.03]` box used everywhere else on
 * the web. Ties into the orbital/schematic visual language already
 * established by the home page's globe and cosmic sections (see
 * PhotoGlobe.tsx, ValoresSection.tsx).
 */
export function HudCard({
  index,
  eyebrow,
  title,
  body,
  className = "",
}: {
  index?: string;
  eyebrow?: string;
  title?: string;
  body: string;
  className?: string;
}) {
  return (
    <Hover
      tag="div"
      from={{ y: 0 }}
      to={{ y: -4 }}
      config={{ tension: 260, friction: 24 }}
      className={`group relative border border-white/10 bg-white/[0.03] p-6 transition-colors duration-300 hover:border-[var(--cyan)]/55 ${className}`}
    >
      {/* corner brackets */}
      <span className="pointer-events-none absolute -top-px -left-px h-3 w-3 border-t border-l border-[var(--cyan)]/70 transition-all duration-300 group-hover:h-4 group-hover:w-4" />
      <span className="pointer-events-none absolute -bottom-px -right-px h-3 w-3 border-r border-b border-[var(--cyan)]/70 transition-all duration-300 group-hover:h-4 group-hover:w-4" />

      <div className="relative flex items-baseline justify-between gap-3">
        {index && (
          <span className="font-mono text-xs text-[var(--cyan)]/80">
            {index}
          </span>
        )}
        {eyebrow && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
            {eyebrow}
          </span>
        )}
      </div>
      {title && (
        <p className="relative mt-3 text-base font-semibold text-white">
          {title}
        </p>
      )}
      <p
        className={`relative text-sm leading-relaxed text-white/70 ${title ? "mt-2" : "mt-3"}`}
      >
        {body}
      </p>
    </Hover>
  );
}
