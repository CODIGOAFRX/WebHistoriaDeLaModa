import {
  expireAdminSessionCookie,
  isSecureRequest,
} from "@/app/admin/auth";

export async function GET(request: Request) {
  return new Response(null, {
    status: 303,
    headers: {
      "Cache-Control": "no-store",
      Location: new URL("/admin/login", request.url).toString(),
      "Set-Cookie": expireAdminSessionCookie(isSecureRequest(request)),
    },
  });
}
