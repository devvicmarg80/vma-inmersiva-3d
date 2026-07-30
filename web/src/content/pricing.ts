import { GraduationCap, Handshake, ShieldCheck, type LucideIcon } from "lucide-react";

/**
 * The 3 services on /precios map to the same 3 differentiators already used
 * in `whyVma` (below) — grounded in the SAS's real objeto social, not a
 * catalog VMA has already published. The copy here (title/tagline/
 * description/features) is original wording written for this page, not
 * text lifted from an approved VMA document.
 *
 * Prices are reference figures, not a confirmed VMA decision — flagged as
 * such in the UI ("Precio de referencia") until VMA sets final pricing.
 * USD figures use a fixed approximate rate (1 USD ≈ 4.000 COP); the project
 * has no live FX feed, so this is a static conversion, not a real-time one.
 */

export type PricingService = {
  id: string;
  icon: LucideIcon;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  priceCOP: number;
  priceUSD: number;
};

export const pricingServices: PricingService[] = [
  {
    id: "capacitacion",
    icon: GraduationCap,
    title: "Capacitación empresarial",
    tagline: "El mismo diplomado que ya cursan más de 130 personas.",
    description:
      "Formación en TIC, emprendimiento y liderazgo, con acompañamiento directo — el programa de capacitación que VMA ya opera, no un servicio nuevo sin probar.",
    features: [
      "Formación en TIC y herramientas digitales",
      "Emprendimiento y liderazgo aplicado",
      "Acompañamiento durante todo el programa",
      "Certificado al finalizar",
    ],
    priceCOP: 450000,
    priceUSD: 115,
  },
  {
    id: "alianzas",
    icon: Handshake,
    title: "Acompañamiento en alianzas estratégicas",
    tagline: "El puente entre tu proyecto, la empresa privada y el Estado.",
    description:
      "VMA está constituida legalmente para operar como intermediario entre comunidad, empresa privada y Estado — este servicio pone esa estructura al servicio de tu alianza.",
    features: [
      "Estructuración de la alianza público-privada",
      "Acceso a la red de contactos de VMA",
      "Acompañamiento en la negociación",
      "Seguimiento a la ejecución del acuerdo",
    ],
    priceCOP: 1200000,
    priceUSD: 300,
  },
  {
    id: "auditoria",
    icon: ShieldCheck,
    title: "Auditoría y transparencia",
    tagline: "Revisión externa del manejo de tus recursos.",
    description:
      "VMA tiene mandato constitutivo de interventoría y auditoría social y empresarial — un tercero que revisa cómo se usan los recursos, no solo una declaración de buenas intenciones.",
    features: [
      "Revisión del manejo de recursos propios o de terceros",
      "Informe de hallazgos y recomendaciones",
      "Metodología basada en el mandato de auditoría de VMA",
      "Confidencialidad de la información revisada",
    ],
    priceCOP: 2500000,
    priceUSD: 625,
  },
];
