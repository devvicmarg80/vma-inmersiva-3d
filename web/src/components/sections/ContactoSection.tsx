"use client";

import { FormEvent, useState } from "react";
import { Handle } from "@/components/animation/springs/handle";
import { Inview } from "@/components/animation/springs/in-view";
import { SectionHeading } from "./SectionHeading";

type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full rounded-md border border-[var(--rule)] bg-[var(--paper-raised)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition-colors duration-[var(--duration-fast)] ease-entrance focus:border-[var(--cyan)]";

export function ContactoSection() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          interest: data.get("interest") || undefined,
          message: data.get("message"),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message || "No se pudo enviar el mensaje.");
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
    }
  }

  return (
    <section
      id="contacto"
      className="scroll-mt-24 bg-transparent px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-2xl">
        <SectionHeading
          eyebrow="Contacto"
          align="center"
          description="Cuéntanos si buscas invertir en VMA o convertirte en aliado estratégico — un miembro del equipo te responde directamente."
        >
          Hablemos.
        </SectionHeading>

        <Inview
          tag="div"
          from={{ opacity: 0, x: -90 }}
          to={{ opacity: 1, x: 0 }}
          mode="always"
          delayIn={250}
          config={{ tension: 120, friction: 26 }}
          className="mt-10"
        >
        <Handle
          enabled
          from={{ opacity: 0 }}
          to={{ opacity: 1 }}
          config={{ tension: 210, friction: 24 }}
        >
          {status === "success" ? (
            <div className="rounded-lg border border-[var(--rule)] bg-[var(--paper-raised)] p-8 text-center">
              <p className="text-lg font-semibold text-[var(--ink)]">
                Mensaje enviado.
              </p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                Gracias por escribirnos — te responderemos lo antes posible.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-6 text-sm font-semibold text-[var(--cyan)] underline underline-offset-4"
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  name="name"
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Nombre completo"
                  aria-label="Nombre completo"
                  className={inputClass}
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Correo electrónico"
                  aria-label="Correo electrónico"
                  className={inputClass}
                />
              </div>

              <select
                name="interest"
                defaultValue=""
                aria-label="¿Cuál es tu interés?"
                className={inputClass}
              >
                <option value="" disabled>
                  ¿Cuál es tu interés?
                </option>
                <option value="invertir">Invertir en VMA</option>
                <option value="aliado">Ser un aliado estratégico</option>
                <option value="otro">Otro</option>
              </select>

              <textarea
                name="message"
                required
                maxLength={2000}
                rows={5}
                placeholder="Mensaje"
                aria-label="Mensaje"
                className={inputClass}
              />

              {status === "error" && (
                <p className="text-sm text-red-600">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-opacity duration-[var(--duration-fast)] ease-entrance disabled:opacity-60"
                style={{ background: "var(--gradient-cta)" }}
              >
                {status === "submitting" ? "Enviando…" : "Enviar mensaje"}
              </button>
            </form>
          )}
        </Handle>
        </Inview>
      </div>
    </section>
  );
}
