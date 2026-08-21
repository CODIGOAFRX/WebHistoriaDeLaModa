import { getMediaBucket } from "@/app/media/storage";

type MediaRouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(_request: Request, context: MediaRouteContext) {
  const { path } = await context.params;
  const key = path.join("/");
  if (!/^book-covers\/\d{4}\/\d{2}\/[0-9a-f-]+\.(?:jpg|png|webp|avif)$/i.test(key)) {
    return new Response("Not found", { status: 404 });
  }

  const bucket = getMediaBucket();
  if (!bucket) return new Response("Not found", { status: 404 });
  const object = await bucket.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Cache-Control":
      object.httpMetadata?.cacheControl || "public, max-age=31536000, immutable",
    "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  if (object.httpEtag) headers.set("ETag", object.httpEtag);
  return new Response(object.body, { headers });
}
