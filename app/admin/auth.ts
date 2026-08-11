const ADMIN_COOKIE_NAME = "hdlm_admin_session";
const ADMIN_SESSION_VERSION = 1;
const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin";
const SESSION_DERIVATION_CONTEXT = "historia-de-la-moda/admin-session/v1";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type AdminEnvironment = Record<string, string | undefined>;

export type AdminSession = {
  username: string;
  issuedAt: number;
  expiresAt: number;
};

type SessionPayload = {
  v: number;
  u: string;
  iat: number;
  exp: number;
  n: string;
};

export function getAdminCredentials(
  environment: AdminEnvironment = process.env,
): { username: string; password: string } {
  return {
    username: nonEmpty(environment.ADMIN_USERNAME) ?? DEFAULT_ADMIN_USERNAME,
    password: nonEmpty(environment.ADMIN_PASSWORD) ?? DEFAULT_ADMIN_PASSWORD,
  };
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
  environment: AdminEnvironment = process.env,
): Promise<boolean> {
  const expected = getAdminCredentials(environment);
  const [usernameMatches, passwordMatches] = await Promise.all([
    secureTextEqual(username, expected.username),
    secureTextEqual(password, expected.password),
  ]);

  return usernameMatches && passwordMatches;
}

export async function createAdminSession(
  username: string,
  environment: AdminEnvironment = process.env,
  nowMilliseconds = Date.now(),
): Promise<string> {
  const now = Math.floor(nowMilliseconds / 1000);
  const nonce = new Uint8Array(16);
  crypto.getRandomValues(nonce);
  const payload: SessionPayload = {
    v: ADMIN_SESSION_VERSION,
    u: username,
    iat: now,
    exp: now + ADMIN_SESSION_TTL_SECONDS,
    n: toBase64Url(nonce),
  };
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await sign(encodedPayload, environment);

  return `${encodedPayload}.${toBase64Url(signature)}`;
}

export async function verifyAdminSession(
  token: string | null | undefined,
  environment: AdminEnvironment = process.env,
  nowMilliseconds = Date.now(),
): Promise<AdminSession | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  let receivedSignature: Uint8Array;
  try {
    receivedSignature = fromBase64Url(parts[1]);
  } catch {
    return null;
  }

  const expectedSignature = await sign(parts[0], environment);
  if (!secureBytesEqual(receivedSignature, expectedSignature)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(decoder.decode(fromBase64Url(parts[0]))) as SessionPayload;
  } catch {
    return null;
  }

  const now = Math.floor(nowMilliseconds / 1000);
  const expectedUsername = getAdminCredentials(environment).username;
  const usernameMatches =
    typeof payload.u === "string" &&
    (await secureTextEqual(payload.u, expectedUsername));
  const validTimes =
    Number.isInteger(payload.iat) &&
    Number.isInteger(payload.exp) &&
    payload.iat <= now + 60 &&
    payload.exp > now &&
    payload.exp - payload.iat === ADMIN_SESSION_TTL_SECONDS;

  if (
    payload.v !== ADMIN_SESSION_VERSION ||
    !usernameMatches ||
    !validTimes ||
    typeof payload.n !== "string" ||
    payload.n.length < 16
  ) {
    return null;
  }

  return {
    username: payload.u,
    issuedAt: payload.iat,
    expiresAt: payload.exp,
  };
}

export async function getAdminSessionFromCookieHeader(
  cookieHeader: string | null | undefined,
  environment: AdminEnvironment = process.env,
  nowMilliseconds = Date.now(),
): Promise<AdminSession | null> {
  const token = getCookieValue(cookieHeader, ADMIN_COOKIE_NAME);
  return verifyAdminSession(token, environment, nowMilliseconds);
}

export function createAdminSessionCookie(token: string, secure: boolean): string {
  const attributes = [
    `${ADMIN_COOKIE_NAME}=${token}`,
    "Path=/",
    `Max-Age=${ADMIN_SESSION_TTL_SECONDS}`,
    "HttpOnly",
    "SameSite=Strict",
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

export function expireAdminSessionCookie(secure: boolean): string {
  const attributes = [
    `${ADMIN_COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "HttpOnly",
    "SameSite=Strict",
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

export function isSecureRequest(request: Request): boolean {
  return new URL(request.url).protocol === "https:";
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function getCookieValue(
  cookieHeader: string | null | undefined,
  name: string,
): string | null {
  if (!cookieHeader) return null;

  for (const entry of cookieHeader.split(";")) {
    const separator = entry.indexOf("=");
    if (separator < 0) continue;
    if (entry.slice(0, separator).trim() !== name) continue;
    return entry.slice(separator + 1).trim();
  }
  return null;
}

async function sign(
  encodedPayload: string,
  environment: AdminEnvironment,
): Promise<Uint8Array> {
  const key = await sessionKey(environment);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encodedPayload),
  );
  return new Uint8Array(signature);
}

async function sessionKey(environment: AdminEnvironment): Promise<CryptoKey> {
  const explicitSecret = nonEmpty(environment.ADMIN_SESSION_SECRET);
  const credentials = getAdminCredentials(environment);
  const source =
    explicitSecret ??
    `${SESSION_DERIVATION_CONTEXT}\u0000${credentials.username}\u0000${credentials.password}`;
  const derivedSecret = await crypto.subtle.digest("SHA-256", encoder.encode(source));

  return crypto.subtle.importKey(
    "raw",
    derivedSecret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function secureTextEqual(left: string, right: string): Promise<boolean> {
  const [leftDigest, rightDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  return secureBytesEqual(
    new Uint8Array(leftDigest),
    new Uint8Array(rightDigest),
  );
}

function secureBytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

function toBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) {
    throw new Error("Base64url no válido.");
  }
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function nonEmpty(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}
