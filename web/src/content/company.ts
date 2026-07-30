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
 *
 * `whyVma` below is sourced from `OBJETO SOCIAL VMA.docx` — the SAS's own
 * constituted corporate purpose (items j and ñ), not restated marketing
 * language. Deliberately NOT sourced from `PRESENTACIÓN EJECUTIVA.docx`
 * (a draft pitch deck for a separate/unconfirmed "VMA Global Capital
 * Holding LLC" entity in Dubai, with unfilled placeholders and unlicensed
 * return projections) — none of that belongs on a public page.
 */

import {
  Lightbulb,
  HeartHandshake,
  Leaf,
  Users,
  ShieldCheck,
  Handshake,
  Building2,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

export const identity = {
  proposito:
    "Transformar comunidades a través de la innovación, la educación y el desarrollo sostenible, promoviendo el bienestar social, económico y cultural con un enfoque inclusivo y sostenible, alineado con los principios de la Responsabilidad Social Empresarial.",
  mision:
    "Brindar soluciones integrales en educación, infraestructura, telecomunicaciones, cultura y desarrollo social, impulsando el crecimiento de comunidades mediante programas innovadores, sostenibles y de alto impacto, siempre garantizando la responsabilidad social en cada uno de nuestros proyectos.",
  vision:
    "Ser la organización líder en el desarrollo integral de comunidades en Colombia y América Latina, reconocida por su impacto positivo en la calidad de vida de las personas, la sostenibilidad de sus proyectos y su compromiso con la responsabilidad social empresarial.",
};

export type StrategicArea = {
  label: string;
  body: string;
};

export const strategicAreas: StrategicArea[] = [
  {
    label: "Educación y capacitación",
    body: "Formación en TIC, cultura, emprendimiento y liderazgo con impacto social.",
  },
  {
    label: "Infraestructura y desarrollo",
    body: "Vías, telecomunicaciones y espacios comunitarios, construidos para durar.",
  },
  {
    label: "Innovación tecnológica",
    body: "Acceso a TIC, radio comunitaria y televisión digital, sin dejar a nadie fuera.",
  },
  {
    label: "Sostenibilidad y medio ambiente",
    body: "Energías limpias y responsabilidad social empresarial en cada proyecto.",
  },
  {
    label: "Alianzas estratégicas",
    body: "Gobierno, empresa privada y ONG, escalando juntos el impacto.",
  },
];

export type CoreValue = {
  title: string;
  body: string;
  icon: LucideIcon;
  image: string;
};

export const coreValues: CoreValue[] = [
  {
    title: "Innovación",
    body: "Soluciones creativas para transformar comunidades.",
    icon: Lightbulb,
    image: "/img/cards/innovacion.jpg",
  },
  {
    title: "Compromiso social",
    body: "Trabajamos por el bienestar de las personas y su entorno.",
    icon: HeartHandshake,
    image: "/img/cards/compromiso-social.jpg",
  },
  {
    title: "Sostenibilidad",
    body: "Desarrollo a largo plazo, respetando el medio ambiente.",
    icon: Leaf,
    image: "/img/cards/sostenibilidad.jpg",
  },
  {
    title: "Inclusión",
    body: "Oportunidades para todos, sin distinción.",
    icon: Users,
    image: "/img/cards/inclusion.jpg",
  },
  {
    title: "Transparencia",
    body: "Ética y responsabilidad en cada acción.",
    icon: ShieldCheck,
    image: "/img/cards/transparencia.jpg",
  },
  {
    title: "Colaboración",
    body: "Redes con actores estratégicos para maximizar el impacto.",
    icon: Handshake,
    image: "/img/cards/colaboracion.jpg",
  },
  {
    title: "Responsabilidad social empresarial",
    body: "Prácticas sostenibles y éticas en cada iniciativa.",
    icon: Building2,
    image: "/img/cards/rse.jpg",
  },
];

export type Differentiator = {
  title: string;
  body: string;
  icon: LucideIcon;
};

/**
 * Why VMA specifically — not principles (see `coreValues`), but the
 * concrete structural reasons a project executes and stays auditable.
 * Grounded in the SAS's own constituted objeto social (items j and ñ),
 * not marketing language: it's what VMA is legally set up to do, not just
 * what it says it values.
 */
export const whyVma: Differentiator[] = [
  {
    title: "Ejecución, no intermediación",
    body: "Cada alianza se traduce en un proyecto ejecutado — no en un compromiso que se diluye entre informes de avance.",
    icon: ClipboardCheck,
  },
  {
    title: "Puente legal, no informal",
    body: "El objeto social de VMA la constituye para operar como puente entre la comunidad, la empresa privada y el Estado — no es una posición de marketing, es su naturaleza jurídica.",
    icon: Handshake,
  },
  {
    title: "Auditoría, no solo transparencia declarada",
    body: "VMA tiene mandato constitutivo para adelantar interventoría y auditoría social y empresarial sobre el manejo de los recursos — propios y de terceros.",
    icon: ShieldCheck,
  },
];
