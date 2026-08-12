import {
  expireAdminSessionCookie,
  isSameOriginRequest,
  isSecureRequest,
} from "@/app/admin/auth";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "El origen de la solicitud no es válido." }, { status: 403 });
  }

  return new Response(null, {
    status: 303,
    headers: {
      "Cache-Control": "no-store",
      Location: new URL("/admin/login", request.url).toString(),
      "Set-Cookie": expireAdminSessionCookie(isSecureRequest(request)),
    },
  });
}

export async function GET(request: Request) {
  return new Response(null, {
    status: 303,
    headers: {
      "Cache-Control": "no-store",
      Location: new URL("/admin", request.url).toString(),
    },
  });
}
