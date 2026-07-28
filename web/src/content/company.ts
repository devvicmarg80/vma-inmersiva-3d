/**
 * Content for the sections that follow the scroll-video story
 * (`ScrollExperience`). Sourced from `PRESENTACIÓN EJECUTIVA.docx` — the
 * holding's own executive deck — not fabricated.
 *
 * Two things that document leaves as placeholders are deliberately omitted
 * here rather than invented:
 * - Director/officer names (slide 8 lists them as "[Nombre Fundador
 *   Principal]" etc.) — `governance` below only names the committees, not
 *   people.
 * - Contact email/phone (slide 9) — already flagged unconfirmed in
 *   `content/copy.ts`; the contact form posts to `/api/contact` regardless
 *   of whether a public inbox is published yet.
 */

export type Filial = {
  name: string;
  focus: string;
};

export const filiales: Filial[] = [
  {
    name: "VMA Education & Innovation",
    focus: "Educación técnica y profesional.",
  },
  {
    name: "VMA Tech & Digital Solutions",
    focus: "Inclusión financiera y digital.",
  },
  {
    name: "VMA Infraestructura y Obras",
    focus: "Infraestructura social y comunitaria.",
  },
  {
    name: "VMA Sostenibilidad y RSE",
    focus: "Sostenibilidad y energías renovables.",
  },
  {
    name: "VMA Social Impact Projects",
    focus: "Proyectos de impacto social directo.",
  },
  {
    name: "VMA Financial Services Intl.",
    focus: "Gestión de fondos y servicios financieros internacionales.",
  },
];

export type FlagshipProject = {
  name: string;
  description: string;
};

export const flagshipProjects: FlagshipProject[] = [
  {
    name: "VMA Academy LATAM",
    description: "Plataforma educativa para formación técnica y profesional a distancia.",
  },
  {
    name: "Fondo verde para infraestructura rural sostenible",
    description: "Capital dirigido a infraestructura de bajo impacto en zonas rurales.",
  },
  {
    name: "Red de laboratorios digitales",
    description: "Espacios de emprendimiento juvenil equipados con tecnología digital.",
  },
];

export type DifcAdvantage = {
  title: string;
  body: string;
};

export const difcAdvantages: DifcAdvantage[] = [
  {
    title: "Exención fiscal",
    body: "Sin impuesto sobre ganancias ni dividendos para entidades constituidas en el DIFC.",
  },
  {
    title: "Common Law",
    body: "Marco legal independiente basado en derecho anglosajón, separado del sistema civil de EAU.",
  },
  {
    title: "Acceso a capital global",
    body: "Puerta de entrada a inversores institucionales internacionales y fondos islámicos.",
  },
  {
    title: "Seguridad jurídica",
    body: "Prestigio y estabilidad regulatoria reconocidos internacionalmente.",
  },
];

export type FinancialProjection = {
  label: string;
  prefix?: string;
  value: number;
  suffix?: string;
};

export const financialProjections: FinancialProjection[] = [
  {
    label: "Capital estimado bajo gestión (2025)",
    prefix: "USD ",
    value: 5,
    suffix: "M",
  },
  {
    label: "Crecimiento proyectado anual",
    value: 25,
    suffix: "% CAGR",
  },
  {
    label: "Rentabilidad promedio esperada",
    value: 15,
    suffix: "% anual",
  },
];

export const sdgGoals = [4, 8, 9, 11, 13, 17];

export const governanceCommittees = [
  "Auditoría y Gestión de Riesgos",
  "Ética y Sostenibilidad",
  "Inversión y Expansión Internacional",
];
