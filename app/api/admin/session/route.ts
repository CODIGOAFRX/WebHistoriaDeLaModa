import {
  createAdminSession,
  createAdminSessionCookie,
  isSameOriginRequest,
  isSecureRequest,
  verifyAdminCredentials,
} from "@/app/admin/auth";

type LoginPayload = {
  username: string;
  password: string;
};

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { error: "El origen de la solicitud no es válido." },
      { status: 403 },
    );
  }

  const wantsJson = request.headers
    .get("content-type")
    ?.toLowerCase()
    .includes("application/json");
  const credentials = await readCredentials(request, wantsJson);
  if (!credentials) {
    return loginFailure(request, wantsJson, 400, "Faltan las credenciales.");
  }

  const valid = await verifyAdminCredentials(
    credentials.username,
    credentials.password,
  );
  if (!valid) {
    return loginFailure(
      request,
      wantsJson,
      401,
      "El usuario o la contraseña no son correctos.",
    );
  }

  const token = await createAdminSession(credentials.username);
  const cookie = createAdminSessionCookie(token, isSecureRequest(request));
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Set-Cookie": cookie,
  });

  if (wantsJson) {
    headers.set("Content-Type", "application/json; charset=utf-8");
    return new Response(JSON.stringify({ authenticated: true }), {
      status: 200,
      headers,
    });
  }

  headers.set("Location", new URL("/admin", request.url).toString());
  return new Response(null, { status: 303, headers });
}

async function readCredentials(
  request: Request,
  wantsJson: boolean,
): Promise<LoginPayload | null> {
  try {
    if (wantsJson) {
      const payload = (await request.json()) as Record<string, unknown>;
      return stringCredentials(payload.username, payload.password);
    }

    const form = await request.formData();
    return stringCredentials(form.get("username"), form.get("password"));
  } catch {
    return null;
  }
}

function stringCredentials(
  username: unknown,
  password: unknown,
): LoginPayload | null {
  if (typeof username !== "string" || typeof password !== "string") return null;
  if (!username || !password || username.length > 256 || password.length > 1024) {
    return null;
  }
  return { username, password };
}

function loginFailure(
  request: Request,
  wantsJson: boolean,
  status: number,
  message: string,
): Response {
  if (wantsJson) {
    return Response.json(
      { error: message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }

  return new Response(null, {
    status: 303,
    headers: {
      "Cache-Control": "no-store",
      Location: new URL("/admin/login?error=credentials", request.url).toString(),
    },
  });
}
