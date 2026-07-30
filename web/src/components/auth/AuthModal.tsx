"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Spring } from "@/components/animation/springs/spring";

type Mode = "login" | "activate";
type Status = "idle" | "submitting" | "error";

const inputClass =
  "w-full rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-[var(--duration-fast)] ease-entrance focus:border-[var(--cyan)]";

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || "Algo salió mal.");
  }
  return json.data;
}

export function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Same convention as SiteHeader's mobile sheet — without this the page
  // behind the modal keeps scrolling underneath it.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setStatus("idle");
    setError(null);
    firstFieldRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, mode, onClose]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const data = new FormData(e.currentTarget);
    try {
      if (mode === "login") {
        await postJson("/api/auth/login", {
          email: data.get("email"),
          password: data.get("password"),
        });
      } else {
        const password = data.get("password");
        const confirm = data.get("confirmPassword");
        if (password !== confirm) {
          throw new Error("Las contraseñas no coinciden.");
        }
        await postJson("/api/auth/activate", {
          email: data.get("email"),
          documento: data.get("documento"),
          password,
        });
      }
      onClose();
      router.push("/portal");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Algo salió mal.");
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "login" ? "Iniciar sesión" : "Activar cuenta"}
    >
      {/* Backdrop — translucent, not solid, per "ventana popup transparente". */}
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
        className="relative z-10 w-full max-w-md rounded-[24px] border border-white/[0.08] bg-[var(--panel)]/75 p-8 shadow-2xl shadow-black/40 backdrop-blur-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-5 top-5 text-white/50 transition-colors hover:text-white"
        >
          ✕
        </button>

        <h2 className="font-display text-xl font-bold text-white">
          {mode === "login" ? "Iniciar sesión" : "Activar cuenta"}
        </h2>
        <p className="mt-2 text-sm text-white/60">
          {mode === "login"
            ? "Accede al portal con tu correo y contraseña."
            : "Confirma tu correo y documento de identidad para crear tu contraseña."}
        </p>

        <div className="mt-6">
          <form key={mode} onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={firstFieldRef}
              name="email"
              type="email"
              required
              placeholder="Correo electrónico"
              aria-label="Correo electrónico"
              className={inputClass}
            />

            {mode === "activate" && (
              <input
                name="documento"
                type="text"
                required
                maxLength={50}
                placeholder="Número de documento de identidad"
                aria-label="Número de documento de identidad"
                className={inputClass}
              />
            )}

            <input
              name="password"
              type="password"
              required
              minLength={mode === "activate" ? 8 : undefined}
              placeholder={mode === "activate" ? "Nueva contraseña (mín. 8 caracteres)" : "Contraseña"}
              aria-label="Contraseña"
              className={inputClass}
            />

            {mode === "activate" && (
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                placeholder="Confirmar contraseña"
                aria-label="Confirmar contraseña"
                className={inputClass}
              />
            )}

            {status === "error" && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-opacity duration-[var(--duration-fast)] ease-entrance disabled:opacity-60"
              style={{ background: "var(--gradient-cta)" }}
            >
              {status === "submitting"
                ? "Validando…"
                : mode === "login"
                  ? "Ingresar"
                  : "Activar cuenta"}
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "activate" : "login")}
          className="mt-5 text-center text-sm text-[var(--cyan)] underline underline-offset-4"
        >
          {mode === "login"
            ? "¿No tienes cuenta activada? Actívala aquí"
            : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </Spring>
    </div>,
    document.body,
  );
}
