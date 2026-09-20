import assert from "node:assert/strict";
import test from "node:test";

const KEY = "radio-euskadi-de-cintura-para-abajo-pitillos.mp3";
const SIZE = 4096;
const BODY = new Uint8Array(SIZE).map((_, index) => index % 251);

function originStub({ honourRange = false } = {}) {
  return async (input, init = {}) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname !== `/audio/${KEY}`) return new Response("Not found", { status: 404 });

    const range = init.headers?.Range;
    if (honourRange && range) {
      const [, start, end] = /^bytes=(\d*)-(\d*)$/.exec(range) ?? [];
      const from = Number(start || 0);
      const to = end ? Number(end) : SIZE - 1;
      return new Response(BODY.slice(from, to + 1), {
        status: 206,
        headers: { "Content-Range": `bytes ${from}-${to}/${SIZE}` },
      });
    }
    return new Response(BODY, { status: 200, headers: { etag: '"stub"' } });
  };
}

async function fetchAudio(pathname, { headers = {}, origin = originStub() } = {}) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = origin;
  try {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
    const { default: worker } = await import(workerUrl.href);

    return await worker.fetch(
      new Request(`http://localhost${pathname}`, { headers: { host: "localhost", ...headers } }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
  } finally {
    globalThis.fetch = realFetch;
  }
}

test("la ruta de audio anuncia que admite fragmentos", async () => {
  const response = await fetchAudio(`/api/audio/${KEY}`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("accept-ranges"), "bytes");
  assert.equal(response.headers.get("content-type"), "audio/mpeg");
  assert.equal(Number(response.headers.get("content-length")), SIZE);
});

test("una petición con Range devuelve solo su fragmento", async () => {
  const response = await fetchAudio(`/api/audio/${KEY}`, {
    headers: { range: "bytes=1000-1099" },
  });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), `bytes 1000-1099/${SIZE}`);
  assert.equal(Number(response.headers.get("content-length")), 100);

  const chunk = new Uint8Array(await response.arrayBuffer());
  assert.deepEqual([...chunk], [...BODY.slice(1000, 1100)]);
});

test("un Range abierto llega hasta el final del archivo", async () => {
  const response = await fetchAudio(`/api/audio/${KEY}`, {
    headers: { range: "bytes=4000-" },
  });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), `bytes 4000-${SIZE - 1}/${SIZE}`);
  assert.equal((await response.arrayBuffer()).byteLength, SIZE - 4000);
});

test("un Range fuera del archivo se rechaza con 416", async () => {
  const response = await fetchAudio(`/api/audio/${KEY}`, {
    headers: { range: `bytes=${SIZE + 10}-` },
  });
  assert.equal(response.status, 416);
  assert.equal(response.headers.get("content-range"), `bytes */${SIZE}`);
});

test("si el origen ya resuelve el fragmento se reenvía sin recortar", async () => {
  const response = await fetchAudio(`/api/audio/${KEY}`, {
    headers: { range: "bytes=10-19" },
    origin: originStub({ honourRange: true }),
  });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), `bytes 10-19/${SIZE}`);
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [...BODY.slice(10, 20)]);
});

test("la ruta no sirve archivos ajenos al audio publicado", async () => {
  for (const pathname of ["/api/audio/nested/clip.mp3", "/api/audio/clip.webp"]) {
    const response = await fetchAudio(pathname);
    assert.equal(response.status, 404, pathname);
  }
});
