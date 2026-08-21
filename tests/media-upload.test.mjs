import assert from "node:assert/strict";
import test from "node:test";
import {
  createCoverKey,
  detectSupportedImage,
  managedMediaKey,
  MAX_COVER_BYTES,
  publicMediaUrl,
} from "../app/media/images.ts";

test("detects supported cover formats from their bytes", () => {
  assert.deepEqual(
    detectSupportedImage(Uint8Array.from([0xff, 0xd8, 0xff, 0xdb])),
    { contentType: "image/jpeg", extension: "jpg" },
  );
  assert.deepEqual(
    detectSupportedImage(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    { contentType: "image/png", extension: "png" },
  );
  assert.deepEqual(
    detectSupportedImage(new TextEncoder().encode("RIFFxxxxWEBP")),
    { contentType: "image/webp", extension: "webp" },
  );
  assert.deepEqual(
    detectSupportedImage(Uint8Array.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66])),
    { contentType: "image/avif", extension: "avif" },
  );
  assert.equal(detectSupportedImage(new TextEncoder().encode("<svg></svg>")), null);
});

test("creates private R2 keys and exposes only managed cover URLs", () => {
  const key = createCoverKey("webp");
  assert.match(key, /^book-covers\/\d{4}\/\d{2}\/[0-9a-f-]+\.webp$/i);
  const url = publicMediaUrl(key);
  assert.equal(managedMediaKey(url), key);
  assert.equal(managedMediaKey("https://example.com/cover.webp"), null);
  assert.equal(managedMediaKey("/media/../secret"), null);
  assert.equal(MAX_COVER_BYTES, 8 * 1024 * 1024);
});
