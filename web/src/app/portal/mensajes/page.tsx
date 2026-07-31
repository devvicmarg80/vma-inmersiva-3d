import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { requireSession } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db";

export const metadata: Metadata = {
  title: "Mensajes · Portal VMA",
  robots: { index: false, follow: false },
};

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  interest: string | null;
  message: string;
  created_at: string;
};

const INTEREST_LABELS: Record<string, string> = {
  invertir: "Invertir",
  aliado: "Aliado estratégico",
  otro: "Otro",
};

export default async function MensajesPage() {
  const { email } = await requireSession();
  // Not a 403 page — approved_users is VMA's external registration sheet
  // (investors/allies), not a staff directory, so a non-admin landing here
  // is the ordinary case, not an intrusion attempt worth surfacing as an
  // error. Send them back to the portal they do have access to.
  if (!isAdminEmail(email)) redirect("/portal");

  const messages = getDb()
    .prepare("SELECT * FROM contact_messages ORDER BY created_at DESC")
    .all() as ContactMessage[];

  return (
    <main className="flex min-h-dvh flex-col bg-[var(--ink)] pt-28">
      <section className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--cyan)]">
            Portal VMA
          </p>
          <h1 className="font-display mt-3 text-2xl font-bold text-white sm:text-3xl">
            Mensajes de contacto.
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {messages.length === 0
              ? "Todavía no hay mensajes."
              : `${messages.length} mensaje${messages.length === 1 ? "" : "s"} recibido${messages.length === 1 ? "" : "s"} vía el formulario "Hablemos".`}
          </p>

          <ul className="mt-8 space-y-4">
            {messages.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-white/10 bg-black/40 p-5 backdrop-blur-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="font-semibold text-white">{m.name}</p>
                  <p className="text-xs text-white/50">
                    {new Date(m.created_at + "Z").toLocaleString("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <a
                  href={`mailto:${m.email}`}
                  className="text-sm text-[var(--cyan)] hover:underline"
                >
                  {m.email}
                </a>
                {m.interest && (
                  <p className="mt-1 text-xs uppercase tracking-wide text-white/50">
                    {INTEREST_LABELS[m.interest] ?? m.interest}
                  </p>
                )}
                <p className="mt-3 whitespace-pre-wrap text-sm text-white/80">
                  {m.message}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
