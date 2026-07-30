"use client";

import { useEffect, useRef } from "react";
import { createAttentionDirector, type AttentionMultipliers } from "@/lib/attention-director";

/**
 * Photoreal Earth (NASA Blue Marble composite, public domain) rendered by
 * hand-rolled per-pixel raycasting on a 2D canvas — no WebGL. Replaces the
 * pregrabbed Earth_Orbit.mp4 as the sticky backdrop behind PostVideoSections:
 * spins on its own continuously, and grows/rises/sidesteps across three
 * keyframes driven by `progressRef` (0..1 over the whole section, not just
 * the first viewport) so it stays the throughline behind Valores and
 * Contacto instead of resetting per-section.
 *
 * Ported from a canvas mockup validated in isolation first; the one real bug
 * found there (a `var` in the bilinear sampler shadowing the outer viewport
 * bounds — classic non-block-scoped-`var` footgun) doesn't reproduce here
 * since TypeScript's `let`/`const` block-scoping doesn't allow it.
 */

type Vec3 = { x: number; y: number; z: number };
type Keyframe = { t: number; rMult: number; cxFrac: number; arcTop: number };
type Satellite = { orbitR: number; incl: number; phase: number; speed: number };
type Star = { x: number; y: number; r: number; a: number };
type Comet = {
  spawnAt: number;
  duration: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  trailFrac: number;
};
type Planet = {
  xFrac: number;
  yFrac: number;
  r: number;
  color: string;
  ring: boolean;
  driftPx: number;
  driftMs: number;
};

const DEG2RAD = Math.PI / 180;

// Grows and rises to dominate the Valores section, then shrinks and
// sidesteps to make room for Contacto — see PostVideoSections for how
// `progress` is computed across the full section height.
// t=0's arcTop was 0.58 — the sphere's top curve sat 58% down the
// viewport, leaving a huge empty starfield above the caption/message
// during the narrative chapter (that chapter sits almost entirely at
// progress≈0, so this specific value is what governed the "empty space"
// complaint). Raised to 0.40 + a touch more size so the glowing horizon
// reads as the dominant visual immediately, not something arrived at only
// once the section is well underway.
const KEYFRAMES: Keyframe[] = [
  { t: 0.0, rMult: 1.12, cxFrac: 0.5, arcTop: 0.4 },
  { t: 0.5, rMult: 1.55, cxFrac: 0.5, arcTop: 0.06 },
  { t: 1.0, rMult: 0.6, cxFrac: 0.8, arcTop: 0.4 },
];

const SATELLITES: Satellite[] = [
  { orbitR: 1.16, incl: 1.15, phase: 0.4, speed: 0.00032 },
  { orbitR: 1.22, incl: 1.3, phase: 2.6, speed: -0.00021 },
];

const CONSTELLATIONS: [number, number][][] = [
  [[0.07, 0.16], [0.115, 0.1], [0.16, 0.15], [0.205, 0.085], [0.25, 0.13]],
  [
    [0.8, 0.115], [0.845, 0.095], [0.885, 0.11], [0.87, 0.15],
    [0.905, 0.165], [0.945, 0.145], [0.97, 0.185],
  ],
  [[0.05, 0.42], [0.09, 0.385], [0.135, 0.4], [0.1, 0.45], [0.05, 0.42]],
  [[0.9, 0.38], [0.935, 0.35], [0.96, 0.38], [0.935, 0.41], [0.9, 0.38]],
];

const PLANETS: Planet[] = [
  { xFrac: 0.92, yFrac: 0.22, r: 15, color: "#c98a5a", ring: true, driftPx: 4, driftMs: 9000 },
  { xFrac: 0.07, yFrac: 0.3, r: 9, color: "#8a94a6", ring: false, driftPx: 3, driftMs: 11000 },
];

