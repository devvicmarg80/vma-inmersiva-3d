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
 *
 * v3: after the cap was tuned down, next reports were "freezes for
 * seconds while scrolling" and "jumps back / doesn't stop where I left
 * it." ScrollExperience.tsx already documents the suspected cause: a
 * background `fetch()` swaps the video to a local blob so seeks become
 * pure local decode, but until that finishes, seeking past whatever the
 * *native* `<video preload="auto">` has actually downloaded stalls on the
 * network — `video.seeking` stays `true`, and the tick loop's `!video
 * .seeking` guard means it does nothing at all until the stall clears,
 * which reads as "stuck," and once it clears, the target may have moved
 * a lot in the meantime, reading as a sudden catch-up jump (easy to
 * mistake for "went backward" if it happens to land before where you
 * stopped, mid-catch-up). Wheel events alone can't show this — it can
 * happen with no new input at all — so this adds a continuously-polled
 * (every 200ms) status line: whether the blob swap has completed
 * (`currentSrc` starting with `blob:` vs the original path),
 * `readyState`, and — the direct measurement — how many consecutive ms
 * `video.seeking` has been `true` right now.
 */
type Sample = { t: number; videoTime: number };

export default function ScrollDebugOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [rate, setRate] = useState<string>("—");
  const [status, setStatus] = useState<string>("—");
  const lastEventAt = useRef<number | null>(null);
  const history = useRef<Sample[]>([]);
  const seekingSinceRef = useRef<number | null>(null);
  const maxSeekStallRef = useRef(0);

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

    const poll = setInterval(() => {
      const video = document.querySelector("video");
      if (!video) return;
      const now = performance.now();
      if (video.seeking) {
        if (seekingSinceRef.current === null) seekingSinceRef.current = now;
        const stall = now - seekingSinceRef.current;
        if (stall > maxSeekStallRef.current) maxSeekStallRef.current = stall;
      } else {
        seekingSinceRef.current = null;
      }
      const usingBlob = video.currentSrc.startsWith("blob:");
      let bufferedAhead = "—";
      try {
        for (let i = 0; i < video.buffered.length; i++) {
          if (video.buffered.start(i) <= video.currentTime && video.currentTime <= video.buffered.end(i)) {
            bufferedAhead = (video.buffered.end(i) - video.currentTime).toFixed(1) + "s";
            break;
          }
        }
      } catch {
        // buffered can throw if there are no ranges yet — leave as "—"
      }
      setStatus(
        `blob=${usingBlob ? "SÍ (video local)" : "NO (streaming de red)"}  readyState=${video.readyState}  seeking=${video.seeking}  bufferAdelante=${bufferedAhead}  stallActual=${seekingSinceRef.current ? (now - seekingSinceRef.current).toFixed(0) + "ms" : "0ms"}  stallMáximo=${maxSeekStallRef.current.toFixed(0)}ms`,
      );
    }, 200);

    return () => {
      window.removeEventListener("wheel", onWheel);
      clearInterval(poll);
    };
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
      <div style={{ color: "#fff", marginBottom: 4 }}>Scroll debug v3</div>
      <div style={{ color: "#ff0", marginBottom: 6 }}>{status}</div>
      <div style={{ color: "#0ff", marginBottom: 6 }}>Tasa: {rate}</div>
      {lines.length === 0 && <div>Haz scroll para ver datos…</div>}
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}
