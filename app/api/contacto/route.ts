import {
  buildContactEmail,
  readBodyWithinLimit,
  validateContactPayload,
} from "@/app/contacto/contact";

const MAX_BODY_BYTES = 16_384;

type ContactRateLimiter = {
  limit(options: { key: string }): Promise<{ success: boolean }>;
};

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const requestUrl = new URL(request.url);
    const originUrl = new URL(origin);
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
    const host = forwardedHost || request.headers.get("host") || requestUrl.host;
    return originUrl.host === host && originUrl.protocol === requestUrl.protocol;
  } catch {
    return false;
  }
}

function clientKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "local"
  );
}

async function contactRateLimiter(): Promise<ContactRateLimiter | undefined> {
  try {
    const { getContactRateLimiter } = await import("./rate-limit");
    return getContactRateLimiter();
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json(
      { error: "El origen de la solicitud no es válido." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return Response.json(
      { error: "El formulario es demasiado grande." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  let payload: unknown;
  try {
    const body = await readBodyWithinLimit(request, MAX_BODY_BYTES);
    if (!body.ok) {
      return Response.json(
        { error: "El formulario es demasiado grande." },
        { status: 413, headers: { "Cache-Control": "no-store" } },
      );
    }
    payload = JSON.parse(body.text);
  } catch {
    return Response.json(
      { error: "No se ha podido leer el formulario." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const validation = validateContactPayload(payload);
  if (!validation.ok) {
    return Response.json(
      { error: validation.error },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Los robots reciben una respuesta neutra sin generar correo.
  if (validation.isBot) {
    return Response.json(
      { sent: true },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  }

  const submissionId = readSubmissionId(payload);
  if (!submissionId) {
    return Response.json(
      { error: "No se ha podido identificar el envío. Recarga la página e inténtalo de nuevo." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONTACT_FROM_EMAIL?.trim();
  const to = process.env.CONTACT_TO_EMAIL?.trim() || "demedinamoda@gmail.com";
  if (!apiKey || !from) {
    return Response.json(
      {
        error:
          "El envío automático todavía no está configurado. Puedes escribir a demedinamoda@gmail.com.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const limiter = await contactRateLimiter();
  if (!limiter) {
    return Response.json(
      {
        error:
          "La protección antispam no está disponible. Puedes escribir a demedinamoda@gmail.com.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  let rateLimitResult: { success: boolean };
  try {
    rateLimitResult = await limiter.limit({ key: `contact:${clientKey(request)}` });
  } catch {
    return Response.json(
      {
        error:
          "La protección antispam no está disponible. Puedes escribir a demedinamoda@gmail.com.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!rateLimitResult.success) {
    return Response.json(
      { error: "Se han enviado demasiados mensajes. Inténtalo de nuevo más tarde." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  const email = buildContactEmail(validation.data);
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `contact-${submissionId}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: validation.data.email,
        subject: email.subject,
        text: email.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return Response.json(
      {
        error:
          "No se ha podido conectar con el servicio de correo. Puedes escribir a demedinamoda@gmail.com.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!response.ok) {
    return Response.json(
      {
        error:
          "No se ha podido enviar el mensaje ahora mismo. Puedes escribir a demedinamoda@gmail.com.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { sent: true },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}

function readSubmissionId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const value = (payload as Record<string, unknown>).submissionId;
  if (typeof value !== "string") return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}
