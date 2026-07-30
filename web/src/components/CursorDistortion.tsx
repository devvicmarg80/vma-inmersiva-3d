"use client";

import { useEffect, useRef } from "react";

// Approximates the getlayers.ai "Altitude" hero effect: the video warps
// around a point that trails the cursor on a spring lag, marbling warm/cool
// tint through the distortion, and settles back within about a second of the
// pointer going still. It's a cheap swirl+turbulence shader rather than a
// true fluid solver — good enough for the effect's "feel" at a fraction of
// the GPU cost.
//
// This is the Hero's interaction layer — the "virtual cursor" (`stir`,
// lagged behind the real pointer) and "velocity system" (`energy`, rising
// with pointer speed and decaying back to rest) already live here. Tunables
// pulled into one place instead of scattered magic numbers, so adjusting
// feel doesn't mean hunting through the tick loop.
const CONFIG = {
  /** Time constant (ms) for the virtual cursor's lag behind the real
   * pointer — larger = more "weight", smaller = snappier. */
  cursorSmoothingMs: 140,
  /** Time constant (ms) for the swirl energy's decay back to 0 once the
   * pointer stops moving. */
  energyDecayMs: 480,
  /** Scales pointer-movement distance (in normalized UV/frame) into swirl
   * energy — higher = a smaller flick reaches full intensity. */
  velocityMultiplier: 14,
  /** How long after scroll stops before this resumes rendering — scroll
   * always wins; this is just debounce so it doesn't flicker on/off
   * between scroll events. */
  scrollResumeDelayMs: 140,
  /** Canvas opacity transition when toggling visible/hidden (scroll,
   * reduced-motion, tab hidden, window blur all use this same fade). */
  visibilityFadeMs: 200,
} as const;

const VERT_SRC = `#version 300 es
in vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG_SRC = `#version 300 es
precision highp float;

uniform sampler2D uVideo;
uniform vec2 uResolution;
uniform vec2 uVideoScale;
uniform vec2 uStir;
uniform float uAspect;
uniform float uEnergy;
uniform float uTime;
out vec4 fragColor;

vec2 objectCoverUV(vec2 uv) {
  vec2 mapped = (uv - 0.5) * uVideoScale + 0.5;
  return clamp(mapped, 0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 a = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);
  vec2 stirA = vec2((uStir.x - 0.5) * uAspect, uStir.y - 0.5);

  vec2 diff = a - stirA;
  float dist = length(diff);
  float radius = 0.42;
  float falloff = smoothstep(radius, 0.0, dist) * uEnergy;

  float angle = falloff * 2.4;
  float s = sin(angle);
  float c = cos(angle);
  vec2 rotated = vec2(c * diff.x - s * diff.y, s * diff.x + c * diff.y);
  vec2 warped = stirA + rotated;

  float turb = sin(warped.x * 7.0 + warped.y * 5.0 + uTime * 0.7) * 0.018 * falloff;
  warped += vec2(turb, -turb * 0.7);

  vec2 warpedUV = vec2(warped.x / uAspect + 0.5, warped.y + 0.5);

  vec2 dir = dist > 0.0001 ? diff / dist : vec2(0.0);
  float ab = falloff * 0.014;

  float r = texture(uVideo, objectCoverUV(warpedUV + dir * ab)).r;
  float g = texture(uVideo, objectCoverUV(warpedUV)).g;
  float b = texture(uVideo, objectCoverUV(warpedUV - dir * ab)).b;
  vec3 color = vec3(r, g, b);

  vec3 warm = vec3(1.0, 0.78, 0.45);
  vec3 cool = vec3(0.45, 0.65, 0.98);
  float mixT = sin(angle * 1.3 + uTime * 0.5) * 0.5 + 0.5;
  vec3 tint = mix(cool, warm, mixT);
  color = mix(color, color * tint, falloff * 0.5);

  fragColor = vec4(color, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("createShader failed");
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(info || "shader compile error");
  }
  return shader;
}

