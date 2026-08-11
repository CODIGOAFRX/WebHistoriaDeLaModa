import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html", host: "localhost" },
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
  assert.match(html, /Historiador del arte e investigador/i);
  assert.match(html, /Granada[^<]*2026/i);
  assert.match(html, /\/images\/brand\/logo-wordmark-white\.png/);
  assert.match(html, /\/images\/brand\/logo-icon\.png\?v=20260811/);
  for (const network of ["Instagram", "TikTok", "YouTube", "LinkedIn", "Spotify", "iVoox"]) {
    assert.match(html, new RegExp(`>${network}<`, "i"), network);
  }
  assert.match(html, /http:\/\/localhost\/og\.png/);
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
    ["/biblioteca", /Leer para mirar mejor/i],
    ["/escuela", /Aprender a mirar/i],
    ["/archivo", /Todo lo que deja huella/i],
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

  for (const pathname of ["/", "/podcasts", "/conferencias", "/biblioteca", "/escuela", "/archivo"]) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.doesNotMatch(await response.text(), forbidden, pathname);
  }
});

test("removes disposable starter assets and dependencies", async () => {
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton|site-creator-vinext-starter/);
  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});
