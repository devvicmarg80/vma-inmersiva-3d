"use client";

import { useEffect, useRef, useState } from "react";

/**
 * TEMPORARY diagnostic overlay for the "va más rápido en Windows/Chrome"
 * investigation — remove this file (and its mount in layout.tsx) once
 * that's resolved. Gated behind ?scrolldebug=1 so it never shows for a
 * normal visitor; exists because asking a non-developer user to paste a
 * script into DevTools console hit Chrome's "type allow pasting" wall and
 * produced no visible output. This just prints the numbers on the page
 * itself — no console needed.
 *
 * v2: first version only showed per-event deltaY/scrollY/videoTime — real
 * data from it confirmed the per-event wheel-delta cap (scroll-layout.tsx)
 * IS engaging correctly (~48px steps as expected), but didn't say anything
 * about how *often* those events fire. A cap on each event's size doesn't
 * cap the *aggregate* rate if the device fires many events per second — so
 * this version adds per-event timing (ms since the previous event) and a
 * rolling video-seconds-per-real-second rate over the last ~1s window, to
 * tell those two possibilities apart.
 */
type Sample = { t: number; videoTime: number };

export default function ScrollDebugOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [rate, setRate] = useState<string>("—");
  const lastEventAt = useRef<number | null>(null);
  const history = useRef<Sample[]>([]);

  useEffect(() => {
    const on = new URLSearchParams(window.location.search).get("scrolldebug") === "1";
    setEnabled(on);
    if (!on) return;

    const onWheel = (e: WheelEvent) => {
      const now = performance.now();
      const video = document.querySelector("video");
      const videoTime = video?.currentTime ?? 0;
      const dtMs = lastEventAt.current ? now - lastEventAt.current : null;
      lastEventAt.current = now;

      history.current.push({ t: now, videoTime });
      history.current = history.current.filter((s) => now - s.t <= 1000);
      if (history.current.length >= 2) {
        const oldest = history.current[0];
        const newest = history.current[history.current.length - 1];
        const realSec = (newest.t - oldest.t) / 1000;
        if (realSec > 0.05) {
          setRate(`${((newest.videoTime - oldest.videoTime) / realSec).toFixed(2)} seg-video/seg-real  (${history.current.length} eventos en el último segundo)`);
        }
      }

      const line = `+${dtMs === null ? "—" : dtMs.toFixed(0) + "ms"}  deltaY=${e.deltaY.toFixed(0)}  scrollY=${Math.round(window.scrollY)}  videoTime=${videoTime.toFixed(2)}`;
      setLines((prev) => [line, ...prev].slice(0, 14));
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  if (!enabled) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        zIndex: 999999,
        background: "rgba(0,0,0,0.85)",
        color: "#0f0",
        fontFamily: "monospace",
        fontSize: 13,
        padding: "10px 14px",
        borderRadius: 8,
        maxWidth: 460,
        lineHeight: 1.5,
        pointerEvents: "none",
      }}
    >
      <div style={{ color: "#fff", marginBottom: 4 }}>Scroll debug v2</div>
      <div style={{ color: "#0ff", marginBottom: 6 }}>Tasa: {rate}</div>
      {lines.length === 0 && <div>Haz scroll para ver datos…</div>}
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}
