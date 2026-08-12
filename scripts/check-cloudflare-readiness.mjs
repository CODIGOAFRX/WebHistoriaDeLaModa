import { access, readdir, readFile, stat } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const distRoot = resolve(projectRoot, "dist");
const productionOrigin = "https://historiadelamoda.net";
const publicRoutes = [
  "/",
  "/podcasts",
  "/conferencias",
  "/escuela",
  "/archivo",
  "/biblioteca",
  "/contacto",
  "/admin/login",
];
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".map",
  ".mjs",
  ".svg",
  ".txt",
  ".xml",
]);
const machinePathPattern = /(?:\b[A-Za-z]:[\\/]|file:\/\/)/i;
const publicLocalReferencePattern = /(?:\b[A-Za-z]:[\\/]|file:\/\/|https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?)/i;

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const pathname = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(pathname)));
    else if (entry.isFile()) files.push(pathname);
  }
  return files;
}

async function assertNoMachinePaths(directory) {
  for (const pathname of await filesUnder(directory)) {
    if (!textExtensions.has(extname(pathname).toLowerCase())) continue;
    const contents = await readFile(pathname, "utf8");
    const match = contents.match(machinePathPattern);
    if (match) {
      throw new Error(
        `El artefacto ${relative(projectRoot, pathname)} contiene una ruta local: ${match[0]}`,
      );
    }
  }
}

async function render(worker, pathname) {
  return worker.fetch(
    new Request(`${productionOrigin}${pathname}`, {
      headers: {
        accept: "text/html",
        host: "historiadelamoda.net",
        "x-forwarded-host": "historiadelamoda.net",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function assertProductionHtml() {
  const serverEntry = resolve(distRoot, "server", "index.js");
  const serverModule = await import(`${pathToFileURL(serverEntry).href}?readiness=${Date.now()}`);
  const worker = serverModule.default;

  for (const pathname of publicRoutes) {
    const response = await render(worker, pathname);
    if (response.status !== 200) {
      throw new Error(`${pathname} respondió ${response.status} en la simulación de producción.`);
    }
    const html = await response.text();
    const localReference = html.match(publicLocalReferencePattern);
    if (localReference) {
      throw new Error(`${pathname} publica una referencia local: ${localReference[0]}`);
    }
    if (!html.includes("https://historiadelamoda.net")) {
      throw new Error(`${pathname} no contiene los metadatos del dominio de producción.`);
    }
  }

  for (const pathname of ["/robots.txt", "/sitemap.xml"]) {
    const response = await render(worker, pathname);
    if (response.status !== 200) {
      throw new Error(`${pathname} respondió ${response.status}.`);
    }
    const body = await response.text();
    if (publicLocalReferencePattern.test(body) || !body.includes("historiadelamoda.net")) {
      throw new Error(`${pathname} contiene una URL incorrecta.`);
    }
  }
}

async function assertSelfHostedFonts() {
  const expectedFonts = [
    "cormorant-garamond-latin.woff2",
    "cormorant-garamond-latin-italic.woff2",
    "manrope-latin.woff2",
  ];
  for (const filename of expectedFonts) {
    await access(resolve(distRoot, "client", "fonts", filename));
  }

  const stylesheets = (await filesUnder(resolve(distRoot, "client"))).filter(
    (pathname) => extname(pathname).toLowerCase() === ".css",
  );
  const css = (await Promise.all(stylesheets.map((pathname) => readFile(pathname, "utf8")))).join("\n");
  for (const filename of expectedFonts) {
    if (!css.includes(`/fonts/${filename}`)) {
      throw new Error(`El CSS de producción no referencia /fonts/${filename}.`);
    }
  }
}

const distStats = await stat(distRoot).catch(() => null);
if (!distStats?.isDirectory()) {
  throw new Error("No existe dist/. Ejecuta npm run build antes de esta comprobación.");
}

await assertNoMachinePaths(distRoot);
await assertSelfHostedFonts();
await assertProductionHtml();

console.log(
  `Cloudflare readiness OK: ${publicRoutes.length} páginas, robots, sitemap y artefactos sin rutas locales.`,
);
