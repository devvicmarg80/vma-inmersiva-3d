"use client";

import { Inview } from "@/components/animation/springs/in-view";

export function SiteFooter() {
  return (
    <Inview
      tag="footer"
      from={{ opacity: 0, y: 40 }}
      to={{ opacity: 1, y: 0 }}
      mode="once"
      config={{ tension: 170, friction: 22 }}
      className="border-t border-white/10 bg-[var(--ink)] px-6 py-12 text-center"
    >
      {/* Plain <img>, not next/image — see SiteHeader.tsx for why. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/vma-logo.png"
        alt="VMA"
        className="mx-auto h-20 w-auto md:h-24"
      />
      <p className="mt-4 text-sm font-semibold text-white/80">
        VMA · Innovación y Desarrollo
      </p>
      <p className="mt-1 text-xs text-white/60">
        VMA Grupo Empresarial de Desarrollo e Innovación S.A.S. · Colombia
      </p>
    </Inview>
  );
}
