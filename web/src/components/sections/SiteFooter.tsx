"use client";

import { useState } from "react";
import { Inview } from "@/components/animation/springs/in-view";
import { LegalModal } from "@/components/common/LegalModal";
import { habeasData, pqr } from "@/content/legal";

type LegalKey = "habeasData" | "pqr" | null;

export function SiteFooter() {
  const [openLegal, setOpenLegal] = useState<LegalKey>(null);

  return (
    <Inview
      tag="footer"
      from={{ opacity: 0, x: -90 }}
      to={{ opacity: 1, x: 0 }}
      mode="once"
      config={{ tension: 170, friction: 22 }}
      className="border-t border-white/10 bg-transparent px-6 py-12 text-center"
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

      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-white/50">
        <button
          type="button"
          onClick={() => setOpenLegal("habeasData")}
          className="underline underline-offset-4 transition-colors hover:text-white"
        >
          Habeas Data
        </button>
        <button
          type="button"
          onClick={() => setOpenLegal("pqr")}
          className="underline underline-offset-4 transition-colors hover:text-white"
        >
          PQR
        </button>
      </div>

      <LegalModal
        doc={habeasData}
        open={openLegal === "habeasData"}
        onClose={() => setOpenLegal(null)}
      />
      <LegalModal
        doc={pqr}
        open={openLegal === "pqr"}
        onClose={() => setOpenLegal(null)}
      />
    </Inview>
  );
}
