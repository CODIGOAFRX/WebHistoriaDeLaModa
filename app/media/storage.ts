import { env } from "cloudflare:workers";
import { managedMediaKey } from "./images";

export type MediaObject = {
  body: ReadableStream<Uint8Array>;
  httpEtag?: string;
  httpMetadata?: { contentType?: string; cacheControl?: string };
};

export type MediaBucket = {
  put(
    key: string,
    value: ArrayBuffer | Uint8Array,
    options?: {
      httpMetadata?: { contentType?: string; cacheControl?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  get(key: string): Promise<MediaObject | null>;
  delete(key: string): Promise<void>;
};

export function getMediaBucket(): MediaBucket | undefined {
  return (env as unknown as { MEDIA?: MediaBucket }).MEDIA;
}

export async function deleteManagedMedia(url: string): Promise<void> {
  const key = managedMediaKey(url);
  if (!key) return;
  const bucket = getMediaBucket();
  if (!bucket) return;
  await bucket.delete(key);
}
