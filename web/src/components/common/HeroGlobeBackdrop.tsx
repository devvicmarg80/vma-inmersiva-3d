"use client";

import { useRef } from "react";
import PhotoGlobe from "@/components/PhotoGlobe";

/**
 * Ambient version of the Home globe for the secondary pages' hero
 * sections — same spinning Earth, but static (progress pinned at its
 * first keyframe: centered, resting size) instead of scroll-jacked
 * growth/repositioning, since these pages don't have Home's long
 * pinned-scroll section to drive that off of. Non-interactive
 * (`pointer-events-none`) so it reads as backdrop, not a control, and
 * doesn't compete with the drag-to-rotate globe on Home.
 */
export function HeroGlobeBackdrop() {
  const progressRef = useRef(0);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <PhotoGlobe progressRef={progressRef} className="opacity-70" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(11,26,46,0.3) 0%, rgba(11,26,46,0.55) 60%, rgba(11,26,46,0.94) 100%)",
        }}
      />
    </div>
  );
}
