"use client";

// Ported from next16-claude-starter (Textura).

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useScroll } from "@/hooks/smooth-scroll/use-scroll";
import { scrollTo } from "@/utils/scroll-to";
import { useShallow } from "zustand/react/shallow";

export const scrollSpeed = { current: 1 };

export function ScrollLayout({ children }: { children: React.ReactNode }) {
  // Server-safe rendering
  return (
    <div className="scroll-layout">
      {/* Static content that can be rendered on server */}
      <div className="scroll-layout-content">{children}</div>

      {/* Client-only functionality */}
      <ScrollController />
    </div>
  );
}

function ScrollController() {
  const isEnableScroll = useScroll((state) => state.isEnableScroll);
  const [hash, setHash] = useState<string>("");
  const [lenis, setLenis] = useScroll(
    useShallow((state) => [state.lenis, state.setLenis]),
  );
  const pathname = usePathname();
  const savedPathname = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo(0, 0);
    const lenis = new Lenis({
      smoothWheel: true,
      // Short duration — this page has a scroll-scrubbed video section
      // (ScrollExperience) that reads the raw scroll position every frame to
      // seek the video. Lenis's own default duration (~1.2s) piles extra lag
      // on top of that, so scrubbing through it felt sluggish. A quick
      // duration keeps just enough smoothing to take the edge off
      // trackpad/wheel jitter without it reading as "slow". wheelMultiplier
      // is boosted too — the actual dominant fix for "takes too long" was
      // shrinking the video track's scroll distance (see VH_PER_ACT in
      // ScrollExperience.tsx); this compounds with that rather than
      // replacing it. See the virtualScroll comment below for why that
      // boost needed a per-event cap to go with it.
      duration: 0.5,
      wheelMultiplier: 1.4,
      // syncTouch: true,
      // Cap how much a single wheel event can move (after wheelMultiplier is
      // already applied, per Lenis's own onWheel — see node_modules/lenis
      // source, not just its .d.ts). Chrome on Windows commonly reports a
      // much bigger deltaY per wheel "notch" than macOS's trackpad does for
      // the equivalent physical nudge — combined with wheelMultiplier this
      // let one Windows/Chrome notch move noticeably more scroll (and, on
      // the video-scrubbed Hero, noticeably more of the video) than the same
      // gesture on Mac. Confirmed by asking specifically what "faster"
      // meant: not lag/desync (already tried fixing that twice — see
      // ScrollExperience.tsx's history), but "a small scroll moves the
      // video a lot." Clamping the per-event delta bounds that regardless
      // of OS/browser, without touching how continuous multi-event
      // scrolling (trackpad flicks, sustained wheel spins) feels — those
      // still accumulate normally across events, only an individual
      // oversized single event gets capped.
      // Real telemetry from a user's own machine (captured via the
      // ?scrolldebug=1 overlay — see ScrollDebugOverlay.tsx) showed the cap
      // itself was engaging correctly (consistent ~48px steps regardless of
      // native deltaY) but 48px was still too generous — even deliberate,
      // well-spaced individual wheel clicks (180ms-2s apart, clearly not a
      // continuous fast spin) each moved ~0.3-0.9s of the 34s video. Halved
      // to 24px based on that data.
      virtualScroll: (data) => {
        if (data.event instanceof WheelEvent) {
          const WHEEL_DELTA_CAP = 24;
          data.deltaX = Math.sign(data.deltaX) * Math.min(Math.abs(data.deltaX), WHEEL_DELTA_CAP);
          data.deltaY = Math.sign(data.deltaY) * Math.min(Math.abs(data.deltaY), WHEEL_DELTA_CAP);
        }
        return true;
      },
    });
    (window as typeof window & { lenis: Lenis }).lenis = lenis;
    setLenis(lenis);

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      // Cancel the loop before destroying Lenis — otherwise it keeps calling
      // `raf` on a destroyed instance after unmount/HMR.
      cancelAnimationFrame(rafId);
      lenis.destroy();
      setLenis(null);
    };
  }, [setLenis]);

  useEffect(() => {
    if (isEnableScroll) {
      lenis?.start();
      enableNativeScroll(true);
    } else {
      lenis?.stop();
      enableNativeScroll(false);
    }
  }, [isEnableScroll, lenis]);

  useEffect(() => {
    if (lenis && hash) {
      setTimeout(() => {
        scrollTo(hash, true);
      }, 300);
    }
  }, [lenis, hash]);

  useEffect(() => {
    if (savedPathname.current !== pathname) {
      savedPathname.current = pathname;
      if (pathname.includes("#")) {
        const hash = pathname.split("#").pop();
        if (hash) {
          setHash(hash);
        }
      }
    }
  }, [pathname, setHash]);

  return null; // This component doesn't render anything visible
}

const enableNativeScroll = (value: boolean) => {
  if (typeof document === "undefined") return;
  if (!document) return;
  const html = document.querySelector("html");
  if (!html) return;
  if (!value) {
    html.style.position = "relative";
    html.style.overflow = "hidden";
    html.style.height = "100%";
  } else {
    html.style.removeProperty("position");
    html.style.removeProperty("overflow");
    html.style.removeProperty("height");
  }
};
