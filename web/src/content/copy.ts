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
    id: "identidad",
    tag: "Quiénes somos",
    eyebrow: "VMA Grupo Empresarial de Desarrollo e Innovación S.A.S.",
    headline: "Desarrollo con propósito.",
    body: "Una organización comprometida con la transformación social a través de la educación, la infraestructura, la innovación tecnológica y la sostenibilidad — mejorando la calidad de vida de comunidades en Colombia y América Latina, con la responsabilidad social empresarial como pilar de cada proyecto.",
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
      { label: "Personas capacitadas", value: "7.000+" },
      { label: "Horas de clase impartidas", value: "210+" },
      { label: "Equipo con experiencia", value: "30+" },
      { label: "Planes de negocio desarrollados", value: "2.000+" },
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
 * - Confirmar correo/teléfono de contacto real — ningún documento fuente
 *   trae uno confirmado, así que el formulario de contacto sigue siendo el
 *   único canal hasta que se defina un inbox público.
 */
export const contact = {
  email: null as string | null,
  phone: null as string | null,
};
