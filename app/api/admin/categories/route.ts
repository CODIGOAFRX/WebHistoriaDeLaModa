import {
  authorizeAdminRequest,
  validateAdminWriteOrigin,
} from "@/app/api/admin/authorization";
import {
  ContentStorageUnavailableError,
  createCategory,
  deleteCategory,
  getCategoryCatalog,
  MAX_CATEGORY_LENGTH,
  type ContentKind,
} from "@/db/content";

export async function GET(request: Request) {
  const authorization = await authorizeAdminRequest(request);
  if (!authorization.allowed) return authorization.response;

  try {
    const categories = await getCategoryCatalog();
    return Response.json(
      { categories },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeAdminRequest(request);
  if (!authorization.allowed) return authorization.response;
  const originError = validateAdminWriteOrigin(request);
  if (originError) return originError;

  try {
    const payload = await readJsonObject(request);
    const kind = parseKind(payload.kind);
    const name = parseName(payload.name);
    const category = await createCategory(kind, name);
    return Response.json({ category }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  const authorization = await authorizeAdminRequest(request);
  if (!authorization.allowed) return authorization.response;
  const originError = validateAdminWriteOrigin(request);
  if (originError) return originError;

  try {
    const url = new URL(request.url);
    const kind = parseKind(url.searchParams.get("kind"));
    const id = parseId(url.searchParams.get("id"));
    const deleted = await deleteCategory(kind, id);
    if (!deleted) {
      return Response.json(
        { error: "La categoría solicitada ya no existe." },
        { status: 404 },
      );
    }
    return Response.json({ deleted: true, id, kind });
  } catch (error) {
    return apiError(error);
  }
}

async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown>> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    throw new CategoryValidationError("El cuerpo debe contener JSON válido.");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new CategoryValidationError("El cuerpo de la solicitud no es válido.");
  }
  return payload as Record<string, unknown>;
}

function parseKind(value: unknown): ContentKind {
  if (value === "book" || value === "course") return value;
  throw new CategoryValidationError("El tipo debe ser «book» o «course».");
}

function parseName(value: unknown): string {
  if (typeof value !== "string") {
    throw new CategoryValidationError("La categoría debe ser texto.");
  }
  const name = value.trim();
  if (!name) {
    throw new CategoryValidationError("La categoría necesita un nombre.");
  }
  if (name.length > MAX_CATEGORY_LENGTH) {
    throw new CategoryValidationError(
      `La categoría no puede superar ${MAX_CATEGORY_LENGTH} caracteres.`,
    );
  }
  return name;
}

function parseId(value: unknown): number {
  const id = typeof value === "string" ? Number(value) : value;
  if (typeof id !== "number" || !Number.isInteger(id) || id < 1) {
    throw new CategoryValidationError("El identificador no es válido.");
  }
  return id;
}

class CategoryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CategoryValidationError";
  }
}

function apiError(error: unknown): Response {
  if (error instanceof CategoryValidationError) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof ContentStorageUnavailableError) {
    return Response.json(
      {
        error:
          "La base de datos D1 no está enlazada. Configura el binding DB para guardar categorías.",
      },
      { status: 503 },
    );
  }

  console.error("Error al administrar las categorías", error);
  return Response.json(
    { error: "No se pudo completar la operación. Inténtalo de nuevo." },
    { status: 500 },
  );
}
