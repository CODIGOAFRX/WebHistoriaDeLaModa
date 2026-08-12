import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render(pathname = "/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      ...init,
      headers: {
        accept: "text/html",
        host: "localhost",
        ...(init.headers || {}),
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

test("server-renders the finished Historia de la Moda homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="es"/i);
  assert.match(html, /Historia de la Moda/i);
  assert.match(html, /La moda[\s\S]*tambi.n[\s\S]*se piensa/i);
  assert.match(html, /\+400\.000/);
  assert.match(html, /Carlos S.nchez de Medina Alcina/i);
  const aboutLead = html.match(/<p[^>]*class="about-lead"[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "";
  const normalizedAboutLead = aboutLead.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  assert.equal(
    normalizedAboutLead,
    "Historiador del arte e investigador. Estudia la indumentaria y la moda como documentos culturales, expresiones de su contexto histórico, artístico y social.",
  );
  assert.match(html, /Granada[^<]*2026/i);
  assert.match(html, /\/images\/brand\/logo-wordmark-white\.png/);
  assert.match(html, /\/favicon\.ico/);
  for (const network of ["Instagram", "TikTok", "YouTube", "LinkedIn", "Spotify", "iVoox"]) {
    assert.match(html, new RegExp(`aria-label="Abrir ${network}`, "i"), network);
  }
  const navigation = html.match(/<nav\b[^>]*id="site-navigation"[^>]*>[\s\S]*?<\/nav>/i)?.[0] ?? "";
  assert.match(
    navigation,
    /Historia[\s\S]*Podcasts[\s\S]*Conferencias[\s\S]*Aula[\s\S]*Archivo[\s\S]*Biblioteca[\s\S]*Contacto/i,
  );
  assert.doesNotMatch(navigation, /Instagram/i);
  assert.match(html, /http:\/\/localhost\/og\.png/);
  assert.doesNotMatch(html, /class="book-section"|book-title-lines|book-publisher/i);
  assert.doesNotMatch(
    html,
    /doctorando|licenciado|Madrid|Rigor sin distancia|Una imagen, una puerta|Conversaci.n abierta|\u2197/i,
  );
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Building your site/i);
});

test("renders all primary public routes", async () => {
  const expectations = [
    ["/podcasts", /Moda para escuchar/i],
    ["/conferencias", /Pensar en voz alta/i],
    ["/biblioteca", /La biblioteca de Historia de la Moda/i],
    ["/escuela", /Aprender a mirar/i],
    ["/archivo", /En la televisi.n/i],
    ["/contacto", /Hablemos/i],
  ];

  for (const [pathname, heading] of expectations) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(await response.text(), heading, pathname);
  }
});

test("keeps the requested editorial removals out of every public route", async () => {
  const forbidden =
    /Una buena conferencia|Cada publicaci.n empieza|Aprender a leer una silueta|Los mejores vestidos de la historia del cine|La historia del abanico|Historias para escuchar|\u2197/i;

  for (const pathname of ["/", "/podcasts", "/conferencias", "/biblioteca", "/escuela", "/archivo", "/contacto"]) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.doesNotMatch(await response.text(), forbidden, pathname);
  }
});

test("contact endpoint validates requests and silently discards the honeypot", async () => {
  const common = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      origin: "http://localhost",
    },
  };
  const invalid = await render("/api/contacto", {
    ...common,
    body: JSON.stringify({ name: "A", email: "incorrecto" }),
  });
  assert.equal(invalid.status, 400);

  const honeypot = await render("/api/contacto", {
    ...common,
    body: JSON.stringify({
      name: "Ana Pérez",
      email: "ana@example.com",
      organization: "Museo",
      topic: "Otro",
      message: "Este mensaje tiene la longitud mínima solicitada.",
      website: "https://spam.example",
      consent: true,
    }),
  });
  assert.equal(honeypot.status, 202);
});

test("logout only expires the admin session through a same-origin POST", async () => {
  const readOnly = await render("/admin/logout");
  assert.equal(readOnly.status, 303);
  assert.match(readOnly.headers.get("location") ?? "", /\/admin$/);
  assert.equal(readOnly.headers.get("set-cookie"), null);

  const crossOrigin = await render("/admin/logout", {
    method: "POST",
    headers: { origin: "https://example.com" },
  });
  assert.equal(crossOrigin.status, 403);
  assert.equal(crossOrigin.headers.get("set-cookie"), null);

  const logout = await render("/admin/logout", {
    method: "POST",
    headers: { origin: "http://localhost" },
  });
  assert.equal(logout.status, 303);
  assert.match(logout.headers.get("location") ?? "", /\/admin\/login$/);
  assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/);
});

test("removes disposable starter assets and dependencies", async () => {
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton|site-creator-vinext-starter/);
  await assert.rejects(access(new URL("app/_sites-preview", templateRoot)));
  await access(new URL("app/favicon.ico", templateRoot));
  await access(new URL("app/icon.png", templateRoot));
});
