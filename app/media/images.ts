export const MAX_COVER_BYTES = 8 * 1024 * 1024;

export type SupportedImage = {
  contentType: "image/jpeg" | "image/png" | "image/webp" | "image/avif";
  extension: "jpg" | "png" | "webp" | "avif";
};

const ascii = new TextDecoder("ascii");

export function detectSupportedImage(bytes: Uint8Array): SupportedImage | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { contentType: "image/png", extension: "png" };
  }

  if (
    bytes.length >= 12 &&
    ascii.decode(bytes.subarray(0, 4)) === "RIFF" &&
    ascii.decode(bytes.subarray(8, 12)) === "WEBP"
  ) {
    return { contentType: "image/webp", extension: "webp" };
  }

  if (
    bytes.length >= 12 &&
    ascii.decode(bytes.subarray(4, 8)) === "ftyp" &&
    ["avif", "avis"].includes(ascii.decode(bytes.subarray(8, 12)))
  ) {
    return { contentType: "image/avif", extension: "avif" };
  }

  return null;
}

export function createCoverKey(extension: SupportedImage["extension"]): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `book-covers/${year}/${month}/${crypto.randomUUID()}.${extension}`;
}

export function publicMediaUrl(key: string): string {
  return `/media/${key}`;
}

export function managedMediaKey(value: string): string | null {
  const prefix = "/media/";
  if (!value.startsWith(prefix)) return null;
  const key = value.slice(prefix.length);
  return /^book-covers\/\d{4}\/\d{2}\/[0-9a-f-]+\.(?:jpg|png|webp|avif)$/i.test(key)
    ? key
    : null;
}
