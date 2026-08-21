import {
  authorizeAdminRequest,
  validateAdminWriteOrigin,
} from "@/app/api/admin/authorization";
import {
  createCoverKey,
  detectSupportedImage,
  managedMediaKey,
  MAX_COVER_BYTES,
  publicMediaUrl,
} from "@/app/media/images";
import { getMediaBucket } from "@/app/media/storage";

const MAX_MULTIPART_BYTES = MAX_COVER_BYTES + 64 * 1024;

export async function POST(request: Request) {
  const authorization = await authorizeAdminRequest(request);
  if (!authorization.allowed) return authorization.response;
  const originError = validateAdminWriteOrigin(request);
  if (originError) return originError;

  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_MULTIPART_BYTES) {
    return mediaError("La portada no puede superar 8 MB.", 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return mediaError("No se ha podido leer el archivo seleccionado.", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return mediaError("Selecciona una imagen para la portada.", 400);
  }
  if (file.size < 1) return mediaError("La imagen está vacía.", 400);
  if (file.size > MAX_COVER_BYTES) {
    return mediaError("La portada no puede superar 8 MB.", 413);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const image = detectSupportedImage(bytes);
  if (!image) {
    return mediaError("Usa una imagen JPG, PNG, WebP o AVIF.", 415);
  }

  const bucket = getMediaBucket();
  if (!bucket) {
    return mediaError(
      "El almacenamiento de portadas todavía no está disponible.",
      503,
    );
  }

  const key = createCoverKey(image.extension);
  try {
    await bucket.put(key, bytes, {
      httpMetadata: {
        contentType: image.contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        originalName: file.name.slice(0, 240),
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error al guardar la portada", error);
    return mediaError("No se ha podido guardar la portada. Inténtalo de nuevo.", 500);
  }

  return Response.json(
    {
      url: publicMediaUrl(key),
      contentType: image.contentType,
      size: file.size,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: Request) {
  const authorization = await authorizeAdminRequest(request);
  if (!authorization.allowed) return authorization.response;
  const originError = validateAdminWriteOrigin(request);
  if (originError) return originError;

  const key = managedMediaKey(new URL(request.url).searchParams.get("url") || "");
  if (!key) return mediaError("La portada indicada no es válida.", 400);
  const bucket = getMediaBucket();
  if (!bucket) {
    return mediaError("El almacenamiento de portadas no está disponible.", 503);
  }

  await bucket.delete(key);
  return Response.json(
    { deleted: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}

function mediaError(message: string, status: number): Response {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
