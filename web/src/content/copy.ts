export type Pillar = {
  label: string;
  body: string;
};

export type Act = {
  id: string;
  tag: string;
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  body?: string;
  pillars?: Pillar[];
  stats?: { label: string; value: string }[];
  cta?: { label: string; href: string }[];
  poster: string;
};

export const acts: Act[] = [
  {
    id: "genesis",
    tag: "Origen",
    headline: "Capital con destino.",
    subheadline:
      "Invertimos donde el capital se convierte en escuelas, vías y redes que conectan comunidades enteras.",
    poster: "/img/01.jpeg",
  },
  {
    id: "holding",
    tag: "Capital",
    eyebrow: "VMA Global Capital Holding · DIFC, Dubái",
    headline: "Un holding construido para canalizar capital hacia impacto real.",
    body: "Con sede en el Dubai International Financial Centre, VMA Global Capital Holding administra fondos, gestiona riesgo y dirige inversión hacia proyectos de educación, infraestructura, tecnología y sostenibilidad en Colombia y América Latina — bajo gobierno corporativo, informes trimestrales y salidas pactadas.",
    stats: [
      { label: "Accionistas fundadores", value: "60%" },
      { label: "Inversionistas estratégicos", value: "30%" },
      { label: "Inversión de impacto / semilla", value: "10%" },
    ],
    poster: "/img/02.jpeg",
  },
  {
    id: "puente",
    tag: "Transición",
    headline: "De la inversión a la transformación.",
    body: "VMA opera mediante alianzas estratégicas con gobiernos, empresas privadas y organizaciones sociales — asegurando que cada peso invertido se traduzca en un proyecto ejecutado, no en una promesa.",
    poster: "/img/03.jpeg",
  },
  {
    id: "territorio",
    tag: "Impacto",
    headline: "Cinco frentes. Un mismo territorio.",
    subheadline: "Así es como el capital se convierte en comunidad.",
    pillars: [
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
    ],
    poster: "/img/04.jpeg",
  },
  {
    id: "red-viva",
    tag: "Impacto",
    headline: "El impacto, medido.",
    subheadline: "No pedimos que nos crean — mostramos los números.",
    stats: [
      { label: "Personas capacitadas", value: "—" },
      { label: "Proyectos ejecutados en infraestructura", value: "—" },
      { label: "Comunidades con acceso a TIC", value: "—" },
      { label: "Líderes comunitarios formados", value: "—" },
    ],
    poster: "/img/04.jpeg",
  },
  {
    id: "horizonte",
    tag: "Cierre",
    headline: "El capital global ya tiene una dirección.",
    subheadline:
      "Súmate a la transformación de comunidades en Colombia y América Latina.",
    cta: [
      { label: "Invertir en VMA", href: "#contacto" },
      { label: "Ser un aliado estratégico", href: "#contacto" },
    ],
    poster: "/img/05.jpeg",
  },
];

/**
 * Pendiente antes de lanzar:
 * - Reemplazar los "—" del acto "red-viva" con cifras reales de VMA.
 * - Confirmar correo/teléfono de contacto real (el documento fuente traía
 *   placeholders "info@vmahgroup.com" / "+971 XXX XXX XXX" sin confirmar).
 */
export const contact = {
  email: null as string | null,
  phone: null as string | null,
};
