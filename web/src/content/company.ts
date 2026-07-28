/**
 * Content for the sections that follow the scroll-video story
 * (`ScrollExperience`). Sourced from `Presentación vma.pdf` — VMA's own
 * 17-slide deck (Quiénes somos, misión/visión, valores corporativos,
 * modelo de negocio) — not fabricated.
 *
 * Deliberately not carried over from that deck onto the landing page:
 * - The full org chart and KPI list (slides 8–10) — internal-facing detail,
 *   too dense for a public landing page.
 * - The 4-phase 2025–2030 roadmap (slides 12–15) — investor-deck detail,
 *   not landing-page copy.
 * - Director/officer names — not listed in any source document.
 */

export type CoreValue = {
  title: string;
  body: string;
};

export const coreValues: CoreValue[] = [
  {
    title: "Innovación",
    body: "Soluciones creativas para transformar comunidades.",
  },
  {
    title: "Compromiso social",
    body: "Trabajamos por el bienestar de las personas y su entorno.",
  },
  {
    title: "Sostenibilidad",
    body: "Desarrollo a largo plazo, respetando el medio ambiente.",
  },
  {
    title: "Inclusión",
    body: "Oportunidades para todos, sin distinción.",
  },
  {
    title: "Transparencia",
    body: "Ética y responsabilidad en cada acción.",
  },
  {
    title: "Colaboración",
    body: "Redes con actores estratégicos para maximizar el impacto.",
  },
  {
    title: "Responsabilidad social empresarial",
    body: "Prácticas sostenibles y éticas en cada iniciativa.",
  },
];