export default function CursorDistortion({
  videoRef,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    // alpha:true so a failed init leaves the canvas transparent and the
    // plain <video> underneath shows through untouched.
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: false });
    if (!gl) return;

    let program: WebGLProgram;
    try {
      const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
      const p = gl.createProgram();
      if (!p) throw new Error("createProgram failed");
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(p) || "link error");
      }
      program = p;
    } catch {
      return;
    }

    const quad = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const uVideo = gl.getUniformLocation(program, "uVideo");
    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uVideoScale = gl.getUniformLocation(program, "uVideoScale");
    const uStir = gl.getUniformLocation(program, "uStir");
    const uAspect = gl.getUniformLocation(program, "uAspect");
    const uEnergy = gl.getUniformLocation(program, "uEnergy");
    const uTime = gl.getUniformLocation(program, "uTime");

    const pointer = { x: 0.5, y: 0.5 };
    const stir = { x: 0.5, y: 0.5 };
    let lastPointer = { x: 0.5, y: 0.5 };
    let energy = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      const dx = x - lastPointer.x;
      const dy = y - lastPointer.y;
      energy = Math.min(1, energy + Math.hypot(dx, dy) * CONFIG.velocityMultiplier);
      lastPointer = { x, y };
      pointer.x = x;
      pointer.y = y;
    };
    window.addEventListener("pointermove", onPointerMove);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // The video is never actually `.play()`-ing here — ScrollExperience
    // drives it entirely by setting `currentTime` from the scroll position,
    // skipping a new seek whenever `video.seeking` is still true from the
    // last one. This canvas used to call `texImage2D` from that same video
    // on *every* rAF frame regardless of scroll state, which competes with
    // those seeks for the decoder and made scrubbing visibly stall while
    // scrolling. Fix: while a scroll is in flight, hide this canvas (the
    // plain <video> underneath keeps scrubbing untouched) and skip all
    // texture/draw work entirely — the swirl is an idle/hover embellishment
    // for when the visitor is exploring with the mouse, not something that
    // needs to render while the video itself is the thing moving.
    let scrolling = false;
    let scrollIdleTimer = 0;
    const onScroll = () => {
      scrolling = true;
      window.clearTimeout(scrollIdleTimer);
      scrollIdleTimer = window.setTimeout(() => {
        scrolling = false;
      }, CONFIG.scrollResumeDelayMs);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // prefers-reduced-motion: checked directly (no React state) since this
    // effect is already client-only and nothing here renders visible DOM
    // that could mismatch between server/client — same reasoning as
    // PhotoGlobe's `reduceMotion`. Read live via the query's own listener
    // rather than once, in case the OS setting changes mid-session.
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = reducedMotionQuery.matches;
    const onReducedMotionChange = () => {
      reducedMotion = reducedMotionQuery.matches;
    };
    reducedMotionQuery.addEventListener("change", onReducedMotionChange);

    // Tab hidden / window unfocused: an idle/hover embellishment has no
    // reason to keep sampling the video texture and drawing every frame
    // when nobody can see it — same "hide canvas, skip all work" treatment
    // as the scroll-priority case above, just a different trigger.
    let pageHidden = document.hidden;
    const onVisibilityChange = () => {
      pageHidden = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    let windowFocused = document.hasFocus();
    const onFocus = () => {
      windowFocused = true;
    };
    const onBlur = () => {
      windowFocused = false;
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    canvas.style.transition = `opacity ${CONFIG.visibilityFadeMs}ms ease`;

    let raf = 0;
    let last = performance.now();
    let disposed = false;
    let wasPaused = false;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (disposed) return;

      const paused = scrolling || reducedMotion || pageHidden || !windowFocused;
      if (paused !== wasPaused) {
        canvas.style.opacity = paused ? "0" : "1";
        wasPaused = paused;
      }
      if (paused) {
        last = now;
        return;
      }

      const dt = Math.min(64, now - last);
      last = now;

      const lag = 1 - Math.exp(-dt / CONFIG.cursorSmoothingMs);
      stir.x += (pointer.x - stir.x) * lag;
      stir.y += (pointer.y - stir.y) * lag;
      energy *= Math.exp(-dt / CONFIG.energyDecayMs); // settles back to 0 on its own

      if (video.readyState < 2 || video.videoWidth === 0) return;

      gl.bindTexture(gl.TEXTURE_2D, texture);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      } catch {
        return;
      }

      const canvasAspect = canvas.width / canvas.height;
      const videoAspect = video.videoWidth / video.videoHeight;
      const scaleX = canvasAspect >= videoAspect ? 1 : canvasAspect / videoAspect;
      const scaleY = canvasAspect >= videoAspect ? videoAspect / canvasAspect : 1;

      gl.useProgram(program);
      gl.uniform1i(uVideo, 0);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform2f(uVideoScale, scaleX, scaleY);
      gl.uniform2f(uStir, stir.x, stir.y);
      gl.uniform1f(uAspect, canvasAspect);
      gl.uniform1f(uEnergy, energy);
      gl.uniform1f(uTime, now / 1000);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(scrollIdleTimer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      reducedMotionQuery.removeEventListener("change", onReducedMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      ro.disconnect();
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [videoRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}
