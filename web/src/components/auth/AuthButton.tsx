"use client";

import { useState } from "react";
import { AuthModal } from "./AuthModal";

/** Ghost-styled — sits next to the gradient "Invertir en VMA" CTA without
 * competing with it for attention. */
export function AuthButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/90 transition-colors duration-[var(--duration-fast)] ease-entrance hover:border-white/40 hover:text-white ${className}`}
      >
        Iniciar sesión
      </button>
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
