import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSessionFromCookieHeader } from "../auth";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Acceso a administración",
  description: "Acceso privado al estudio de Historia de la Moda.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const requestHeaders = await headers();
  const existingSession = await getAdminSessionFromCookieHeader(
    requestHeaders.get("cookie"),
  );
  if (existingSession) redirect("/admin");

  const query = searchParams ? await searchParams : {};
  const errorCode = typeof query.error === "string" ? query.error : "";
  const errorMessage =
    errorCode === "credentials"
      ? "El usuario o la contraseña no son correctos."
      : errorCode === "rate-limit"
        ? "Demasiados intentos. Espera un minuto antes de volver a probar."
        : errorCode === "unavailable"
          ? "El acceso no está disponible temporalmente."
          : "";

  return (
    <div className={styles.loginPage}>
      <section className={styles.loginPanel} aria-labelledby="login-title">
        <div className={styles.loginIntro}>
          <p className={styles.eyebrow}>Estudio privado · Historia de la Moda</p>
          <h1 id="login-title">Acceso a administración.</h1>
          <p>
            Introduce el usuario y la contraseña temporal para gestionar la
            biblioteca y los cursos.
          </p>
        </div>

        <form
          className={styles.loginForm}
          action="/api/admin/session"
          method="post"
        >
          <label>
            <span>Usuario</span>
            <input
              name="username"
              type="text"
              autoComplete="username"
              required
            />
          </label>
          <label>
            <span>Contraseña</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {errorMessage ? (
            <p className={styles.loginError} role="alert">
              {errorMessage}
            </p>
          ) : null}
          <button type="submit">Entrar</button>
        </form>

        <div className={styles.loginFoot}>
          <p>Acceso provisional. Las credenciales se cambiarán antes de publicar.</p>
          <a href="/">Volver a la web</a>
        </div>
      </section>
    </div>
  );
}
