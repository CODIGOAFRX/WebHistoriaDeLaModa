type AudioRouteContext = {
  params: Promise<{ path: string[] }>;
};

/**
 * Los estáticos de la web se sirven siempre enteros: una petición con `Range`
 * recibe un 200 con el archivo completo. Para una imagen da igual, pero con un
 * corte de radio de veintidós minutos impide adelantar a un punto que todavía
 * no se ha descargado. Esta ruta pide el archivo a su propio origen y responde
 * 206 con el fragmento solicitado.
 */
const ALLOWED_KEY = /^[a-z0-9][a-z0-9-]*\.mp3$/;

type Fragment = { start: number; end: number };

function parseRange(header: string, size: number): Fragment | "unsatisfiable" | undefined {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return undefined;

  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return undefined;

  let start: number;
  let end: number;
  if (rawStart) {
    start = Number(rawStart);
    end = rawEnd ? Math.min(Number(rawEnd), size - 1) : size - 1;
  } else {
    // bytes=-N pide los últimos N bytes.
    const suffix = Number(rawEnd);
    if (!suffix) return "unsatisfiable";
    start = Math.max(size - suffix, 0);
    end = size - 1;
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) {
    return "unsatisfiable";
  }
  return { start, end };
}

export async function GET(request: Request, context: AudioRouteContext) {
  const { path } = await context.params;
  const key = path.join("/");
  if (path.length !== 1 || !ALLOWED_KEY.test(key)) {
    return new Response("Not found", { status: 404 });
  }

  const rangeHeader = request.headers.get("range");
  const upstream = await fetch(new URL(`/audio/${key}`, request.url), {
    headers: rangeHeader ? { Range: rangeHeader } : undefined,
  });
  if (upstream.status !== 200 && upstream.status !== 206) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": "audio/mpeg",
    "X-Content-Type-Options": "nosniff",
  });
  const etag = upstream.headers.get("etag");
  if (etag) headers.set("ETag", etag);

  // Si el origen ya ha resuelto el fragmento, se reenvía tal cual.
  if (upstream.status === 206) {
    for (const header of ["Content-Range", "Content-Length"]) {
      const value = upstream.headers.get(header);
      if (value) headers.set(header, value);
    }
    return new Response(upstream.body, { status: 206, headers });
  }

  const body = await upstream.arrayBuffer();
  const size = body.byteLength;
  const range = rangeHeader ? parseRange(rangeHeader, size) : undefined;

  if (range === "unsatisfiable") {
    headers.set("Content-Range", `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }
  if (!range) {
    headers.set("Content-Length", String(size));
    return new Response(body, { status: 200, headers });
  }

  const chunk = body.slice(range.start, range.end + 1);
  headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
  headers.set("Content-Length", String(chunk.byteLength));
  return new Response(chunk, { status: 206, headers });
}
