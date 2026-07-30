"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Spring } from "@/components/animation/springs/spring";
import { scrollTo } from "@/utils/scroll-to";
import { AuthButton } from "@/components/auth/AuthButton";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/proyectos", label: "Proyectos" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Route changes (tapping a nav link) should always close the mobile
  // sheet — without this it stays open behind the newly-loaded page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Without this the page behind the open mobile sheet still scrolls —
  // easy to do by accident while trying to tap a link.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const onContactPage = pathname === "/contacto";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[var(--ink)]/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              scrollTo(0);
            }
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
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm transition-colors duration-[var(--duration-fast)] ease-entrance ${
                  active ? "text-white" : "text-white/75 hover:text-white"
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute -bottom-1.5 left-0 h-px w-full bg-[var(--cyan)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <AuthButton />
          {/* Pointing "Invertir en VMA" at /contacto is a no-op on /contacto
              itself — the form is already right there. */}
          {!onContactPage && (
            <Link
              href="/contacto"
              className="rounded-full px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-90"
              style={{ background: "var(--gradient-cta)" }}
            >
              Invertir en VMA
            </Link>
          )}
        </div>

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
          className="border-t border-white/10 md:hidden"
        >
          <div className="flex flex-col gap-1 px-6 py-5">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-2 py-2.5 text-sm ${
                    active
                      ? "bg-white/10 font-semibold text-white"
                      : "text-white/80"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {!onContactPage && (
              <Link
                href="/contacto"
                className="mt-2 rounded-full px-5 py-2.5 text-center text-sm font-semibold text-white"
                style={{ background: "var(--gradient-cta)" }}
              >
                Invertir en VMA
              </Link>
            )}
            <AuthButton className="mt-2 w-full" />
          </div>
        </Spring>
      )}
    </header>
  );
}
