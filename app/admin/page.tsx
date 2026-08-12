import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  FALLBACK_BOOKS,
  FALLBACK_COURSES,
  getAdminContent,
} from "@/db/content";
import { AdminStudio } from "./AdminStudio";
import {
  getAdminSessionFromCookieHeader,
  isLocalAdminHost,
} from "./auth";

export const metadata: Metadata = {
  title: "Administración",
  description: "Gestión privada de la biblioteca y los cursos.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const requestHeaders = await headers();
  const session = await getAdminSessionFromCookieHeader(
    requestHeaders.get("cookie"),
    process.env,
    undefined,
    { allowInsecureDefaults: isLocalAdminHost(requestHeaders.get("host")) },
  );

  if (!session) redirect("/admin/login");

  let books = FALLBACK_BOOKS.map((book) => ({ ...book }));
  let courses = FALLBACK_COURSES.map((course) => ({ ...course }));
  let storageAvailable = false;
  let storageMessage =
    "D1 no está enlazado. Puedes revisar el estudio, pero guardar está desactivado.";

  try {
    const content = await getAdminContent();
    books = content.books;
    courses = content.courses;
    storageAvailable = true;
    storageMessage = "";
  } catch {
    // The read-only fallback keeps the studio visible until D1 is configured.
  }

  return (
    <AdminStudio
      initialBooks={books}
      initialCourses={courses}
      storageAvailable={storageAvailable}
      storageMessage={storageMessage}
      viewer={{
        displayName: session.username,
        email: "Sesión temporal protegida",
      }}
      localQa={false}
      signOutUrl="/admin/logout"
    />
  );
}
