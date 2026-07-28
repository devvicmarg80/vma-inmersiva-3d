"use client";

import { useState } from "react";
import { Spring } from "@/components/animation/springs/spring";
import { scrollTo } from "@/utils/scroll-to";

const links = [
  { href: "#filiales", label: "Filiales" },
  { href: "#proyectos", label: "Proyectos" },
  { href: "#difc", label: "Dubái" },
  { href: "#proyecciones", label: "Proyecciones" },
  { href: "#gobierno", label: "Gobierno" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  // Anchor links jump via scrollTo() (the Lenis-aware utility) rather than
  // native browser fragment navigation — Lenis owns the scroll position via
  // its own rAF loop, so a plain browser anchor-jump gets fought/overridden
  // on the next frame instead of landing.
  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    scrollTo(id);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[var(--ink)]/45 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            scrollTo(0);
          }}
          className="shrink-0"
        >
          {/* Plain <img>, not next/image: this filesystem's image-optimizer
              cache writes come back corrupted (served as an AppleDouble
              resource-fork blob instead of PNG bytes) — confirmed via the
              raw file being valid and only the /_next/image output broken. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/vma-logo.png"
            alt="VMA"
            className="h-12 w-auto md:h-14"
          />
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={go(link.href.slice(1))}
              className="text-sm text-white/75 transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#contacto"
          onClick={go("contacto")}
          className="hidden rounded-full bg-[var(--ember)] px-5 py-2 text-sm font-semibold text-[var(--ink)] md:inline-block"
        >
          Invertir en VMA
        </a>

        <button
          type="button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className="h-px w-5 bg-white transition-transform duration-[var(--duration-fast)] ease-entrance"
            style={open ? { transform: "translateY(3.5px) rotate(45deg)" } : undefined}
          />
          <span
            className="h-px w-5 bg-white transition-transform duration-[var(--duration-fast)] ease-entrance"
            style={open ? { transform: "translateY(-3.5px) rotate(-45deg)" } : undefined}
          />
        </button>
      </div>

      {open && (
        <Spring
          tag="nav"
          from={{ opacity: 0, y: -12 }}
          to={{ opacity: 1, y: 0 }}
          config={{ tension: 210, friction: 26 }}
          className="md:hidden"
        >
          <div className="flex flex-col gap-1 px-6 pb-5">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={go(link.href.slice(1))}
                className="py-2 text-sm text-white/80"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contacto"
              onClick={go("contacto")}
              className="mt-2 rounded-full bg-[var(--ember)] px-5 py-2.5 text-center text-sm font-semibold text-[var(--ink)]"
            >
              Invertir en VMA
            </a>
          </div>
        </Spring>
      )}
    </header>
  );
}
