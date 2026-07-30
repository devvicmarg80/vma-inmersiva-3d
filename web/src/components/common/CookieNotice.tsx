"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "vma_cookie_notice_dismissed";

/**
 * Not a blocking consent gate — this site has no analytics/marketing/
 * third-party cookies to ask consent for (verified: nothing sets one
 * except the login's own session cookie, and that's only created when a
 * visitor actively logs in, never on page load for an anonymous visitor).
 * A GDPR-style "accept before you can browse" wall would be asking
 * consent for something that isn't there. This is informational only —
 * a small dismissible toast, shown once.
 */
export function CookieNotice() {
  // Starts hidden on both server and client — localStorage doesn't exist
  // during SSR, and reading it synchronously in the render body caused
  // real hydration mismatches elsewhere in this codebase (see
  // NarrativeTransition/PostVideoSections' reducedMotion state for the
  // same pattern). Only ever set from inside an effect, post-hydration.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(DISMISSED_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[var(--panel)]/90 p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:inset-x-auto sm:right-4"
    >
      <p className="text-sm text-white/80">
        Usamos únicamente la cookie esencial para mantener tu sesión
        iniciada — no usamos cookies de analítica ni de terceros. Más
        información en el aviso de{" "}
        <span className="text-[var(--cyan)]">Habeas Data</span> al final de
        la página.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="self-start rounded-full px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-90"
        style={{ background: "var(--gradient-cta)" }}
      >
        Entendido
      </button>
    </div>
  );
}