const HOME_LON = -76;
const HOME_LAT = 4.7; // Colombia — VMA HQ
const ROT_BASE = (HOME_LON - 90) * DEG2RAD; // faces Colombia forward at rest
const SPIN_SPEED = 0.00032; // rad/ms — full rotation every ~19.6s
// Hard ceiling on the raycast buffer's largest side. Was 1400 — at the
// grown Valores keyframe (rMult 1.55) the visible area routinely maxed
// this out (~2M pixels/frame of per-pixel trig + bilinear sampling),
// which is exactly when scroll also adds its own load — that combination
// is what read as the rotation stuttering specifically while growing.
// Paired with the adaptive QUALITY_MIN below for extra headroom under load.
const MAX_BUF_DIM = 820;
const QUALITY_MIN = 0.45;
const FRAME_BUDGET_MS = 16.7; // 60fps
// Below this qualityScale, texture sampling drops to nearest-neighbor —
// bilinear's 4 reads + weighted sum is the single most expensive part of
// the per-pixel cost. At this point the buffer is already downscaled
// enough (upscale itself softens edges) that the blockiness nearest would
// normally show is barely visible, so it's a close-to-free speed win
// exactly when frames are already struggling.
const NEAREST_BELOW_QUALITY = 0.85;
// Base glow alpha is 0.4; at glowBoostRef=1 it reaches 0.6.
const GLOW_BOOST_MAX = 0.2;

// Occasional shooting star crossing the starfield — ambient and rare on
// purpose (a comet every few seconds would read as a screensaver, not a
// premium detail). At most one in flight at a time; the next spawn time is
// re-rolled within this window every time the previous one finishes.
const COMET_MIN_GAP_MS = 9_000;
const COMET_MAX_GAP_MS = 22_000;
const COMET_MIN_DURATION_MS = 1_100;
const COMET_MAX_DURATION_MS = 1_900;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}
function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

function keyframeAt(t: number) {
  let i = 0;
  while (i < KEYFRAMES.length - 2 && t > KEYFRAMES[i + 1].t) i++;
  const a = KEYFRAMES[i];
  const b = KEYFRAMES[i + 1];
  const span = b.t - a.t;
  const local = span > 0 ? smoothstep(clamp01((t - a.t) / span)) : 0;
  return {
    rMult: lerp(a.rMult, b.rMult, local),
    cxFrac: lerp(a.cxFrac, b.cxFrac, local),
    arcTop: lerp(a.arcTop, b.arcTop, local),
  };
}

function rotate(p: Vec3, ry: number, rx: number): Vec3 {
  const cosY = Math.cos(ry), sinY = Math.sin(ry);
  const x1 = p.x * cosY - p.z * sinY;
  const z1 = p.x * sinY + p.z * cosY;
  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  const y2 = p.y * cosX - z1 * sinX;
  const z2 = p.y * sinX + z1 * cosX;
  return { x: x1, y: y2, z: z2 };
}

function llToVec(lon: number, lat: number): Vec3 {
  const phi = (90 - lat) * DEG2RAD;
  const theta = lon * DEG2RAD;
  return {
    x: -Math.sin(phi) * Math.cos(theta),
    // Canvas y grows downward, so the north pole (phi=0) needs negative y
    // to land above screen-center.
    y: -Math.cos(phi),
    z: Math.sin(phi) * Math.sin(theta),
  };
}

function rotateAroundX(p: Vec3, a: number): Vec3 {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}
function satellitePosition(sat: Satellite, t: number): Vec3 {
  const a = sat.phase + t * sat.speed;
  return rotateAroundX({ x: sat.orbitR * Math.cos(a), y: 0, z: sat.orbitR * Math.sin(a) }, sat.incl);
}
function satelliteOrbitRing(sat: Satellite): Vec3[] {
  const pts: Vec3[] = [];
  for (let a = 0; a <= Math.PI * 2 + 0.001; a += Math.PI / 48) {
    pts.push(rotateAroundX({ x: sat.orbitR * Math.cos(a), y: 0, z: sat.orbitR * Math.sin(a) }, sat.incl));
  }
  return pts;
}

