"use client";

import { useEffect, useState } from "react";

/**
 * TEMPORARY diagnostic overlay for the "va más rápido en Windows/Chrome"
 * investigation — remove this file (and its mount in ScrollExperience.tsx)
 * once that's resolved. Gated behind ?scrolldebug=1 so it never shows for
 * a normal visitor; exists because asking a non-developer user to paste a
 * script into DevTools console hit Chrome's "type allow pasting" wall and
 * produced no visible output. This just prints the numbers on the page
 * itself — no console needed.
 */
export default function ScrollDebugOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const on = new URLSearchParams(window.location.search).get("scrolldebug") === "1";
    setEnabled(on);
    if (!on) return;

    const onWheel = (e: WheelEvent) => {
      const video = document.querySelector("video");
      const line = `deltaY=${e.deltaY.toFixed(0)}  deltaMode=${e.deltaMode}  scrollY=${Math.round(window.scrollY)}  videoTime=${video?.currentTime.toFixed(2) ?? "—"}`;
      setLines((prev) => [line, ...prev].slice(0, 12));
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
        maxWidth: 420,
        lineHeight: 1.5,
        pointerEvents: "none",
      }}
    >
      <div style={{ color: "#fff", marginBottom: 4 }}>Scroll debug (últimos 12 eventos de rueda)</div>
      {lines.length === 0 && <div>Haz scroll para ver datos…</div>}
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}
