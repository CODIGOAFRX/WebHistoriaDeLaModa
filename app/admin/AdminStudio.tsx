"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type {
  BookRecord,
  CategoryRecord,
  ContentKind,
  CourseRecord,
} from "@/db/content";
import styles from "./admin.module.css";

type AdminStudioProps = {
  initialBooks: BookRecord[];
  initialCourses: CourseRecord[];
  initialCategories: CategoryRecord[];
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
  categories: string[];
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

type ApiCategoriesResponse = { categories: CategoryRecord[] };

type ApiCategoryResponse = { category: CategoryRecord };

type CategoryOption = { name: string; id: number | null };

/** Debe coincidir con `MAX_CATEGORIES_PER_ITEM` del servidor. */
const MAX_CATEGORIES = 8;

type ApiMediaResponse = {
  url: string;
  contentType: string;
  size: number;
};

type Feedback = { tone: "success" | "error"; text: string } | null;

const moneyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export function AdminStudio({
  initialBooks,
  initialCourses,
  initialCategories,
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
  const [catalog, setCatalog] = useState<CategoryRecord[]>(initialCategories);
  const [newCategory, setNewCategory] = useState("");
  const [managingCategories, setManagingCategories] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const coverInputRef = useRef<HTMLInputElement>(null);

  const items = activeKind === "book" ? books : courses;
  const publishedCount = useMemo(
    () => items.filter((item) => item.status === "published").length,
    [items],
  );
  // El selector reúne el catálogo guardado, lo que ya usan las fichas y lo
  // que esté seleccionado ahora mismo, para que nada quede fuera de la lista.
  const categoryOptions = useMemo<CategoryOption[]>(() => {
    const options = new Map<string, CategoryOption>();
    const add = (name: string, id: number | null) => {
      const key = categoryKey(name);
      if (!key) return;
      const existing = options.get(key);
      if (existing) {
        if (existing.id === null && id !== null) existing.id = id;
        return;
      }
      options.set(key, { name, id });
    };

    for (const category of catalog) {
      if (category.kind === activeKind) add(category.name, category.id);
    }
    for (const item of items) {
      for (const name of itemCategories(item)) add(name, null);
    }
    for (const name of form.categories) add(name, null);

    return [...options.values()].sort((left, right) =>
      left.name.localeCompare(right.name, "es"),
    );
  }, [activeKind, catalog, items, form.categories]);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  function selectCoverFile(file: File | null) {
    setCoverFile(file);
    setCoverPreviewUrl(file ? URL.createObjectURL(file) : "");
  }

  function clearCoverSelection() {
    setCoverFile(null);
    setCoverPreviewUrl("");
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  function selectKind(kind: ContentKind) {
    if (busy) return;
    const count = kind === "book" ? books.length : courses.length;
    setActiveKind(kind);
    setEditingId(null);
    setForm(emptyForm(kind, count));
    clearCoverSelection();
    setNewCategory("");
    setFeedback(null);
  }

  function startCreate() {
    if (busy) return;
    setEditingId(null);
    setForm(emptyForm(activeKind, items.length));
    clearCoverSelection();
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
      categories: itemCategories(item),
      author: item.author,
      sortOrder: String(item.sortOrder),
      price: (item.priceCents / 100).toFixed(2),
      status: item.status,
      scormUrl: isCourseRecord(item) ? item.scormUrl : "",
    });
    clearCoverSelection();
    setFeedback(null);
    focusEditor();
  }

  function toggleCategory(name: string) {
    if (!storageReady || busy) return;
    const selected = form.categories.some(
      (entry) => categoryKey(entry) === categoryKey(name),
    );
    if (!selected && form.categories.length >= MAX_CATEGORIES) {
      setFeedback({
        tone: "error",
        text: `Puedes asignar como máximo ${MAX_CATEGORIES} categorías.`,
      });
      return;
    }
    setForm((current) => ({
      ...current,
      categories: selected
        ? current.categories.filter(
            (entry) => categoryKey(entry) !== categoryKey(name),
          )
        : [...current.categories, name],
    }));
  }

  async function addCategory() {
    if (!storageReady || busy) return;
    const name = newCategory.replace(/\s+/g, " ").trim();
    if (!name) {
      setFeedback({ tone: "error", text: "Escribe el nombre de la categoría." });
      return;
    }

    const known = categoryOptions.find(
      (option) => categoryKey(option.name) === categoryKey(name),
    );
    if (known) {
      setNewCategory("");
      if (
        !form.categories.some(
          (entry) => categoryKey(entry) === categoryKey(known.name),
        )
      ) {
        toggleCategory(known.name);
      }
      setFeedback({
        tone: "success",
        text: `«${known.name}» ya existía: queda seleccionada.`,
      });
      return;
    }

    setBusy("category");
    setFeedback(null);
    try {
      const response = await requestJson<ApiCategoryResponse>(
        "/api/admin/categories",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: activeKind, name }),
        },
      );
      setCatalog((current) => [
        ...current.filter((entry) => entry.id !== response.category.id),
        response.category,
      ]);
      setNewCategory("");
      setForm((current) =>
        current.categories.length >= MAX_CATEGORIES ||
        current.categories.some(
          (entry) => categoryKey(entry) === categoryKey(response.category.name),
        )
          ? current
          : {
              ...current,
              categories: [...current.categories, response.category.name],
            },
      );
      setFeedback({
        tone: "success",
        text: `Categoría «${response.category.name}» creada.`,
      });
    } catch (error) {
      setFeedback({ tone: "error", text: errorMessage(error) });
    } finally {
      setBusy(null);
    }
  }

  async function removeCategory(option: CategoryOption) {
    if (!storageReady || busy || option.id === null) return;
    const confirmed = window.confirm(
      `¿Quitar «${option.name}» del catálogo? Las fichas que ya la tengan asignada la conservan.`,
    );
    if (!confirmed) return;

    setBusy(`category-${option.id}`);
    setFeedback(null);
    try {
      await requestJson(
        `/api/admin/categories?kind=${activeKind}&id=${option.id}`,
        { method: "DELETE" },
      );
      setCatalog((current) => current.filter((entry) => entry.id !== option.id));
      setFeedback({ tone: "success", text: "Categoría retirada del catálogo." });
    } catch (error) {
      setFeedback({ tone: "error", text: errorMessage(error) });
    } finally {
      setBusy(null);
    }
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
    if (form.categories.length === 0) {
      setFeedback({
        tone: "error",
        text: "Selecciona o crea al menos una categoría.",
      });
      return;
    }

    setBusy("save");
    setFeedback(null);
    try {
      let imageUrl = form.imageUrl;
      if (activeKind === "book" && coverFile) {
        const upload = new FormData();
        upload.append("file", coverFile);
        const media = await requestJson<ApiMediaResponse>("/api/admin/media", {
          method: "POST",
          body: upload,
        });
        imageUrl = media.url;
        setForm((current) => ({ ...current, imageUrl }));
        clearCoverSelection();
      }

      const payload = {
        kind: activeKind,
        ...(editingId ? { id: editingId } : {}),
        title: form.title,
        description: form.description,
        imageUrl,
        categories: form.categories,
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
      setForm((current) => ({ ...current, imageUrl: response.item.imageUrl }));
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
            categories: itemCategories(item),
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
        clearCoverSelection();
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
      const [response, categories] = await Promise.all([
        requestJson<ApiCollectionResponse>("/api/admin/content", {
          cache: "no-store",
        }),
        requestJson<ApiCategoriesResponse>("/api/admin/categories", {
          cache: "no-store",
        }).catch(() => null),
      ]);
      setBooks(sortContent(response.books));
      setCourses(sortContent(response.courses));
      if (categories) setCatalog(categories.categories);
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

            <label className={styles.fullField}>
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

            <div className={`${styles.fullField} ${styles.categoryField}`}>
              <div className={styles.categoryHeading}>
                <span id="admin-categories-label">Categorías *</span>
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => setManagingCategories((current) => !current)}
                  disabled={!storageReady || busy !== null}
                >
                  {managingCategories ? "Terminar" : "Gestionar catálogo"}
                </button>
              </div>

              <div
                className={styles.categoryOptions}
                role="group"
                aria-labelledby="admin-categories-label"
              >
                {categoryOptions.map((option) => {
                  const selected = form.categories.some(
                    (entry) => categoryKey(entry) === categoryKey(option.name),
                  );
                  return (
                    <span className={styles.categoryOption} key={option.name}>
                      <button
                        type="button"
                        className={`${styles.categoryChip} ${
                          selected ? styles.categoryChipActive : ""
                        }`}
                        aria-pressed={selected}
                        onClick={() => toggleCategory(option.name)}
                        disabled={!storageReady || busy !== null}
                      >
                        {selected ? <span aria-hidden="true">✓</span> : null}
                        {option.name}
                      </button>
                      {managingCategories && option.id !== null ? (
                        <button
                          type="button"
                          className={styles.categoryDelete}
                          aria-label={`Quitar ${option.name} del catálogo`}
                          onClick={() => removeCategory(option)}
                          disabled={!storageReady || busy !== null}
                        >
                          ×
                        </button>
                      ) : null}
                    </span>
                  );
                })}
                {categoryOptions.length === 0 ? (
                  <p className={styles.categoryEmpty}>
                    Todavía no hay categorías: crea la primera aquí abajo.
                  </p>
                ) : null}
              </div>

              <div className={styles.categoryCreate}>
                <label htmlFor="admin-new-category">
                  <span>Crear categoría</span>
                </label>
                <div className={styles.categoryCreateRow}>
                  <input
                    id="admin-new-category"
                    name="newCategory"
                    value={newCategory}
                    onChange={(event) => setNewCategory(event.target.value)}
                    onKeyDown={(event) => {
                      // Enter aquí crearía la categoría y enviaría la ficha a la vez.
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      void addCategory();
                    }}
                    maxLength={80}
                    disabled={!storageReady || busy !== null}
                    placeholder="Historia, Modelos, Alta costura…"
                  />
                  <button
                    type="button"
                    className={styles.categoryCreateButton}
                    onClick={() => void addCategory()}
                    disabled={!storageReady || busy !== null}
                  >
                    {busy === "category" ? "Creando…" : "Añadir"}
                  </button>
                </div>
                <small>
                  Marca todas las que correspondan: un libro puede ser de varias.
                  Máximo {MAX_CATEGORIES}; la primera marcada encabeza la ficha.
                </small>
              </div>
            </div>

            {activeKind === "book" ? (
              <div className={`${styles.fullField} ${styles.coverUpload}`}>
                <label htmlFor="admin-cover-file">
                  <span>Portada del libro</span>
                </label>
                <div className={styles.coverUploadBody}>
                  <div
                    className={styles.coverPreview}
                    style={
                      coverPreviewUrl || form.imageUrl
                        ? {
                            backgroundImage: `url(${JSON.stringify(
                              coverPreviewUrl || form.imageUrl,
                            )})`,
                          }
                        : undefined
                    }
                    role={coverPreviewUrl || form.imageUrl ? "img" : undefined}
                    aria-label={
                      coverPreviewUrl || form.imageUrl
                        ? "Vista previa de la portada"
                        : undefined
                    }
                  >
                    {!coverPreviewUrl && !form.imageUrl ? (
                      <span aria-hidden="true">HM</span>
                    ) : null}
                  </div>
                  <div className={styles.coverUploadControls}>
                    <input
                      ref={coverInputRef}
                      id="admin-cover-file"
                      name="coverFile"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={(event) =>
                        selectCoverFile(event.target.files?.[0] ?? null)
                      }
                      disabled={!storageReady || busy !== null}
                    />
                    <small>
                      Elige una imagen del ordenador o de la galería. En el móvil
                      también puedes hacer una foto. JPG, PNG, WebP o AVIF; máximo 8 MB.
                    </small>
                    {coverPreviewUrl || form.imageUrl ? (
                      <button
                        type="button"
                        className={styles.removeCoverButton}
                        onClick={() => {
                          clearCoverSelection();
                          setForm((current) => ({ ...current, imageUrl: "" }));
                        }}
                        disabled={!storageReady || busy !== null}
                      >
                        Quitar portada
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <label className={styles.fullField}>
                <span>URL de imagen del curso</span>
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
            )}

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
                      <span>{itemCategories(item).join(" · ") || "Sin categoría"}</span>
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
    categories: [kind === "book" ? "Biblioteca" : "Formación"],
    author: "Carlos Sánchez de Medina",
    sortOrder: String((itemCount + 1) * 10),
    price: "0.00",
    status: "draft",
    scormUrl: "",
  };
}

/** Las fichas anteriores a las categorías múltiples solo traen `category`. */
function itemCategories(item: BookRecord | CourseRecord): string[] {
  if (Array.isArray(item.categories) && item.categories.length) {
    return [...item.categories];
  }
  return item.category ? [item.category] : [];
}

function categoryKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es");
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
