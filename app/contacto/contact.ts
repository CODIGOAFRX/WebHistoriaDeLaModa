export type ContactMessage = {
  name: string;
  email: string;
  organization: string;
  topic: string;
  message: string;
};

export const PUBLIC_CONTACT_EMAIL = "contacto@historiadelamoda.net";

type ResendEmail = {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  text: string;
};

export type ContactValidation =
  | { ok: true; data: ContactMessage; isBot: boolean }
  | { ok: false; error: string };

export type LimitedBodyRead =
  | { ok: true; text: string }
  | { ok: false; reason: "too-large" };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOPICS = new Set([
  "Conferencias y docencia",
  "Medios y entrevistas",
  "Colaboraciones",
  "Aula y cursos",
  "Otro",
]);

export async function readBodyWithinLimit(
  request: Request,
  maximumBytes: number,
): Promise<LimitedBodyRead> {
  if (!request.body) return { ok: true, text: "" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      byteLength += value.byteLength;
      if (byteLength > maximumBytes) {
        try {
          await reader.cancel();
        } catch {
          // The size decision is already known; cancellation is best effort.
        }
        return { ok: false, reason: "too-large" };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { ok: true, text: new TextDecoder().decode(bytes) };
}

function readText(
  record: Record<string, unknown>,
  key: string,
  maximumLength: number,
): string | null {
  const value = record[key];
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length <= maximumLength ? normalized : null;
}

export function validateContactPayload(payload: unknown): ContactValidation {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, error: "No se ha podido leer el formulario." };
  }

  const record = payload as Record<string, unknown>;
  const name = readText(record, "name", 100);
  const email = readText(record, "email", 254)?.toLowerCase() ?? null;
  const organization = record.organization === undefined
    ? ""
    : readText(record, "organization", 120);
  const topic = readText(record, "topic", 80);
  const message = readText(record, "message", 3_000);
  const website = record.website === undefined
    ? ""
    : readText(record, "website", 200);

  if (!name || name.length < 2) {
    return { ok: false, error: "Indica tu nombre." };
  }
  if (!email || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Indica un correo electrónico válido." };
  }
  if (organization === null) {
    return { ok: false, error: "El nombre de la entidad es demasiado largo." };
  }
  if (!topic || !TOPICS.has(topic)) {
    return { ok: false, error: "Selecciona el motivo del mensaje." };
  }
  if (!message || message.length < 20) {
    return { ok: false, error: "Cuéntanos un poco más en el mensaje." };
  }
  if (record.consent !== true) {
    return { ok: false, error: "Debes aceptar el uso de los datos para responderte." };
  }

  return {
    ok: true,
    isBot: Boolean(website),
    data: { name, email, organization, topic, message },
  };
}

export function buildContactEmail(data: ContactMessage) {
  const safeName = data.name.replace(/[\r\n]+/g, " ");
  const safeTopic = data.topic.replace(/[\r\n]+/g, " ");
  return {
    subject: `Contacto web · ${safeTopic} · ${safeName}`.slice(0, 180),
    text: [
      "Nuevo mensaje desde historiadelamoda.net",
      "",
      `Nombre: ${data.name}`,
      `Correo: ${data.email}`,
      `Entidad: ${data.organization || "No indicada"}`,
      `Motivo: ${data.topic}`,
      "",
      "Mensaje:",
      data.message,
    ].join("\n"),
  };
}

export function buildContactConfirmationEmail() {
  return {
    subject: "Hemos recibido tu mensaje · Historia de la Moda",
    text: [
      "Gracias por ponerte en contacto con el equipo de Historia de la Moda.",
      "",
      "Tu mensaje se ha recibido correctamente. Te responderemos lo antes posible.",
      "",
      "Un saludo,",
      "Equipo de Historia de la Moda",
      "https://historiadelamoda.net",
      PUBLIC_CONTACT_EMAIL,
      "",
      "Este es un mensaje automático de confirmación.",
    ].join("\n"),
  };
}

export function buildContactEmailBatch(
  data: ContactMessage,
  from: string,
  inbox = PUBLIC_CONTACT_EMAIL,
): ResendEmail[] {
  const notification = buildContactEmail(data);
  const confirmation = buildContactConfirmationEmail();

  return [
    {
      from,
      to: [inbox],
      reply_to: data.email,
      subject: notification.subject,
      text: notification.text,
    },
    {
      from,
      to: [data.email],
      reply_to: inbox,
      subject: confirmation.subject,
      text: confirmation.text,
    },
  ];
}
