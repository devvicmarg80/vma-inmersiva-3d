"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/90 transition-colors duration-[var(--duration-fast)] ease-entrance hover:border-white/40 hover:text-white disabled:opacity-60"
    >
      {loading ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
