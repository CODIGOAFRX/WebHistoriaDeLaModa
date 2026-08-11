import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import {
  chatGPTSignOutPath,
  getChatGPTUser,
  requireChatGPTUser,
} from "@/app/chatgpt-auth";
import {
  FALLBACK_BOOKS,
  FALLBACK_COURSES,
  getAdminContent,
  isAdminEmailAllowed,
  isLocalhostHost,
} from "@/db/content";
import { AdminStudio } from "./AdminStudio";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: "Administración",
  description: "Gestión privada de la biblioteca y los cursos.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const requestHeaders = await headers();
  const localQa = isLocalhostHost(requestHeaders.get("host"));
  let user = await getChatGPTUser();

  if (!localQa && !user) {
    user = await requireChatGPTUser("/admin");
  }

  if (!localQa && user && !isAdminEmailAllowed(user.email)) {
    return (
      <section className={styles.accessPage} aria-labelledby="access-title">
        <p className={styles.eyebrow}>Acceso restringido</p>
        <h1 id="access-title">Esta cuenta no puede abrir el estudio.</h1>
        <p>
          Has iniciado sesión como <strong>{user.email}</strong>, pero el correo no
          figura en la lista de administradores.
        </p>
        <div className={styles.accessActions}>
          <a href={chatGPTSignOutPath("/admin")}>Cambiar de cuenta</a>
          <Link href="/">Volver a la web</Link>
        </div>
      </section>
    );
  }

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
    // The public fallback keeps localhost QA usable until D1 is configured.
  }

  return (
    <AdminStudio
      initialBooks={books}
      initialCourses={courses}
      storageAvailable={storageAvailable}
      storageMessage={storageMessage}
      viewer={{
        displayName: user?.displayName ?? "QA local",
        email: user?.email ?? "localhost",
      }}
      localQa={localQa}
      signOutUrl={user ? chatGPTSignOutPath("/") : undefined}
    />
  );
}
