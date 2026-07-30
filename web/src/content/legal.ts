/**
 * Habeas Data: sourced verbatim (structure and content) from VMA's real
 * "POLÍTICA DE HABEAS DATA VMA.pdf" — responsable, dirección, correo y
 * derechos del titular tal como están en el documento, no redactados de
 * cero.
 *
 * PQR: no existía un documento fuente para esto — compuesto siguiendo los
 * términos de respuesta de la Ley 1755 de 2015 (derecho de petición;
 * referencia estándar que la mayoría de empresas privadas colombianas
 * adopta como su propio compromiso de servicio, aunque la ley en sentido
 * estricto rige a entidades públicas), usando el mismo correo de contacto
 * que Habeas Data — así lo pidió el usuario.
 */

export type LegalSection = {
  heading?: string;
  body?: string;
  list?: string[];
};

export type LegalDocument = {
  title: string;
  intro: string;
  sections: LegalSection[];
  contactEmail: string;
};

const CONTACT_EMAIL = "habeasdata@desarrolloeinnovacionvma.com.co";

export const habeasData: LegalDocument = {
  title: "Política de Tratamiento de Datos Personales (Habeas Data)",
  intro:
    "VMA Grupo Empresarial de Desarrollo e Innovación Internacional S.A.S. (Carrera 7 # 72 – 64, Bogotá D.C.) protege los datos personales que recolecta a través de sus formularios, programas de formación y canales digitales, conforme a la Ley 1581 de 2012.",
  sections: [
    {
      heading: "Tratamiento de datos",
      body: "Los datos personales se recolectan para:",
      list: [
        "Gestión administrativa y comercial",
        "Envío de comunicaciones",
        "Registro en programas de formación y asesorías",
        "Seguridad de la información",
        "Obligaciones legales y contractuales",
      ],
    },
    {
      heading: "Principios aplicables (Ley 1581 de 2012)",
      list: ["Legalidad", "Finalidad", "Libertad", "Veracidad", "Seguridad", "Confidencialidad"],
    },
    {
      heading: "Derechos del titular",
      body: "El titular de los datos podrá:",
      list: [
        "Conocer, actualizar y rectificar sus datos",
        "Solicitar certificación de autorización",
        "Solicitar la eliminación de datos cuando proceda",
        "Presentar quejas ante la Superintendencia de Industria y Comercio (SIC)",
      ],
    },
    {
      heading: "Medidas de seguridad",
      body: "VMA implementa protocolos físicos, electrónicos y administrativos para garantizar la integridad, reserva y disponibilidad de la información.",
    },
  ],
  contactEmail: CONTACT_EMAIL,
};

export const pqr: LegalDocument = {
  title: "Peticiones, Quejas y Reclamos (PQR)",
  intro:
    "Cualquier persona puede presentar una petición, queja, reclamo o sugerencia relacionada con los servicios de VMA a través del correo de atención — el mismo canal dispuesto para asuntos de Habeas Data.",
  sections: [
    {
      heading: "Qué debe incluir tu solicitud",
      list: [
        "Nombre completo y número de documento de identidad",
        "Descripción clara del hecho, petición o motivo del reclamo",
        "Datos de contacto para recibir respuesta",
      ],
    },
    {
      heading: "Tiempos de respuesta",
      body: "VMA atiende cada solicitud siguiendo los términos de la Ley 1755 de 2015 (derecho de petición):",
      list: [
        "Peticiones generales: hasta 15 días hábiles",
        "Solicitudes de información o documentos: hasta 10 días hábiles",
      ],
    },
    {
      heading: "Prórroga",
      body: "Si excepcionalmente no es posible resolver la solicitud dentro de esos plazos, VMA informará al solicitante antes del vencimiento del término, explicando los motivos y el plazo razonable en que será resuelta.",
    },
  ],
  contactEmail: CONTACT_EMAIL,
};
