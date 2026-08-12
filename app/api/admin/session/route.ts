import {
  createAdminSession,
  createAdminSessionCookie,
  isAdminConfigurationReady,
  isLocalAdminHost,
  isSameOriginRequest,
  isSecureRequest,
  verifyAdminCredentials,
} from "@/app/admin/auth";

type LoginPayload = {
  username: string;
  password: string;
};

type AdminLoginRateLimiter = {
  limit(options: { key: string }): Promise<{ success: boolean }>;
};

const LOCAL_LOGIN_WINDOW_MS = 60_000;
const LOCAL_LOGIN_LIMIT = 8;
const localLoginAttempts = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request, username: string): string {
  const address =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "local";
  return `admin-login:${address}:${username.trim().toLocaleLowerCase("es")}`;
}

async function adminLoginRateLimiter(): Promise<AdminLoginRateLimiter | undefined> {
  try {
    const { getAdminLoginRateLimiter } = await import("./rate-limit");
    return getAdminLoginRateLimiter();
  } catch {
    return undefined;
  }
}

function isLocalRequest(request: Request): boolean {
  return isLocalAdminHost(new URL(request.url).host);
}

function localLoginLimit(key: string, now = Date.now()): { success: boolean } {
  const existing = localLoginAttempts.get(key);
  if (!existing || existing.resetAt <= now) {
    localLoginAttempts.set(key, { count: 1, resetAt: now + LOCAL_LOGIN_WINDOW_MS });
    return { success: true };
  }
  existing.count += 1;
  return { success: existing.count <= LOCAL_LOGIN_LIMIT };
}

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
    .includes("application/json") ?? false;
  const credentials = await readCredentials(request, wantsJson);
  if (!credentials) {
    return loginFailure(request, wantsJson, 400, "Faltan las credenciales.");
  }

  const authOptions = { allowInsecureDefaults: isLocalRequest(request) };
  if (!isAdminConfigurationReady(process.env, authOptions)) {
    return loginServiceFailure(
      request,
      wantsJson,
      503,
      "unavailable",
      "El acceso no está disponible temporalmente.",
    );
  }

  const limiter = await adminLoginRateLimiter();
  if (!limiter && !isLocalRequest(request)) {
    return loginServiceFailure(request, wantsJson, 503, "unavailable", "El acceso no está disponible temporalmente.");
  }

  try {
    const key = clientKey(request, credentials.username);
    const attempt = limiter
      ? await limiter.limit({ key })
      : localLoginLimit(key);
    if (!attempt.success) {
      return loginServiceFailure(
        request,
        wantsJson,
        429,
        "rate-limit",
        "Demasiados intentos. Espera un minuto antes de volver a probar.",
        { "Retry-After": "60" },
      );
    }
  } catch {
    if (isLocalRequest(request)) {
      const attempt = localLoginLimit(clientKey(request, credentials.username));
      if (attempt.success) {
        // Continue with credential verification below.
      } else {
        return loginServiceFailure(
          request,
          wantsJson,
          429,
          "rate-limit",
          "Demasiados intentos. Espera un minuto antes de volver a probar.",
          { "Retry-After": "60" },
        );
      }
    } else {
    return loginServiceFailure(request, wantsJson, 503, "unavailable", "El acceso no está disponible temporalmente.");
    }
  }

  const valid = await verifyAdminCredentials(
    credentials.username,
    credentials.password,
    process.env,
    authOptions,
  );
  if (!valid) {
    return loginFailure(
      request,
      wantsJson,
      401,
      "El usuario o la contraseña no son correctos.",
    );
  }

  const token = await createAdminSession(
    credentials.username,
    process.env,
    Date.now(),
    authOptions,
  );
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

function loginServiceFailure(
  request: Request,
  wantsJson: boolean,
  status: number,
  code: string,
  message: string,
  extraHeaders: Record<string, string> = {},
): Response {
  const headers = { "Cache-Control": "no-store", ...extraHeaders };
  if (wantsJson) return Response.json({ error: message }, { status, headers });
  return new Response(null, {
    status: 303,
    headers: {
      ...headers,
      Location: new URL(`/admin/login?error=${code}`, request.url).toString(),
    },
  });
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