const HOME = llToVec(HOME_LON, HOME_LAT);
const SATELLITE_ORBITS = SATELLITES.map(satelliteOrbitRing);

export default function PhotoGlobe({
  progressRef,
  glowBoostRef,
  attentionDirector = true,
  className = "",
}: {
  /** 0..1, mutated directly by the parent's own scroll rAF loop — read
   * every frame here without ever triggering a React re-render. */
  progressRef: React.RefObject<number>;
  /** Optional 0..1, same mutation pattern as progressRef — nudges the
   * atmospheric glow's alpha up slightly (see GLOW_BOOST_MAX below).
   * Omitted by every caller except PostVideoSections' narrative chapter. */
  glowBoostRef?: React.RefObject<number>;
  /** Subtle randomized emphasis cycling across the scene's layers — see
   * src/lib/attention-director.ts. On by default since every caller wants
   * "the same living scene"; the escape hatch exists for a future instance
   * that shouldn't have it without touching this file. */
  attentionDirector?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Same 640px tier as useMagneticCard's mobile cutoff — "graceful
    // degradation on mobile" satisfied by not running at all there.
    const attention = createAttentionDirector({
      reduceMotion,
      disabled: !attentionDirector || window.innerWidth < 640,
    });

    let W = 0, H = 0, R0 = 0;
    let R = 0, cx = 0, cy = 0;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      R0 = Math.max(W * 0.62, H * 0.5);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // ---- Earth texture: decoded once into a plain pixel array so the
    // raycast loop below is a typed-array read, not a canvas API call. ----
    let texReady = false;
    let texData: Uint8ClampedArray | null = null;
    let texW = 0, texH = 0;
    const img = new Image();
    img.onload = () => {
      const off = document.createElement("canvas");
      off.width = img.naturalWidth;
      off.height = img.naturalHeight;
      const octx = off.getContext("2d");
      if (!octx) return;
      octx.drawImage(img, 0, 0);
      const id = octx.getImageData(0, 0, off.width, off.height);
      texData = id.data;
      texW = off.width;
      texH = off.height;
      texReady = true;
    };
    img.src = "/img/earth-day.jpg";

    // ---- background: stars, hand-placed constellations, distant planets ----
    const stars: Star[] = [];
    for (let s = 0; s < 180; s++) {
      stars.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.1 + 0.2, a: Math.random() * 0.5 + 0.12 });
    }

    // ---- comets: at most one in flight, spawned on a randomized timer ----
    let comet: Comet | null = null;
    let nextCometAt = performance.now() + rand(COMET_MIN_GAP_MS, COMET_MAX_GAP_MS);
    function rand(min: number, max: number) {
      return min + Math.random() * (max - min);
    }
    function maybeSpawnComet(now: number) {
      if (reduceMotion || comet || now < nextCometAt) return;
      // Enters from one of the four edges, exits roughly opposite with
      // some randomness so the path never reads as the same comet twice.
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
      comet = {
        spawnAt: now,
        duration: rand(COMET_MIN_DURATION_MS, COMET_MAX_DURATION_MS),
        x0: start.x,
        y0: start.y,
        x1: end.x,
        y1: end.y,
        trailFrac: rand(0.1, 0.16),
      };
    }
    function drawComet(now: number, attn: AttentionMultipliers) {
      if (!comet) return;
      const t = (now - comet.spawnAt) / comet.duration;
      if (t >= 1) {
        comet = null;
        nextCometAt = now + rand(COMET_MIN_GAP_MS, COMET_MAX_GAP_MS);
        return;
      }
      // Quick fade in, held bright, quick fade out — never a hard cut.
      const alpha = Math.min(1, t * 6) * Math.min(1, (1 - t) * 6) * attn.stars;
      const cx = lerp(comet.x0, comet.x1, t) * W;
      const cy = lerp(comet.y0, comet.y1, t) * H;
      const dx = comet.x1 - comet.x0;
      const dy = comet.y1 - comet.y0;
      const norm = Math.hypot(dx, dy) || 1;
      const trailLen = comet.trailFrac * Math.max(W, H);
      const tailX = cx - (dx / norm) * trailLen;
      const tailY = cy - (dy / norm) * trailLen;

      const grad = ctx!.createLinearGradient(tailX, tailY, cx, cy);
      grad.addColorStop(0, "rgba(223,232,242,0)");
      grad.addColorStop(1, `rgba(223,232,242,${0.85 * alpha})`);
      ctx!.strokeStyle = grad;
      ctx!.lineWidth = 1.5;
      ctx!.lineCap = "round";
      ctx!.beginPath();
      ctx!.moveTo(tailX, tailY);
      ctx!.lineTo(cx, cy);
      ctx!.stroke();

      ctx!.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx!.beginPath();
      ctx!.arc(cx, cy, 1.3, 0, Math.PI * 2);
      ctx!.fill();
    }

    function drawSpaceBackground(now: number, attn: AttentionMultipliers) {
      const neb1 = ctx!.createRadialGradient(W * 0.15, H * 0.2, 0, W * 0.15, H * 0.2, W * 0.4);
      neb1.addColorStop(0, `rgba(63,90,160,${0.1 * attn.nebula})`);
      neb1.addColorStop(1, "rgba(63,90,160,0)");
      ctx!.fillStyle = neb1;
      ctx!.fillRect(0, 0, W, H);
      const neb2 = ctx!.createRadialGradient(W * 0.85, H * 0.15, 0, W * 0.85, H * 0.15, W * 0.35);
      neb2.addColorStop(0, `rgba(140,80,120,${0.08 * attn.nebula})`);
      neb2.addColorStop(1, "rgba(140,80,120,0)");
      ctx!.fillStyle = neb2;
      ctx!.fillRect(0, 0, W, H);

      stars.forEach((st) => {
        ctx!.globalAlpha = st.a * attn.stars;
        ctx!.fillStyle = "#dfe8f2";
        ctx!.beginPath();
        ctx!.arc(st.x * W, st.y * H, st.r, 0, Math.PI * 2);
        ctx!.fill();
      });
      ctx!.globalAlpha = 1;

      ctx!.strokeStyle = "rgba(200,215,235,0.2)";
      ctx!.lineWidth = 1;
      ctx!.fillStyle = "rgba(223,232,242,0.65)";
      CONSTELLATIONS.forEach((pts) => {
        ctx!.beginPath();
        pts.forEach(([fx, fy], i) => {
          const px = fx * W, py = fy * H;
          if (i === 0) ctx!.moveTo(px, py);
          else ctx!.lineTo(px, py);
        });
        ctx!.stroke();
        pts.forEach(([fx, fy]) => {
          ctx!.beginPath();
          ctx!.arc(fx * W, fy * H, 1.3, 0, Math.PI * 2);
          ctx!.fill();
        });
      });

      PLANETS.forEach((p) => {
        const drift = reduceMotion ? 0 : Math.sin(now / p.driftMs) * p.driftPx;
        const px = p.xFrac * W, py = p.yFrac * H + drift;
        if (p.ring) {
          ctx!.save();
          ctx!.translate(px, py);
          ctx!.rotate(-0.35);
          ctx!.strokeStyle = "rgba(217,180,140,0.4)";
          ctx!.lineWidth = 1.4;
          ctx!.beginPath();
          ctx!.ellipse(0, 0, p.r * 1.9, p.r * 0.6, 0, 0, Math.PI * 2);
          ctx!.stroke();
          ctx!.restore();
        }
        const pg = ctx!.createRadialGradient(px - p.r * 0.35, py - p.r * 0.35, p.r * 0.1, px, py, p.r);
        pg.addColorStop(0, p.color);
        pg.addColorStop(1, "#12141c");
        ctx!.fillStyle = pg;
        ctx!.beginPath();
        ctx!.arc(px, py, p.r, 0, Math.PI * 2);
        ctx!.fill();
      });

      maybeSpawnComet(now);
      drawComet(now, attn);
    }

    function project(p: Vec3) {
      return { sx: cx + p.x * R, sy: cy + p.y * R, z: p.z };
    }

    function drawSatellites(
      now: number,
      rotY: number,
      rotX: number,
      wantFront: boolean,
      attn: AttentionMultipliers,
    ) {
      SATELLITES.forEach((sat, idx) => {
        const ring = SATELLITE_ORBITS[idx];
        const ringAlpha = (wantFront ? 0.3 : 0.06) * attn.orbitalRings;
        ctx!.strokeStyle = `rgba(95,227,247,${ringAlpha})`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        let started = false;
        for (const pt of ring) {
          const r = rotate(pt, rotY, rotX);
          const isFront = r.z >= -0.02;
          if (isFront !== wantFront) { started = false; continue; }
          const pp = project(r);
          if (!started) { ctx!.moveTo(pp.sx, pp.sy); started = true; }
          else ctx!.lineTo(pp.sx, pp.sy);
        }
        ctx!.stroke();

        const r2 = rotate(satellitePosition(sat, now), rotY, rotX);
        if ((r2.z >= -0.02) !== wantFront) return;
        const pp2 = project(r2);

        const g = ctx!.createRadialGradient(pp2.sx, pp2.sy, 0, pp2.sx, pp2.sy, 7);
        g.addColorStop(0, `rgba(95,227,247,${0.5 * attn.energyNetwork})`);
        g.addColorStop(1, "rgba(95,227,247,0)");
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(pp2.sx, pp2.sy, 7, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.fillStyle = "#eaffff";
        ctx!.beginPath();
        ctx!.arc(pp2.sx, pp2.sy, 1.6, 0, Math.PI * 2);
        ctx!.fill();
      });
    }

    const bufCanvas = document.createElement("canvas");
    const bufCtx = bufCanvas.getContext("2d");

    // Reused every frame instead of `createImageData` — allocating a fresh
    // multi-megabyte Uint8ClampedArray 20-60x/sec was generating enough
    // garbage to trigger periodic GC pauses, which is exactly what read as
    // the rotation "catching"/pausing. A view into one pre-sized buffer
    // costs nothing to create; only the backing memory is allocated, once.
    const pixelBuffer = new ArrayBuffer(MAX_BUF_DIM * MAX_BUF_DIM * 4);
    // Allocated (canvas) size, always >= the size actually needed this
    // frame — kept separate from bw/bh below.
    let allocW = 0, allocH = 0;
    // Snapping the grow-threshold to a coarse grid (instead of resizing on
    // *any* change) is what actually matters here: during scroll, R shifts
    // by a fraction of a pixel most frames (continuous keyframe
    // interpolation), and `bufCanvas.width = ...` forces the browser to
    // reallocate the canvas's backing store even when the size is
    // unchanged in any way that matters visually. That reallocation
    // happening on nearly every frame while scrolling — on top of the
    // raycasting itself — is what read as the rotation stuttering
    // specifically during scroll (it was smooth at rest, where R is
    // static). Shrinking never needs a reallocation: the existing buffer
    // is already big enough, we just use a smaller sub-rect of it.
    const GROW_SNAP = 24;

    function renderSphere(rotY: number, rotX: number, qualityScale: number) {
      if (!bufCtx || !texData) return;
      const vx0 = Math.max(0, Math.floor(cx - R));
      const vx1 = Math.min(W, Math.ceil(cx + R));
      const vy0 = Math.max(0, Math.floor(cy - R));
      const vy1 = Math.min(H, Math.ceil(cy + R));
      const vw = vx1 - vx0, vh = vy1 - vy0;
      if (vw <= 0 || vh <= 0) return;

      const scale = Math.min(1, (MAX_BUF_DIM * qualityScale) / Math.max(vw, vh));
      const bw = Math.max(1, Math.round(vw * scale));
      const bh = Math.max(1, Math.round(vh * scale));
      if (bw > allocW || bh > allocH) {
        allocW = Math.min(MAX_BUF_DIM, Math.ceil(bw / GROW_SNAP) * GROW_SNAP);
        allocH = Math.min(MAX_BUF_DIM, Math.ceil(bh / GROW_SNAP) * GROW_SNAP);
        bufCanvas.width = allocW;
        bufCanvas.height = allocH;
      }
      const data = new Uint8ClampedArray(pixelBuffer, 0, bw * bh * 4);
      const imgData = new ImageData(data, bw, bh);

      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const TWO_PI = Math.PI * 2;
      const toCssX = vw / bw, toCssY = vh / bh;
      const tex = texData;
      // Bilinear's 4 reads + weighted sum is the single priciest part of
      // the per-pixel cost — skip it under sustained load. The buffer is
      // already downscaled by qualityScale at that point, so the upscale
      // masks most of the blockiness nearest-neighbor would otherwise show.
      const useNearest = qualityScale < NEAREST_BELOW_QUALITY;

      for (let py = 0; py < bh; py++) {
        const cssY = vy0 + (py + 0.5) * toCssY;
        const ndcY = (cssY - cy) / R;
        const rowBase = py * bw;
        for (let px = 0; px < bw; px++) {
          const idx = (rowBase + px) * 4;
          const cssX = vx0 + (px + 0.5) * toCssX;
          const ndcX = (cssX - cx) / R;
          const d2 = ndcX * ndcX + ndcY * ndcY;
          if (d2 > 1) {
            data[idx + 3] = 0;
            continue;
          }
          const ndcZ = Math.sqrt(1 - d2);

          // Invert rotate(): undo the X-tilt, then the Y-spin, to recover
          // the globe-local point this pixel corresponds to.
          const wy = ndcY * cosX + ndcZ * sinX;
          const wz1 = -ndcY * sinX + ndcZ * cosX;
          const wx = ndcX * cosY + wz1 * sinY;
          const wz = -ndcX * sinY + wz1 * cosY;

          const phi = Math.acos(Math.max(-1, Math.min(1, -wy)));
          const theta = Math.atan2(wz, -wx);

          const u = theta / TWO_PI + 0.5;
          const v = phi / Math.PI;

          // limb darkening — cheap stand-in for atmospheric falloff.
          const shade = 0.5 + 0.5 * ndcZ;

          if (useNearest) {
            let tx = (u * texW) | 0;
            let ty = (v * texH) | 0;
            tx = ((tx % texW) + texW) % texW;
            if (ty < 0) ty = 0; else if (ty > texH - 1) ty = texH - 1;
            const ti = (ty * texW + tx) * 4;
            data[idx] = tex[ti] * shade;
            data[idx + 1] = tex[ti + 1] * shade;
            data[idx + 2] = tex[ti + 2] * shade;
          } else {
            // Bilinear — longitude wraps (mod texW), latitude clamps at
            // the poles (no wrap).
            const fx = u * texW - 0.5;
            const fy = v * texH - 0.5;
            let tx0 = Math.floor(fx), ty0 = Math.floor(fy);
            const fxFrac = fx - tx0, fyFrac = fy - ty0;
            let tx1 = tx0 + 1, ty1 = ty0 + 1;
            tx0 = ((tx0 % texW) + texW) % texW;
            tx1 = ((tx1 % texW) + texW) % texW;
            if (ty0 < 0) ty0 = 0; else if (ty0 > texH - 1) ty0 = texH - 1;
            if (ty1 < 0) ty1 = 0; else if (ty1 > texH - 1) ty1 = texH - 1;

            const i00 = (ty0 * texW + tx0) * 4;
            const i10 = (ty0 * texW + tx1) * 4;
            const i01 = (ty1 * texW + tx0) * 4;
            const i11 = (ty1 * texW + tx1) * 4;
            const w00 = (1 - fxFrac) * (1 - fyFrac);
            const w10 = fxFrac * (1 - fyFrac);
            const w01 = (1 - fxFrac) * fyFrac;
            const w11 = fxFrac * fyFrac;

            data[idx] = (tex[i00] * w00 + tex[i10] * w10 + tex[i01] * w01 + tex[i11] * w11) * shade;
            data[idx + 1] = (tex[i00 + 1] * w00 + tex[i10 + 1] * w10 + tex[i01 + 1] * w01 + tex[i11 + 1] * w11) * shade;
            data[idx + 2] = (tex[i00 + 2] * w00 + tex[i10 + 2] * w10 + tex[i01 + 2] * w01 + tex[i11 + 2] * w11) * shade;
          }
          data[idx + 3] = 255;
        }
      }
      bufCtx.putImageData(imgData, 0, 0);
      ctx!.imageSmoothingEnabled = true;
      ctx!.imageSmoothingQuality = "high";
      ctx!.drawImage(bufCanvas, 0, 0, bw, bh, vx0, vy0, vw, vh);
    }

    // ---- manual drag: nudges heading/tilt on top of the autonomous spin ----
    // Positive tilt, not negative: negative tilted toward the north pole
    // (Canada/Greenland in the visible cap — verified via the inverse
    // projection math, top-to-bottom lat was 44-81°N). Flipping the sign
    // brings the *southern* hemisphere into view instead — verified this
    // now sits at roughly 44°N (top of the visible cap) down to -9°S
    // (bottom), centered on Colombia at lon -76 the whole way down through
    // Ecuador/Peru/Brazil.
    let rotX = 44 * DEG2RAD;
    let dragYOffset = 0;
    let dragging = false, lastPX = 0, lastPY = 0;

    // Adaptive render quality: when a frame runs over budget (heaviest
    // exactly while scrolling + growing, since both the raycast area and
    // the scroll handler's own work land on the same thread), trade
    // resolution for smoothness; recover it once frames are cheap again.
    // This is on top of — not instead of — the MAX_BUF_DIM cut above.
    let qualityScale = 1;
    let lastFrameAt = 0;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastPX = e.clientX;
      lastPY = e.clientY;
      canvas!.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastPX;
      const dy = e.clientY - lastPY;
      lastPX = e.clientX;
      lastPY = e.clientY;
      dragYOffset += dx * 0.006;
      rotX = Math.max(-1.1, Math.min(1.1, rotX + dy * 0.006));
    };
    const onPointerUp = () => { dragging = false; };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Attention Director: any real page interaction suspends the emphasis
    // cycle immediately (window-level, not canvas-only — scrolling or
    // typing anywhere on the page counts, not just touching the globe).
    const onInteraction = () => attention.registerInteraction();
    window.addEventListener("scroll", onInteraction, { passive: true });
    window.addEventListener("pointermove", onInteraction, { passive: true });
    window.addEventListener("keydown", onInteraction);
    window.addEventListener("touchstart", onInteraction, { passive: true });

    // ---- pause the whole loop while off-screen (saves CPU/battery once the
    // visitor has scrolled well past this section) ----
    let inView = true;
    const io = new IntersectionObserver(
      ([entry]) => { inView = entry.isIntersecting; },
      { rootMargin: "200px 0px" }
    );
    io.observe(canvas);

    let raf = 0;
    let disposed = false;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (disposed) return;
      if (!inView) return;

      if (lastFrameAt) {
        const frameMs = now - lastFrameAt;
        if (frameMs > FRAME_BUDGET_MS * 1.4) {
          qualityScale = Math.max(QUALITY_MIN, qualityScale - 0.16);
        } else if (frameMs < FRAME_BUDGET_MS * 1.1) {
          qualityScale = Math.min(1, qualityScale + 0.015);
        }
      }
      lastFrameAt = now;

      // Attention Director — reads the same `now` this frame already has,
      // ticks inside this existing loop (no second RAF). Baseline
      // multipliers (all 1) whenever it's inert/idle/mid-interaction, so
      // this is a no-op in the common case.
      const attn = attention.update(now);

      const spinNow = reduceMotion ? 0 : now;
      const progress = progressRef.current ?? 0;
      const kf = keyframeAt(progress);

      const driftX = reduceMotion ? 0 : Math.sin(spinNow / 7000) * 8;
      const driftY = reduceMotion ? 0 : Math.cos(spinNow / 6200) * 6;
      R = R0 * kf.rMult;
      cx = W * kf.cxFrac + driftX;
      cy = H * kf.arcTop + R + driftY;

      const rotY = ROT_BASE + spinNow * SPIN_SPEED + dragYOffset;

      ctx.clearRect(0, 0, W, H);
      drawSpaceBackground(spinNow, attn);

      // Sunrise-over-Earth brightening, nudged further by the narrative
      // chapter's scroll progress when present. Saturated cyan (matching the
      // site's --cyan accent) instead of the earlier near-white — the
      // near-white version read as barely-there next to a starfield this
      // dark, which was part of why the whole chapter looked empty.
      const glowAlpha = (0.4 + (glowBoostRef?.current ?? 0) * GLOW_BOOST_MAX) * attn.atmosphere;
      const glow = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 1.5);
      glow.addColorStop(0, `rgba(56,208,255,${glowAlpha})`);
      glow.addColorStop(1, "rgba(56,208,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.5, 0, Math.PI * 2);
      ctx.fill();

      drawSatellites(spinNow, rotY, rotX, false, attn);

      if (texReady) {
        renderSphere(rotY, rotX, qualityScale);
      } else {
        ctx.fillStyle = "#0a2438";
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();
      }

      const rim = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.04);
      rim.addColorStop(0, "rgba(94,220,255,0)");
      rim.addColorStop(1, `rgba(94,220,255,${0.8 * attn.rim})`);
      ctx.strokeStyle = rim;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      drawSatellites(spinNow, rotY, rotX, true, attn);

      const hp = rotate(HOME, rotY, rotX);
      if (hp.z > -0.05) {
        const pp = project(hp);
        const pulse = 0.5 + 0.5 * Math.sin(now / 420);
        ctx.fillStyle = `rgba(217,154,92,${0.28 + pulse * 0.18})`;
        ctx.beginPath();
        ctx.arc(pp.sx, pp.sy, 9 + pulse * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d99a5c";
        ctx.beginPath();
        ctx.arc(pp.sx, pp.sy, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#0b1a2e";
        ctx.lineWidth = 1;
        ctx.stroke();
        if (pp.sy > 0 && pp.sy < H) {
          // Canvas's `font` setter can't resolve CSS custom properties
          // (var(--sans)) the way DOM styles can — it silently falls back
          // to the browser default instead of Roboto. Literal stack instead,
          // matching --sans in globals.css.
          ctx.font =
            "700 12px Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(6,15,28,0.75)";
          ctx.strokeText("Colombia", pp.sx + 10, pp.sy + 4);
          ctx.fillStyle = "#ffd9ad";
          ctx.fillText("Colombia", pp.sx + 10, pp.sy + 4);
        }
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas!.removeEventListener("pointerdown", onPointerDown);
      canvas!.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("scroll", onInteraction);
      window.removeEventListener("pointermove", onInteraction);
      window.removeEventListener("keydown", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
    };
  }, [progressRef, glowBoostRef, attentionDirector]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing ${className}`}
      style={{ touchAction: "pan-y" }}
    />
  );
}
