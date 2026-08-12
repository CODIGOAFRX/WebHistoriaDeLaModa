import { getAdminSessionFromCookieHeader } from "@/app/admin/auth";
import {
  ContentStorageUnavailableError,
  createContent,
  deleteContent,
  getAdminContent,
  updateContent,
  type ContentInput,
  type ContentKind,
} from "@/db/content";

type JsonRecord = Record<string, unknown>;

type AuthorizationResult =
  | { allowed: true }
  | { allowed: false; response: Response };

export async function GET(request: Request) {
  const authorization = await authorizeAdmin(request);
  if (!authorization.allowed) return authorization.response;

  try {
    const content = await getAdminContent();
    return Response.json(
      { ...content, storageAvailable: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeAdmin(request);
  if (!authorization.allowed) return authorization.response;
  const originError = validateWriteOrigin(request);
  if (originError) return originError;

  try {
    const payload = await readJsonObject(request);
    const kind = parseKind(payload.kind);
    const input = parseContentInput(payload, kind);
    const item =
      kind === "book"
        ? await createContent("book", input)
        : await createContent("course", input);
    return Response.json({ item, kind }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  const authorization = await authorizeAdmin(request);
  if (!authorization.allowed) return authorization.response;
  const originError = validateWriteOrigin(request);
  if (originError) return originError;

  try {
    const payload = await readJsonObject(request);
    const kind = parseKind(payload.kind);
    const id = parseId(payload.id);
    const content = await getAdminContent();
    const existing = (kind === "book" ? content.books : content.courses).find(
      (item) => item.id === id,
    );
    if (!existing) {
      return Response.json(
        { error: "El contenido solicitado ya no existe." },
        { status: 404 },
      );
    }
    const input = parseContentInput({ ...existing, ...payload }, kind);
    const item =
      kind === "book"
        ? await updateContent("book", id, input)
        : await updateContent("course", id, input);

    if (!item) {
      return Response.json(
        { error: "El contenido solicitado ya no existe." },
        { status: 404 },
      );
    }
    return Response.json({ item, kind });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  const authorization = await authorizeAdmin(request);
  if (!authorization.allowed) return authorization.response;
  const originError = validateWriteOrigin(request);
  if (originError) return originError;

  try {
    const url = new URL(request.url);
    let kindValue: unknown = url.searchParams.get("kind");
    let idValue: unknown = url.searchParams.get("id");
    if (kindValue === null || idValue === null) {
      const payload = await readJsonObject(request);
      kindValue ??= payload.kind;
      idValue ??= payload.id;
    }
    const kind = parseKind(kindValue);
    const id = parseId(idValue);
    const deleted = await deleteContent(kind, id);
    if (!deleted) {
      return Response.json(
        { error: "El contenido solicitado ya no existe." },
        { status: 404 },
      );
    }
    return Response.json({ deleted: true, id, kind });
  } catch (error) {
    return apiError(error);
  }
}

async function authorizeAdmin(request: Request): Promise<AuthorizationResult> {
  const session = await getAdminSessionFromCookieHeader(
    request.headers.get("cookie"),
  );
  if (!session) {
    return {
      allowed: false,
      response: Response.json(
        {
          error: "Debes iniciar sesión para administrar el contenido.",
          signInUrl: "/admin/login",
        },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      ),
    };
  }

  return { allowed: true };
}

function validateWriteOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  try {
    if (new URL(origin).origin === new URL(request.url).origin) return null;
  } catch {
    // A malformed Origin is rejected below.
  }

  return Response.json(
    { error: "El origen de la solicitud no es válido." },
    { status: 403 },
  );
}

async function readJsonObject(request: Request): Promise<JsonRecord> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    throw new RequestValidationError("El cuerpo debe contener JSON válido.");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new RequestValidationError("El cuerpo de la solicitud no es válido.");
  }
  return payload as JsonRecord;
}

function parseKind(value: unknown): ContentKind {
  if (value === "book" || value === "course") return value;
  throw new RequestValidationError("El tipo debe ser «book» o «course».");
}

function parseId(value: unknown): number {
  const id = typeof value === "string" ? Number(value) : value;
  if (typeof id !== "number" || !Number.isInteger(id) || id < 1) {
    throw new RequestValidationError("El identificador no es válido.");
  }
  return id;
}

function parseContentInput(
  payload: JsonRecord,
  kind: ContentKind,
): ContentInput {
  const title = stringField(payload.title, "El título", 160, true);
  const description = stringField(payload.description, "La descripción", 3000);
  const imageUrl = urlField(payload.imageUrl, "La URL de imagen", true);
  const category = stringField(payload.category, "La categoría", 80, true);
  const author = stringField(payload.author, "El autor", 120, true);
  const sortOrder = integerField(payload.sortOrder, "El orden", -10_000, 10_000);
  const priceCents = integerField(
    payload.priceCents,
    "El precio",
    0,
    100_000_000,
  );
  const status = payload.status;
  if (status !== "draft" && status !== "published") {
    throw new RequestValidationError(
      "El estado debe ser borrador o publicado.",
    );
  }

  return {
    title,
    description,
    imageUrl,
    category,
    author,
    sortOrder,
    priceCents,
    status,
    scormUrl:
      kind === "course"
        ? urlField(payload.scormUrl, "La URL de lanzamiento SCORM", true, true)
        : undefined,
  };
}

function stringField(
  value: unknown,
  label: string,
  maxLength: number,
  required = false,
): string {
  if (typeof value !== "string") {
    throw new RequestValidationError(`${label} debe ser texto.`);
  }
  const normalized = value.trim();
  if (required && !normalized) {
    throw new RequestValidationError(`${label} es obligatorio.`);
  }
  if (normalized.length > maxLength) {
    throw new RequestValidationError(
      `${label} no puede superar ${maxLength} caracteres.`,
    );
  }
  return normalized;
}

function integerField(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new RequestValidationError(
      `${label} debe ser un número entero entre ${minimum} y ${maximum}.`,
    );
  }
  return value;
}

function urlField(
  value: unknown,
  label: string,
  allowRelative: boolean,
  requireSecure = false,
): string {
  const url = stringField(value, label, 2048);
  if (!url) return "";

  if (
    allowRelative &&
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.includes("\\")
  ) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const localHttp =
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");
    if (
      parsed.protocol === "https:" ||
      (!requireSecure && parsed.protocol === "http:") ||
      localHttp
    ) {
      return url;
    }
  } catch {
    // Invalid URLs use the same user-facing error below.
  }
  throw new RequestValidationError(
    requireSecure
      ? `${label} debe usar HTTPS o comenzar por «/».`
      : `${label} debe usar http(s) o comenzar por «/».`,
  );
}

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

function apiError(error: unknown): Response {
  if (error instanceof RequestValidationError) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof ContentStorageUnavailableError) {
    return Response.json(
      {
        error:
          "La base de datos D1 no está enlazada. Configura el binding DB para guardar cambios.",
      },
      { status: 503 },
    );
  }

  console.error("Error al administrar el contenido", error);
  return Response.json(
    { error: "No se pudo completar la operación. Inténtalo de nuevo." },
    { status: 500 },
  );
}
