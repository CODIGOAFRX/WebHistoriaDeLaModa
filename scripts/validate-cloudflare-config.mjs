import { readFile } from "node:fs/promises";

const configUrl = new URL("../wrangler.jsonc", import.meta.url);
const placeholderDatabaseId = "00000000-0000-4000-8000-000000000000";
const expectedSecrets = [
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
];

const config = JSON.parse(await readFile(configUrl, "utf8"));
const database = config.d1_databases?.find((entry) => entry.binding === "DB");
const mediaBucket = config.r2_buckets?.find((entry) => entry.binding === "MEDIA");

if (!database || !database.database_id || database.database_id === placeholderDatabaseId) {
  throw new Error(
    "Falta el database_id real de Cloudflare D1 en wrangler.jsonc. " +
      "Sigue docs/DESPLIEGUE_CLOUDFLARE.md antes de desplegar.",
  );
}

if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(database.database_id)) {
  throw new Error("El database_id de D1 en wrangler.jsonc no tiene formato UUID.");
}

if (!mediaBucket || mediaBucket.bucket_name !== "historia-de-la-moda-media") {
  throw new Error(
    "Falta el binding R2 MEDIA para guardar las portadas de los libros.",
  );
}

const customDomain = config.routes?.some(
  (route) => route.pattern === "historiadelamoda.net" && route.custom_domain === true,
);
if (!customDomain) {
  throw new Error("wrangler.jsonc no declara historiadelamoda.net como Custom Domain.");
}

if (config.workers_dev !== false) {
  throw new Error(
    "workers_dev debe estar desactivado para publicar exclusivamente en historiadelamoda.net.",
  );
}

const requiredSecrets = new Set(config.secrets?.required ?? []);
for (const secret of expectedSecrets) {
  if (!requiredSecrets.has(secret)) {
    throw new Error(`Falta declarar el secreto obligatorio ${secret} en wrangler.jsonc.`);
  }
}

console.log("Configuración Cloudflare válida: dominio, D1, R2 y secretos declarados.");
