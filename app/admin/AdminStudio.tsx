"use client";

import { useMemo, useState, type FormEvent } from "react";
import type {
  BookRecord,
  ContentKind,
  CourseRecord,
} from "@/db/content";
import styles from "./admin.module.css";

type AdminStudioProps = {
  initialBooks: BookRecord[];
  initialCourses: CourseRecord[];
  storageAvailable: boolean;
  storageMessage: string;
  viewer: { displayName: string; email: string };
  localQa: boolean;
  signOutUrl?: string;
};

type FormState = {
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  author: string;
  sortOrder: string;
  price: string;
  status: "draft" | "published";
  scormUrl: string;
};

type ApiContentResponse = {
  item: BookRecord | CourseRecord;
  kind: ContentKind;
};

type ApiCollectionResponse = {
  books: BookRecord[];
  courses: CourseRecord[];
  storageAvailable: boolean;
};

type Feedback = { tone: "success" | "error"; text: string } | null;

const moneyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export function AdminStudio({
  initialBooks,
  initialCourses,
  storageAvailable,
  storageMessage,
  viewer,
  localQa,
  signOutUrl,
}: AdminStudioProps) {
  const [activeKind, setActiveKind] = useState<ContentKind>("book");
  const [books, setBooks] = useState(() => sortContent(initialBooks));
  const [courses, setCourses] = useState(() => sortContent(initialCourses));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm("book", books.length));
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [storageReady, setStorageReady] = useState(storageAvailable);

  const items = activeKind === "book" ? books : courses;
  const publishedCount = useMemo(
    () => items.filter((item) => item.status === "published").length,
    [items],
  );

  function selectKind(kind: ContentKind) {
    if (busy) return;
    const count = kind === "book" ? books.length : courses.length;
    setActiveKind(kind);
    setEditingId(null);
    setForm(emptyForm(kind, count));
    setFeedback(null);
  }

  function startCreate() {
    if (busy) return;
    setEditingId(null);
    setForm(emptyForm(activeKind, items.length));
    setFeedback(null);
    focusEditor();
  }

  function startEdit(item: BookRecord | CourseRecord) {
    if (busy) return;
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
      category: item.category,
      author: item.author,
      sortOrder: String(item.sortOrder),
      price: (item.priceCents / 100).toFixed(2),
      status: item.status,
      scormUrl: isCourseRecord(item) ? item.scormUrl : "",
    });
    setFeedback(null);
    focusEditor();
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!storageReady || busy) return;

    const price = Number(form.price);
    const sortOrder = Number(form.sortOrder);
    if (!Number.isFinite(price) || price < 0) {
      setFeedback({ tone: "error", text: "Introduce un precio válido." });
      return;
    }
    if (!Number.isInteger(sortOrder)) {
      setFeedback({ tone: "error", text: "El orden debe ser un número entero." });
      return;
    }

    setBusy("save");
    setFeedback(null);
    try {
      const payload = {
        kind: activeKind,
        ...(editingId ? { id: editingId } : {}),
        title: form.title,
        description: form.description,
        imageUrl: form.imageUrl,
        category: form.category,
        author: form.author,
        sortOrder,
        priceCents: Math.round(price * 100),
        status: form.status,
        scormUrl: activeKind === "course" ? form.scormUrl : "",
      };
      const response = await requestJson<ApiContentResponse>(
        "/api/admin/content",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      upsertItem(response.kind, response.item);
      setEditingId(response.item.id);
      setFeedback({
        tone: "success",
        text: editingId ? "Cambios guardados." : "Contenido creado.",
      });
    } catch (error) {
      setFeedback({ tone: "error", text: errorMessage(error) });
    } finally {
      setBusy(null);
    }
  }

  async function togglePublished(item: BookRecord | CourseRecord) {
    if (!storageReady || busy) return;
    const nextStatus = item.status === "published" ? "draft" : "published";
    setBusy(`status-${item.id}`);
    setFeedback(null);
    try {
      const response = await requestJson<ApiContentResponse>(
        "/api/admin/content",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: activeKind,
            id: item.id,
            title: item.title,
            description: item.description,
            imageUrl: item.imageUrl,
            category: item.category,
            author: item.author,
            sortOrder: item.sortOrder,
            priceCents: item.priceCents,
            status: nextStatus,
            scormUrl: isCourseRecord(item) ? item.scormUrl : "",
          }),
        },
      );
      upsertItem(response.kind, response.item);
      if (editingId === item.id) {
        setForm((current) => ({ ...current, status: nextStatus }));
      }
      setFeedback({
        tone: "success",
        text: nextStatus === "published" ? "Contenido publicado." : "Movido a borradores.",
      });
    } catch (error) {
      setFeedback({ tone: "error", text: errorMessage(error) });
    } finally {
      setBusy(null);
    }
  }

  async function removeItem(item: BookRecord | CourseRecord) {
    if (!storageReady || busy) return;
    const confirmed = window.confirm(
      `¿Eliminar «${item.title}»? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setBusy(`delete-${item.id}`);
    setFeedback(null);
    try {
      await requestJson(
        `/api/admin/content?kind=${activeKind}&id=${item.id}`,
        { method: "DELETE" },
      );
      if (activeKind === "book") {
        setBooks((current) => current.filter((entry) => entry.id !== item.id));
      } else {
        setCourses((current) => current.filter((entry) => entry.id !== item.id));
      }
      if (editingId === item.id) {
        setEditingId(null);
        setForm(emptyForm(activeKind, Math.max(0, items.length - 1)));
      }
      setFeedback({ tone: "success", text: "Contenido eliminado." });
    } catch (error) {
      setFeedback({ tone: "error", text: errorMessage(error) });
    } finally {
      setBusy(null);
    }
  }

  async function refreshContent() {
    if (busy) return;
    setBusy("refresh");
    setFeedback(null);
    try {
      const response = await requestJson<ApiCollectionResponse>(
        "/api/admin/content",
        { cache: "no-store" },
      );
      setBooks(sortContent(response.books));
      setCourses(sortContent(response.courses));
      setStorageReady(response.storageAvailable);
      setFeedback({ tone: "success", text: "Contenido actualizado." });
    } catch (error) {
      setFeedback({ tone: "error", text: errorMessage(error) });
    } finally {
      setBusy(null);
    }
  }

  function upsertItem(kind: ContentKind, item: BookRecord | CourseRecord) {
    if (kind === "book") {
      setBooks((current) =>
        sortContent([
          ...current.filter((entry) => entry.id !== item.id),
          item as BookRecord,
        ]),
      );
    } else {
      setCourses((current) =>
        sortContent([
          ...current.filter((entry) => entry.id !== item.id),
          item as CourseRecord,
        ]),
      );
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Estudio privado · Historia de la Moda</p>
          <h1>Biblioteca y aula, bajo control.</h1>
          <p className={styles.heroCopy}>
            Crea, ordena y publica las recomendaciones y formaciones que verá la
            audiencia.
          </p>
        </div>
        <div className={styles.account}>
          <span className={styles.accountMark} aria-hidden="true">
            {initials(viewer.displayName)}
          </span>
          <span>
            <strong>{viewer.displayName}</strong>
            <small>{localQa ? "Sesión de QA en localhost" : viewer.email}</small>
          </span>
          {signOutUrl ? (
            <form action={signOutUrl} method="post">
              <button type="submit">Cerrar sesión</button>
            </form>
          ) : null}
        </div>
      </header>

      {!storageReady ? (
        <div className={styles.storageWarning} role="alert">
          <span aria-hidden="true">!</span>
          <div>
            <strong>Persistencia pendiente</strong>
            <p>{storageMessage}</p>
          </div>
          <button type="button" onClick={refreshContent} disabled={busy !== null}>
            Reintentar
          </button>
        </div>
      ) : null}

      <nav className={styles.tabs} aria-label="Tipo de contenido">
        <button
          type="button"
          className={activeKind === "book" ? styles.activeTab : undefined}
          aria-pressed={activeKind === "book"}
          disabled={busy !== null}
          onClick={() => selectKind("book")}
        >
          <span>Biblioteca</span>
          <strong>{books.length.toString().padStart(2, "0")}</strong>
        </button>
        <button
          type="button"
          className={activeKind === "course" ? styles.activeTab : undefined}
          aria-pressed={activeKind === "course"}
          disabled={busy !== null}
          onClick={() => selectKind("course")}
        >
          <span>Cursos</span>
          <strong>{courses.length.toString().padStart(2, "0")}</strong>
        </button>
        <div className={styles.tabActions}>
          <button type="button" onClick={refreshContent} disabled={busy !== null}>
            {busy === "refresh" ? "Actualizando…" : "Actualizar"}
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={startCreate}
            disabled={!storageReady || busy !== null}
          >
            + {activeKind === "book" ? "Nuevo libro" : "Nuevo curso"}
          </button>
        </div>
      </nav>

      {feedback ? (
        <div
          className={`${styles.feedback} ${
            feedback.tone === "error" ? styles.feedbackError : styles.feedbackSuccess
          }`}
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          {feedback.text}
        </div>
      ) : null}

      <div className={styles.workspace}>
        <aside className={styles.editor} id="admin-editor">
          <div className={styles.panelHeading}>
            <div>
              <p className={styles.eyebrow}>
                {editingId ? `Editando #${editingId}` : "Nueva ficha"}
              </p>
              <h2>
                {activeKind === "book" ? "Detalle del libro" : "Detalle del curso"}
              </h2>
            </div>
            {editingId ? (
              <button
                type="button"
                className={styles.textButton}
                onClick={startCreate}
                disabled={busy !== null}
              >
                Cancelar
              </button>
            ) : null}
          </div>

          <form className={styles.form} onSubmit={submitForm}>
            <label className={styles.fullField}>
              <span>Título *</span>
              <input
                id="admin-content-title"
                name="title"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                maxLength={160}
                required
                disabled={!storageReady}
                placeholder={
                  activeKind === "book" ? "Título del libro" : "Nombre del curso"
                }
              />
            </label>

            <label className={styles.fullField}>
              <span>Descripción</span>
              <textarea
                name="description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                maxLength={3000}
                rows={5}
                disabled={!storageReady}
                placeholder="Una nota breve, útil y honesta para quien la lea."
              />
              <small>{form.description.length}/3000</small>
            </label>

            <label>
              <span>Autor *</span>
              <input
                name="author"
                value={form.author}
                onChange={(event) =>
                  setForm((current) => ({ ...current, author: event.target.value }))
                }
                maxLength={120}
                required
                disabled={!storageReady}
              />
            </label>

            <label>
              <span>Categoría *</span>
              <input
                name="category"
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
                maxLength={80}
                required
                disabled={!storageReady}
              />
            </label>

            <label className={styles.fullField}>
              <span>URL de imagen</span>
              <input
                name="imageUrl"
                type="text"
                inputMode="url"
                value={form.imageUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, imageUrl: event.target.value }))
                }
                maxLength={2048}
                disabled={!storageReady}
                placeholder="https://… o /images/…"
              />
            </label>

            {activeKind === "course" ? (
              <label className={styles.fullField}>
                <span>URL de lanzamiento SCORM</span>
                <input
                  name="scormUrl"
                  type="text"
                  inputMode="url"
                  value={form.scormUrl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      scormUrl: event.target.value,
                    }))
                  }
                  maxLength={2048}
                  disabled={!storageReady}
                  placeholder="https://… o /cursos/mi-scorm/index.html"
                />
                <small>Apunta al archivo de inicio del paquete ya desplegado.</small>
              </label>
            ) : null}

            <label>
              <span>Precio (€)</span>
              <input
                name="price"
                type="number"
                min="0"
                max="1000000"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  setForm((current) => ({ ...current, price: event.target.value }))
                }
                required
                disabled={!storageReady}
              />
            </label>

            <label>
              <span>Orden</span>
              <input
                name="sortOrder"
                type="number"
                min="-10000"
                max="10000"
                step="1"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sortOrder: event.target.value,
                  }))
                }
                required
                disabled={!storageReady}
              />
            </label>

            <label className={styles.fullField}>
              <span>Estado</span>
              <select
                name="status"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as FormState["status"],
                  }))
                }
                disabled={!storageReady}
              >
                <option value="draft">Borrador · solo visible aquí</option>
                <option value="published">Publicado · visible en la web</option>
              </select>
            </label>

            <button
              className={`${styles.primaryButton} ${styles.saveButton}`}
              type="submit"
              disabled={!storageReady || busy !== null}
            >
              {busy === "save"
                ? "Guardando…"
                : editingId
                  ? "Guardar cambios"
                  : `Crear ${activeKind === "book" ? "libro" : "curso"}`}
            </button>
          </form>
        </aside>

        <section className={styles.catalog} aria-labelledby="catalog-title">
          <div className={styles.panelHeading}>
            <div>
              <p className={styles.eyebrow}>Colección actual</p>
              <h2 id="catalog-title">
                {activeKind === "book" ? "Libros" : "Cursos"}
              </h2>
            </div>
            <p className={styles.countSummary}>
              <strong>{publishedCount}</strong> publicados · {items.length - publishedCount}{" "}
              borradores
            </p>
          </div>

          {items.length === 0 ? (
            <div className={styles.emptyState}>
              <span aria-hidden="true">00</span>
              <h3>Aún no hay contenido.</h3>
              <p>Crea la primera ficha para empezar a construir esta colección.</p>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={startCreate}
                disabled={!storageReady}
              >
                Crear ahora
              </button>
            </div>
          ) : (
            <div className={styles.itemList}>
              {items.map((item) => (
                <article
                  className={`${styles.itemCard} ${
                    editingId === item.id ? styles.selectedCard : ""
                  }`}
                  key={item.id}
                >
                  <div
                    className={styles.cover}
                    style={
                      item.imageUrl
                        ? { backgroundImage: `url(${JSON.stringify(item.imageUrl)})` }
                        : undefined
                    }
                    role={item.imageUrl ? "img" : undefined}
                    aria-label={item.imageUrl ? `Imagen de ${item.title}` : undefined}
                  >
                    {!item.imageUrl ? (
                      <span aria-hidden="true">{initials(item.title)}</span>
                    ) : null}
                  </div>

                  <div className={styles.itemBody}>
                    <div className={styles.itemMeta}>
                      <span
                        className={
                          item.status === "published"
                            ? styles.publishedBadge
                            : styles.draftBadge
                        }
                      >
                        {item.status === "published" ? "Publicado" : "Borrador"}
                      </span>
                      <span>{item.category}</span>
                      <span>Orden {item.sortOrder}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p className={styles.byline}>{item.author}</p>
                    <p className={styles.itemDescription}>
                      {item.description || "Sin descripción todavía."}
                    </p>
                    <div className={styles.itemFoot}>
                      <strong>
                        {item.priceCents > 0
                          ? moneyFormatter.format(item.priceCents / 100)
                          : "Sin precio"}
                      </strong>
                      {isCourseRecord(item) && item.scormUrl ? (
                        <a href={item.scormUrl} target="_blank" rel="noreferrer">
                          Probar SCORM
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      aria-label={`Editar ${item.title}`}
                      onClick={() => startEdit(item)}
                      disabled={busy !== null}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      aria-label={`${item.status === "published" ? "Retirar" : "Publicar"} ${item.title}`}
                      onClick={() => togglePublished(item)}
                      disabled={!storageReady || busy !== null}
                    >
                      {busy === `status-${item.id}`
                        ? "Guardando…"
                        : item.status === "published"
                          ? "Retirar"
                          : "Publicar"}
                    </button>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      aria-label={`Eliminar ${item.title}`}
                      onClick={() => removeItem(item)}
                      disabled={!storageReady || busy !== null}
                    >
                      {busy === `delete-${item.id}` ? "Eliminando…" : "Eliminar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function emptyForm(kind: ContentKind, itemCount: number): FormState {
  return {
    title: "",
    description: "",
    imageUrl: "",
    category: kind === "book" ? "Biblioteca" : "Formación",
    author: "Carlos Sánchez de Medina",
    sortOrder: String((itemCount + 1) * 10),
    price: "0.00",
    status: "draft",
    scormUrl: "",
  };
}

function sortContent<T extends BookRecord>(items: T[]): T[] {
  return [...items].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.id - right.id,
  );
}

function isCourseRecord(
  item: BookRecord | CourseRecord,
): item is CourseRecord {
  return "scormUrl" in item && typeof item.scormUrl === "string";
}

function initials(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "HM";
  return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
}

function focusEditor() {
  window.setTimeout(() => {
    const editor = document.getElementById("admin-editor");
    editor?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
    document
      .getElementById("admin-content-title")
      ?.focus({ preventScroll: true });
  }, 50);
}

async function requestJson<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    signInUrl?: string;
  } & T;

  if (!response.ok) {
    if (response.status === 401 && payload.signInUrl) {
      window.location.assign(payload.signInUrl);
    }
    throw new Error(payload.error || "La operación no se pudo completar.");
  }
  return payload;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "La operación no se pudo completar.";
}
