"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { animated, to } from "@react-spring/web";
import { Inview } from "@/components/animation/springs/in-view";
import { useMagneticCard } from "@/hooks/useMagneticCard";
import { isWompiConfigured, buildWompiCheckoutUrl } from "@/lib/wompi";
import type { PricingService } from "@/content/pricing";

/**
 * Same magnetic-tilt glass-card language as `HudCard` (cursor-tracked 3D
 * tilt, spotlight, edge-light) — reused directly via `useMagneticCard`
 * rather than reinventing the animation, since the content here (price,
 * feature list, payment button) is different enough from HudCard's
 * icon/title/body shape to need its own layout.
 */
const EDGE_LIGHT_RGB = "56,189,248";

function formatCOP(value: number) {
  return value.toLocaleString("es-CO");
}

export function PricingCard({
  service,
  icon,
  delay = 0,
}: {
  // `PricingService` minus `icon` — the icon is a component reference
  // (a function), which a Server Component caller (`PricingSection`)
  // can't serialize across into this Client Component. See HudCard.tsx
  // for the same constraint: the caller pre-renders the icon into JSX
  // and passes that instead (below).
  service: Omit<PricingService, "icon">;
  icon: ReactNode;
  delay?: number;
}) {
  const { ref, active, springs, handlers } = useMagneticCard();
  const { rotateX, rotateY, posY, scale, spotX, spotY, glow } = springs;

  function handlePay() {
    const reference = `${service.id}-${Date.now()}`;
    const url = buildWompiCheckoutUrl({
      amountCOP: service.priceCOP,
      reference,
      redirectUrl: `${window.location.origin}/precios?pago=exitoso`,
    });
    window.location.href = url;
  }

  return (
    <Inview
      tag="div"
      mode="once"
      from={{ opacity: 0, y: 30 }}
      to={{ opacity: 1, y: 0 }}
      config={{ tension: 100, friction: 18 }}
      delayIn={delay}
      className="h-full"
      style={{ perspective: 1400 }}
    >
      <animated.div
        ref={ref}
        {...handlers}
        className="group relative h-full touch-pan-y outline-none"
        style={{
          transform: to(
            [rotateX, rotateY, posY, scale],
            (rx, ry, ty, s) =>
              `translateY(${ty}px) scale(${s}) rotateX(${rx}deg) rotateY(${ry}deg)`,
          ),
          transformStyle: "preserve-3d",
          willChange: active ? "transform, filter" : "auto",
          filter: to(
            [rotateX, rotateY],
            (rx, ry) =>
              `drop-shadow(${ry * 1.3}px ${10 - rx * 1.1}px ${20 + (Math.abs(rx) + Math.abs(ry)) * 1.3}px rgba(2,6,14,0.35))`,
          ),
        }}
      >
        <animated.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[24px]"
          style={{
            filter: glow.to(
              (g) => `drop-shadow(0 0 ${g * 16}px rgba(${EDGE_LIGHT_RGB},${g * 0.45}))`,
            ),
          }}
        />

        <div
          className="relative z-10 flex h-full flex-col rounded-[24px] border border-white/[0.08] p-6"
          style={{ background: "var(--panel)", transformStyle: "preserve-3d" }}
        >
          <animated.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[24px]"
            style={{
              background: to(
                [spotX, spotY],
                (x, y) =>
                  `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.9) 0%, rgba(125,211,252,0.4) 35%, transparent 70%)`,
              ),
              opacity: glow.to((g) => g * 0.18),
              mixBlendMode: "soft-light",
            }}
          />
          <animated.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-[24px]"
            style={{
              background: spotX.to(
                (x) =>
                  `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) ${x}%, transparent 100%)`,
              ),
              opacity: glow.to((g) => g * 0.6),
            }}
          />

          <div className="relative text-[var(--cyan)]" style={{ transform: "translateZ(70px)" }}>
            {icon}
          </div>

          <div className="relative mt-4" style={{ transform: "translateZ(60px)" }}>
            <p className="font-display text-lg font-bold text-white">{service.title}</p>
            <p className="mt-1 text-sm text-white/60">{service.tagline}</p>
          </div>

          <p
            className="relative mt-3 text-sm leading-relaxed text-white/70"
            style={{ transform: "translateZ(40px)" }}
          >
            {service.description}
          </p>

          <ul className="relative mt-4 space-y-2" style={{ transform: "translateZ(40px)" }}>
            {service.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-white/80">
                <Check size={16} className="mt-0.5 shrink-0 text-[var(--cyan)]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div
            className="relative mt-auto pt-6"
            style={{ transform: "translateZ(50px)" }}
          >
            <div className="border-t border-white/10 pt-5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">
                Precio de referencia
              </p>
              <p className="font-display mt-1 text-3xl font-bold text-white">
                ${formatCOP(service.priceCOP)}{" "}
                <span className="text-base font-normal text-white/50">COP</span>
              </p>
              <p className="text-sm text-white/50">
                ≈ USD ${service.priceUSD.toLocaleString("en-US")} (referencial)
              </p>
            </div>

            {isWompiConfigured() ? (
              <button
                type="button"
                onClick={handlePay}
                className="mt-5 w-full rounded-full px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-black/20 transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-90"
                style={{ background: "var(--gradient-cta)" }}
              >
                Pagar con Wompi
              </button>
            ) : (
              <Link
                href="/contacto"
                className="mt-5 block w-full rounded-full px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-black/20 transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-90"
                style={{ background: "var(--gradient-cta)" }}
              >
                Escríbenos
              </Link>
            )}

            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/40">
              <ShieldCheck size={14} />
              <span>Pagos seguros procesados por Wompi</span>
            </div>
          </div>
        </div>
      </animated.div>
    </Inview>
  );
}
