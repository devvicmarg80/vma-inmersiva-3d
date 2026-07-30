import type { Metadata } from "next";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { requireSession } from "@/lib/auth/session";
import { LogoutButton } from "@/components/auth/LogoutButton";

// Login-gated — nothing here should show up in search results.
export const metadata: Metadata = {
  title: "Portal VMA",
  robots: { index: false, follow: false },
};

export default async function PortalPage() {
  const { email } = await requireSession();

  return (
    <main className="flex min-h-dvh flex-col bg-[var(--ink)] pt-28">
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--cyan)]">
          Portal VMA
        </p>
        <h1 className="font-display mt-3 text-3xl font-bold text-white md:text-5xl">
          Bienvenido.
        </h1>
        <p className="mt-4 max-w-md text-white/70">
          Sesión iniciada como <span className="text-white">{email}</span>.
          El contenido de esta sección se irá completando próximamente.
        </p>
        <div className="mt-8">
          <LogoutButton />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
