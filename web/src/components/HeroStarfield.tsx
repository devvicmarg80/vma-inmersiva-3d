"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient overlay for the Hero: a few twinkling stars and a handful of
 * comets (up to MAX_CONCURRENT_COMETS at once, varied in size and speed)
 * crossing — drawn on a fully transparent canvas (only `clearRect`
 * between frames, never a filled background) so the video shows through
 * everywhere except the shapes themselves. Deliberately not sharing code
 * with PhotoGlobe.tsx —
 * that one owns an opaque space background of its own; this one only ever
 * adds a light touch on top of footage that's already doing most of the
 * visual work, and needs to stay legible across every act (space scenes
 * and community/terrain photos alike), which is a different tuning problem
 * than PhotoGlobe's.
 *
 * No third-party animation/particle library — same reasoning as the
 * comets in PhotoGlobe.tsx: hand-rolled Canvas 2D is simple enough here
 * not to need a dependency.
 */

type Star = { x: number; y: number; r: number; baseAlpha: number; twinkleMs: number; phase: number };
type Comet = {
  spawnAt: number;
  duration: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  trailFrac: number;
  scale: number;
};

const STAR_COUNT = 70;
const MAX_CONCURRENT_COMETS = 3;
const COMET_MIN_GAP_MS = 3_500;
const COMET_MAX_GAP_MS = 9_000;
const COMET_MIN_DURATION_MS = 650;
const COMET_MAX_DURATION_MS = 2_600;
const COMET_MIN_SCALE = 0.6;
const COMET_MAX_SCALE = 1.9;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}
function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function HeroStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0, H = 0;
    function resize() {
      const rect = canvas!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1 + 0.3,
        baseAlpha: Math.random() * 0.35 + 0.15,
        twinkleMs: rand(2200, 4200),
        phase: Math.random() * Math.PI * 2,
      });
    }

    let comets: Comet[] = [];
    let nextCometAt = performance.now() + rand(COMET_MIN_GAP_MS, COMET_MAX_GAP_MS);
    function maybeSpawnComet(now: number) {
      if (reduceMotion || comets.length >= MAX_CONCURRENT_COMETS || now < nextCometAt) return;
      const edge = Math.floor(Math.random() * 4);
      const along = rand(0.15, 0.85);
      const start = [
        { x: -0.05, y: along },
        { x: along, y: -0.05 },
        { x: 1.05, y: along },
        { x: along, y: 1.05 },
      ][edge];
      const end = {
        x: clamp01(1 - start.x + rand(-0.2, 0.2)),
        y: clamp01(1 - start.y + rand(-0.2, 0.2)),
      };
      comets.push({
        spawnAt: now,
        duration: rand(COMET_MIN_DURATION_MS, COMET_MAX_DURATION_MS),
        x0: start.x,
        y0: start.y,
        x1: end.x,
        y1: end.y,
        trailFrac: rand(0.09, 0.14),
        scale: rand(COMET_MIN_SCALE, COMET_MAX_SCALE),
      });
      nextCometAt = now + rand(COMET_MIN_GAP_MS, COMET_MAX_GAP_MS);
    }
    function drawComets(now: number) {
      comets = comets.filter((comet) => {
        const t = (now - comet.spawnAt) / comet.duration;
        if (t >= 1) return false;

        const alpha = Math.min(1, t * 6) * Math.min(1, (1 - t) * 6);
        const cx = lerp(comet.x0, comet.x1, t) * W;
        const cy = lerp(comet.y0, comet.y1, t) * H;
        const dx = comet.x1 - comet.x0;
        const dy = comet.y1 - comet.y0;
        const norm = Math.hypot(dx, dy) || 1;
        const trailLen = comet.trailFrac * Math.max(W, H) * comet.scale;
        const tailX = cx - (dx / norm) * trailLen;
        const tailY = cy - (dy / norm) * trailLen;

        const grad = ctx!.createLinearGradient(tailX, tailY, cx, cy);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(1, `rgba(255,255,255,${0.8 * alpha})`);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.4 * comet.scale;
        ctx!.lineCap = "round";
        ctx!.beginPath();
        ctx!.moveTo(tailX, tailY);
        ctx!.lineTo(cx, cy);
        ctx!.stroke();

        ctx!.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx!.beginPath();
        ctx!.arc(cx, cy, 1.2 * comet.scale, 0, Math.PI * 2);
        ctx!.fill();

        return true;
      });
    }

    let pageHidden = document.hidden;
    const onVisibilityChange = () => { pageHidden = document.hidden; };
    document.addEventListener("visibilitychange", onVisibilityChange);
    let windowFocused = document.hasFocus();
    const onFocus = () => { windowFocused = true; };
    const onBlur = () => { windowFocused = false; };
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    let raf = 0;
    let disposed = false;
    let wasPaused = false;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (disposed) return;

      const paused = reduceMotion || pageHidden || !windowFocused;
      if (paused !== wasPaused) {
        canvas.style.opacity = paused ? "0" : "1";
        wasPaused = paused;
      }
      if (paused) return;

      ctx.clearRect(0, 0, W, H);

      stars.forEach((st) => {
        const twinkle = reduceMotion ? 1 : 0.6 + 0.4 * Math.sin(now / st.twinkleMs + st.phase);
        ctx.globalAlpha = st.baseAlpha * twinkle;
        ctx.fillStyle = "#eaf2fb";
        ctx.beginPath();
        ctx.arc(st.x * W, st.y * H, st.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      maybeSpawnComet(now);
      drawComets(now);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
