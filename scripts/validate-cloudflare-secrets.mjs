import { readFile } from "node:fs/promises";

const secretsUrl = new URL("../.env.production", import.meta.url);
const placeholders = [
  "elige-un-usuario-no-predecible",
  "elige-una-contrasena-larga-y-unica",
  "genera-una-cadena-aleatoria-de-al-menos-48-bytes",
  "re_sustituye_esta_clave",
];

let source;
try {
  source = await readFile(secretsUrl, "utf8");
} catch {
  throw new Error(
    "No existe .env.production. Cópialo desde .env.production.example y sustituye todos los valores.",
  );
}

const values = new Map();
for (const rawLine of source.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;
  const separator = line.indexOf("=");
  if (separator <= 0) continue;
  const key = line.slice(0, separator).trim();
  let value = line.slice(separator + 1).trim();
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1);
  }
  values.set(key, value);
}

const username = values.get("ADMIN_USERNAME") ?? "";
const password = values.get("ADMIN_PASSWORD") ?? "";
const sessionSecret = values.get("ADMIN_SESSION_SECRET") ?? "";
const resendKey = values.get("RESEND_API_KEY") ?? "";

for (const [key, value] of [
  ["ADMIN_USERNAME", username],
  ["ADMIN_PASSWORD", password],
  ["ADMIN_SESSION_SECRET", sessionSecret],
  ["RESEND_API_KEY", resendKey],
]) {
  if (!value || placeholders.includes(value)) {
    throw new Error(`${key} conserva un valor vacío o de ejemplo en .env.production.`);
  }
}

if (username.length < 3) {
  throw new Error("ADMIN_USERNAME debe tener al menos 3 caracteres.");
}
if (
  password.toLowerCase() === "admin" ||
  password.toLowerCase() === username.toLowerCase() ||
  password.length < 12
) {
  throw new Error(
    "ADMIN_PASSWORD debe ser distinta del usuario y tener al menos 12 caracteres.",
  );
}
if (sessionSecret.length < 48) {
  throw new Error("ADMIN_SESSION_SECRET debe contener al menos 48 caracteres aleatorios.");
}
if (!resendKey.startsWith("re_") || resendKey.length < 20) {
  throw new Error("RESEND_API_KEY no tiene el formato esperado de una clave real de Resend.");
}

console.log("Secretos de producción preparados: valores reales presentes y mínimos de seguridad superados.");
