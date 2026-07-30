"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { Spring } from "@/components/animation/springs/spring";
import type { LegalDocument } from "@/content/legal";

/**
 * Same glass-modal language as AuthModal (backdrop + panel Spring, portal
 * to document.body, scroll-lock, Escape-to-close) — generic over content
 * instead of a login form, since Habeas Data / PQR are read-only legal
 * text that's meaningfully longer than a form, hence the scrollable body.
 */
export function LegalModal({
  doc,
  open,
  onClose,
}: {
  doc: LegalDocument;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
    >
      <Spring
        tag="div"
        from={{ opacity: 0 }}
        to={{ opacity: 1 }}
        config={{ tension: 210, friction: 26 }}
        className="absolute inset-0 bg-[var(--ink)]/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <Spring
        tag="div"
        from={{ opacity: 0, y: 16 }}
        to={{ opacity: 1, y: 0 }}
        config={{ tension: 210, friction: 26 }}
        className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-[24px] border border-white/[0.08] bg-[var(--panel)]/90 shadow-2xl shadow-black/40 backdrop-blur-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6 pb-4">
          <h2 className="font-display text-lg font-bold text-white">
            {doc.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 text-white/50 transition-colors hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <p className="text-sm text-white/80">{doc.intro}</p>

          {doc.sections.map((section, i) => (
            <div key={i} className="mt-6">
              {section.heading && (
                <p className="text-sm font-semibold text-[var(--cyan)]">
                  {section.heading}
                </p>
              )}
              {section.body && (
                <p className="mt-1.5 text-sm text-white/75">{section.body}</p>
              )}
              {section.list && (
                <ul className="mt-2 space-y-1.5">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-white/75">
                      <Check size={15} className="mt-0.5 shrink-0 text-[var(--cyan)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-6 pt-4">
          <a
            href={`mailto:${doc.contactEmail}`}
            className="block w-full rounded-full px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-black/20 transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-90"
            style={{ background: "var(--gradient-cta)" }}
          >
            Escribir a {doc.contactEmail}
          </a>
        </div>
      </Spring>
    </div>,
    document.body,
  );
}
