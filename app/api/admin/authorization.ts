import {
  getAdminSessionFromCookieHeader,
  isLocalAdminHost,
} from "@/app/admin/auth";

export type AdminAuthorizationResult =
  | { allowed: true }
  | { allowed: false; response: Response };

export async function authorizeAdminRequest(
  request: Request,
): Promise<AdminAuthorizationResult> {
  const session = await getAdminSessionFromCookieHeader(
    request.headers.get("cookie"),
    process.env,
    undefined,
    { allowInsecureDefaults: isLocalAdminHost(new URL(request.url).host) },
  );

  if (!session) {
    return {
      allowed: false,
      response: Response.json(
        {
          error: "Debes iniciar sesión para administrar el contenido.",
          signInUrl: "/admin/login",
        },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      ),
    };
  }

  return { allowed: true };
}

export function validateAdminWriteOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  try {
    if (new URL(origin).origin === new URL(request.url).origin) return null;
  } catch {
    // A malformed Origin is rejected below.
  }

  return Response.json(
    { error: "El origen de la solicitud no es válido." },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}
