"use client";

import { useEffect, useRef, useState } from "react";

const FADE_MS = 700;

export default function IntroOverlay() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fadingOut, setFadingOut] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [skippable, setSkippable] = useState(false);
  const [skipReducedMotion, setSkipReducedMotion] = useState(false);

  const dismiss = () => {
    setFadingOut(true);
    setTimeout(() => setRemoved(true), FADE_MS);
  };

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setSkipReducedMotion(true);
      return;
    }

    const skipTimer = setTimeout(() => setSkippable(true), 1000);
    // Safety net in case `ended` never fires (autoplay blocked, decode issue).
    const maxTimer = setTimeout(dismiss, 12000);
    return () => {
      clearTimeout(skipTimer);
      clearTimeout(maxTimer);
    };
  }, []);

  if (skipReducedMotion || removed) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black transition-opacity"
      style={{ opacity: fadingOut ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={dismiss}
        className="h-full w-full object-cover"
      >
        <source src="/video/VMA_Logo_Intro.mp4" type="video/mp4" />
      </video>

      {skippable && (
        <button
          type="button"
          onClick={dismiss}
          className="absolute bottom-6 right-6 rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-wide text-white/80 hover:bg-white/10"
        >
          Saltar intro
        </button>
      )}
    </div>
  );
}
