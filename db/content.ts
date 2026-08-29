import type { ContentStatus } from "./schema";

export type ContentKind = "book" | "course";

export type CategoryRecord = {
  id: number;
  kind: ContentKind;
  name: string;
  slug: string;
};

/** Tope de categorías por ficha: suficiente para cruzar temas sin ensuciar la tarjeta. */
export const MAX_CATEGORIES_PER_ITEM = 8;
export const MAX_CATEGORY_LENGTH = 80;

export type BookRecord = {
  id: number;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  /** Categoría principal: la primera de `categories`, conservada por compatibilidad. */
  category: string;
  categories: string[];
  author: string;
  sortOrder: number;
  priceCents: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

export type CourseRecord = BookRecord & {
  scormUrl: string;
};

export type PublicBook = BookRecord;
export type PublicCourse = CourseRecord;

export type ContentInput = {
  title: string;
  description: string;
  imageUrl: string;
  categories: string[];
  author: string;
  sortOrder: number;
  priceCents: number;
  status: ContentStatus;
  scormUrl?: string;
};

type ContentD1Result<T> = {
  results?: T[];
  meta?: { changes?: number };
};

type ContentD1Statement = {
  bind(...values: unknown[]): ContentD1Statement;
  run<T = Record<string, unknown>>(): Promise<ContentD1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<ContentD1Result<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
};

type ContentD1Database = {
  prepare(query: string): ContentD1Statement;
};

type BookRow = {
  id: number;
  title: string;
  slug: string;
  description: string;
  image_url: string;
  category: string;
  categories?: string | null;
  author: string;
  sort_order: number;
  price_cents: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
};

type CourseRow = BookRow & { scorm_url: string };

type InitialStatement = {
  query: string;
  values?: readonly unknown[];
};

const INITIAL_STATEMENTS: readonly InitialStatement[] = [
  {
    query: `CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT DEFAULT '' NOT NULL,
      image_url TEXT DEFAULT '' NOT NULL,
      category TEXT DEFAULT 'Biblioteca' NOT NULL,
      author TEXT DEFAULT '' NOT NULL,
      sort_order INTEGER DEFAULT 0 NOT NULL,
      price_cents INTEGER DEFAULT 0 NOT NULL,
      status TEXT DEFAULT 'draft' NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      CONSTRAINT books_price_non_negative CHECK (price_cents >= 0),
      CONSTRAINT books_status_valid CHECK (status in ('draft', 'published'))
    )`,
  },
  {
    query: `CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT DEFAULT '' NOT NULL,
      image_url TEXT DEFAULT '' NOT NULL,
      category TEXT DEFAULT 'Formación' NOT NULL,
      author TEXT DEFAULT '' NOT NULL,
      sort_order INTEGER DEFAULT 0 NOT NULL,
      price_cents INTEGER DEFAULT 0 NOT NULL,
      status TEXT DEFAULT 'draft' NOT NULL,
      scorm_url TEXT DEFAULT '' NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      CONSTRAINT courses_price_non_negative CHECK (price_cents >= 0),
      CONSTRAINT courses_status_valid CHECK (status in ('draft', 'published'))
    )`,
  },
  {
    query: `CREATE TABLE IF NOT EXISTS content_setup (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
  },
  {
    query: `CREATE TABLE IF NOT EXISTS content_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      kind TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      CONSTRAINT content_categories_kind_valid CHECK (kind in ('book', 'course'))
    )`,
  },
  {
    query:
      "CREATE UNIQUE INDEX IF NOT EXISTS content_categories_kind_slug_unique ON content_categories (kind, slug)",
  },
  { query: "CREATE UNIQUE INDEX IF NOT EXISTS books_slug_unique ON books (slug)" },
  {
    query:
      "CREATE INDEX IF NOT EXISTS books_public_order_idx ON books (status, sort_order, id)",
  },
  {
    query:
      "CREATE INDEX IF NOT EXISTS books_admin_order_idx ON books (sort_order, id)",
  },
  {
    query:
      "CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_unique ON courses (slug)",
  },
  {
    query:
      "CREATE INDEX IF NOT EXISTS courses_public_order_idx ON courses (status, sort_order, id)",
  },
  {
    query:
      "CREATE INDEX IF NOT EXISTS courses_admin_order_idx ON courses (sort_order, id)",
  },
  {
    query: `INSERT OR IGNORE INTO courses
      (title, slug, description, image_url, category, author, sort_order, price_cents, status, scorm_url)
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM content_setup WHERE key = 'seed_version'
      )`,
    values: [
      "Curso de Historia de la Moda",
      "curso-historia-de-la-moda",
      "Borrador inicial para preparar la primera formación online. Edita o elimina esta ficha antes de publicarla.",
      "",
      "Formación",
      "Carlos Sánchez de Medina",
      10,
      0,
      "draft",
      "",
    ],
  },
  {
    query: `DELETE FROM books
      WHERE id = 1
        AND category = ?
        AND sort_order = 10
        AND price_cents = 0
        AND EXISTS (
          SELECT 1 FROM content_setup
          WHERE key = 'seed_version' AND value = '1'
        )`,
    values: ["Próximamente"],
  },
  {
    query: `INSERT INTO content_setup (key, value)
      VALUES ('seed_version', '2')
      ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  },
  { query: "PRAGMA optimize" },
] as const;

export const FALLBACK_BOOKS: readonly BookRecord[] = [];

export const FALLBACK_COURSES: readonly CourseRecord[] = [];

let initializationPromise: Promise<void> | null = null;

export class ContentStorageUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("La base de datos D1 no está disponible.", { cause });
    this.name = "ContentStorageUnavailableError";
  }
}

async function getContentBinding(): Promise<ContentD1Database> {
  try {
    // Keep the Cloudflare-only module behind a dynamic boundary so Node-based
    // render tests can exercise the public fallback without trying to resolve
    // the `cloudflare:` protocol.
    const { getDb } = await import("./index");
    const client = getDb().$client as unknown as ContentD1Database;
    if (!client || typeof client.prepare !== "function") {
      throw new Error("El binding DB no expone la API de D1.");
    }
    return client;
  } catch (error) {
    if (error instanceof ContentStorageUnavailableError) throw error;
    throw new ContentStorageUnavailableError(error);
  }
}

export function ensureContentDatabase(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = initializeContentDatabase().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }
  return initializationPromise;
}

async function initializeContentDatabase(): Promise<void> {
  const binding = await getContentBinding();

  for (const statement of INITIAL_STATEMENTS) {
    const prepared = binding.prepare(statement.query);
    const executable = statement.values
      ? prepared.bind(...statement.values)
      : prepared;
    await executable.run();
  }

  await ensureCategoriesColumn(binding, "books");
  await ensureCategoriesColumn(binding, "courses");
  await seedCategoryCatalog(binding);
}

/**
 * `ALTER TABLE ... ADD COLUMN` no admite `IF NOT EXISTS` en SQLite, así que la
 * columna se añade solo cuando falta en bases creadas antes de las categorías
 * múltiples.
 */
async function ensureCategoriesColumn(
  binding: ContentD1Database,
  table: "books" | "courses",
): Promise<void> {
  const columns = await binding
    .prepare(`PRAGMA table_info(${table})`)
    .all<{ name: string }>();
  const present = (columns.results ?? []).some(
    (column) => column.name === "categories",
  );
  if (present) return;

  await binding
    .prepare(
      `ALTER TABLE ${table} ADD COLUMN categories TEXT DEFAULT '' NOT NULL`,
    )
    .run();
  await binding
    .prepare(
      `UPDATE ${table} SET categories = json_array(category) WHERE categories = ''`,
    )
    .run();
}

/** Carga el catálogo con las categorías que ya usaban las fichas existentes. */
async function seedCategoryCatalog(
  binding: ContentD1Database,
): Promise<void> {
  const seeded = await binding
    .prepare("SELECT value FROM content_setup WHERE key = 'categories_seed'")
    .first<{ value: string }>();
  if (seeded) return;

  for (const [kind, table] of [
    ["book", "books"],
    ["course", "courses"],
  ] as const) {
    const rows = await binding
      .prepare(`SELECT DISTINCT category FROM ${table}`)
      .all<{ category: string }>();
    const names = (rows.results ?? []).map((row) => row.category);
    await registerCategories(binding, kind, names);
  }

  await binding
    .prepare(
      `INSERT INTO content_setup (key, value) VALUES ('categories_seed', '1')
        ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run();
}

export async function getPublicBooks(): Promise<BookRecord[]> {
  try {
    await ensureContentDatabase();
    const binding = await getContentBinding();
    const response = await binding
      .prepare(
        "SELECT * FROM books WHERE status = ? ORDER BY sort_order ASC, id ASC",
      )
      .bind("published")
      .all<BookRow>();
    return (response.results ?? []).map(mapBookRow);
  } catch {
    return FALLBACK_BOOKS.map((book) => ({ ...book }));
  }
}

export async function getPublicCourses(): Promise<CourseRecord[]> {
  try {
    await ensureContentDatabase();
    const binding = await getContentBinding();
    const response = await binding
      .prepare(
        "SELECT * FROM courses WHERE status = ? ORDER BY sort_order ASC, id ASC",
      )
      .bind("published")
      .all<CourseRow>();
    return (response.results ?? []).map(mapCourseRow);
  } catch {
    return FALLBACK_COURSES.map((course) => ({ ...course }));
  }
}

export async function getAdminContent(): Promise<{
  books: BookRecord[];
  courses: CourseRecord[];
}> {
  await ensureContentDatabase();
  const binding = await getContentBinding();
  const [bookResponse, courseResponse] = await Promise.all([
    binding
      .prepare("SELECT * FROM books ORDER BY sort_order ASC, id ASC")
      .all<BookRow>(),
    binding
      .prepare("SELECT * FROM courses ORDER BY sort_order ASC, id ASC")
      .all<CourseRow>(),
  ]);

  return {
    books: (bookResponse.results ?? []).map(mapBookRow),
    courses: (courseResponse.results ?? []).map(mapCourseRow),
  };
}

export async function createContent(
  kind: "book",
  input: ContentInput,
): Promise<BookRecord>;
export async function createContent(
  kind: "course",
  input: ContentInput,
): Promise<CourseRecord>;
export async function createContent(
  kind: ContentKind,
  input: ContentInput,
): Promise<BookRecord | CourseRecord> {
  await ensureContentDatabase();
  const binding = await getContentBinding();
  const table = tableFor(kind);
  const slug = await uniqueSlug(binding, table, input.title);
  const categories = normalizeCategories(input.categories);
  await registerCategories(binding, kind, categories);

  if (kind === "course") {
    const result = await binding
      .prepare(`INSERT INTO courses
        (title, slug, description, image_url, category, categories, author, sort_order, price_cents, status, scorm_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        input.title,
        slug,
        input.description,
        input.imageUrl,
        primaryCategory(categories),
        serializeCategories(categories),
        input.author,
        input.sortOrder,
        input.priceCents,
        input.status,
        input.scormUrl ?? "",
      )
      .run();
    const id = insertedId(result);
    return getCourseById(binding, id);
  }

  const result = await binding
    .prepare(`INSERT INTO books
      (title, slug, description, image_url, category, categories, author, sort_order, price_cents, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      input.title,
      slug,
      input.description,
      input.imageUrl,
      primaryCategory(categories),
      serializeCategories(categories),
      input.author,
      input.sortOrder,
      input.priceCents,
      input.status,
    )
    .run();
  const id = insertedId(result);
  return getBookById(binding, id);
}

export async function updateContent(
  kind: "book",
  id: number,
  input: ContentInput,
): Promise<BookRecord | null>;
export async function updateContent(
  kind: "course",
  id: number,
  input: ContentInput,
): Promise<CourseRecord | null>;
export async function updateContent(
  kind: ContentKind,
  id: number,
  input: ContentInput,
): Promise<BookRecord | CourseRecord | null> {
  await ensureContentDatabase();
  const binding = await getContentBinding();
  const table = tableFor(kind);
  const exists = await binding
    .prepare(`SELECT id FROM ${table} WHERE id = ?`)
    .bind(id)
    .first<{ id: number }>();
  if (!exists) return null;

  const slug = await uniqueSlug(binding, table, input.title, id);
  const categories = normalizeCategories(input.categories);
  await registerCategories(binding, kind, categories);
  if (kind === "course") {
    await binding
      .prepare(`UPDATE courses SET
        title = ?, slug = ?, description = ?, image_url = ?, category = ?,
        categories = ?, author = ?, sort_order = ?, price_cents = ?, status = ?,
        scorm_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`)
      .bind(
        input.title,
        slug,
        input.description,
        input.imageUrl,
        primaryCategory(categories),
        serializeCategories(categories),
        input.author,
        input.sortOrder,
        input.priceCents,
        input.status,
        input.scormUrl ?? "",
        id,
      )
      .run();
    return getCourseById(binding, id);
  }

  await binding
    .prepare(`UPDATE books SET
      title = ?, slug = ?, description = ?, image_url = ?, category = ?,
      categories = ?, author = ?, sort_order = ?, price_cents = ?, status = ?,
      updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`)
    .bind(
      input.title,
      slug,
      input.description,
      input.imageUrl,
      primaryCategory(categories),
      serializeCategories(categories),
      input.author,
      input.sortOrder,
      input.priceCents,
      input.status,
      id,
    )
    .run();
  return getBookById(binding, id);
}

export async function deleteContent(
  kind: ContentKind,
  id: number,
): Promise<boolean> {
  await ensureContentDatabase();
  const binding = await getContentBinding();
  const result = await binding
    .prepare(`DELETE FROM ${tableFor(kind)} WHERE id = ?`)
    .bind(id)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

export function isAdminEmailAllowed(email: string): boolean {
  const configured = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLocaleLowerCase("es"))
    .filter(Boolean);
  const allowedEmails =
    configured.length > 0 ? configured : ["demedinamoda@gmail.com"];

  return allowedEmails.includes(email.trim().toLocaleLowerCase("es"));
}

export function isLocalhostHost(host: string | null | undefined): boolean {
  if (!host) return false;
  try {
    const hostname = new URL(`http://${host}`).hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname === "::1"
    );
  } catch {
    return false;
  }
}

export async function getCategoryCatalog(): Promise<CategoryRecord[]> {
  await ensureContentDatabase();
  const binding = await getContentBinding();
  const response = await binding
    .prepare(
      "SELECT id, kind, name, slug FROM content_categories ORDER BY name COLLATE NOCASE ASC",
    )
    .all<{ id: number; kind: ContentKind; name: string; slug: string }>();
  return (response.results ?? []).map((row) => ({
    id: Number(row.id),
    kind: row.kind,
    name: row.name,
    slug: row.slug,
  }));
}

export async function getPublicCategoryCatalog(): Promise<CategoryRecord[]> {
  try {
    return await getCategoryCatalog();
  } catch {
    return [];
  }
}

export async function createCategory(
  kind: ContentKind,
  name: string,
): Promise<CategoryRecord> {
  await ensureContentDatabase();
  const binding = await getContentBinding();
  const [normalized] = normalizeCategories([name]);
  if (!normalized) {
    throw new Error("La categoría necesita un nombre.");
  }

  await registerCategories(binding, kind, [normalized]);
  const row = await binding
    .prepare(
      "SELECT id, kind, name, slug FROM content_categories WHERE kind = ? AND slug = ?",
    )
    .bind(kind, categorySlug(normalized))
    .first<{ id: number; kind: ContentKind; name: string; slug: string }>();
  if (!row) throw new Error("No se pudo guardar la categoría.");
  return { id: Number(row.id), kind: row.kind, name: row.name, slug: row.slug };
}

export async function deleteCategory(
  kind: ContentKind,
  id: number,
): Promise<boolean> {
  await ensureContentDatabase();
  const binding = await getContentBinding();
  const result = await binding
    .prepare("DELETE FROM content_categories WHERE kind = ? AND id = ?")
    .bind(kind, id)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

/** Añade al catálogo las categorías nuevas usadas por una ficha. */
async function registerCategories(
  binding: ContentD1Database,
  kind: ContentKind,
  names: readonly string[],
): Promise<void> {
  for (const name of normalizeCategories(names)) {
    await binding
      .prepare(
        `INSERT INTO content_categories (kind, name, slug) VALUES (?, ?, ?)
          ON CONFLICT(kind, slug) DO NOTHING`,
      )
      .bind(kind, name, categorySlug(name))
      .run();
  }
}

/** Limpia, recorta y deduplica una lista de categorías conservando su orden. */
export function normalizeCategories(values: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    if (typeof value !== "string") continue;
    const name = value.replace(/\s+/g, " ").trim().slice(0, MAX_CATEGORY_LENGTH);
    if (!name) continue;
    const key = categorySlug(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    normalized.push(name);
    if (normalized.length >= MAX_CATEGORIES_PER_ITEM) break;
  }

  return normalized;
}

export function parseCategoriesColumn(
  raw: string | null | undefined,
  fallback: string,
): string[] {
  const value = (raw ?? "").trim();
  if (value.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const categories = normalizeCategories(parsed);
        if (categories.length) return categories;
      }
    } catch {
      // Una columna corrupta cae al valor histórico de `category`.
    }
  }
  return normalizeCategories([value || fallback]);
}

function serializeCategories(categories: readonly string[]): string {
  return JSON.stringify(categories);
}

function primaryCategory(categories: readonly string[]): string {
  return categories[0] ?? "";
}

function categorySlug(name: string): string {
  return slugify(name);
}

function tableFor(kind: ContentKind): "books" | "courses" {
  return kind === "book" ? "books" : "courses";
}

async function uniqueSlug(
  binding: ContentD1Database,
  table: "books" | "courses",
  title: string,
  excludedId?: number,
): Promise<string> {
  const base = slugify(title) || "contenido";
  let candidate = base;
  let suffix = 2;

  while (suffix < 1000) {
    const query = excludedId
      ? `SELECT id FROM ${table} WHERE slug = ? AND id != ?`
      : `SELECT id FROM ${table} WHERE slug = ?`;
    const statement = binding.prepare(query);
    const match = await (excludedId
      ? statement.bind(candidate, excludedId)
      : statement.bind(candidate)
    ).first<{ id: number }>();

    if (!match) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return `${base}-${Date.now()}`;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function insertedId(result: ContentD1Result<unknown>): number {
  const id = Number(
    (result.meta as { last_row_id?: number } | undefined)?.last_row_id,
  );
  if (!Number.isInteger(id) || id < 1) {
    throw new Error("D1 no devolvió el identificador del contenido creado.");
  }
  return id;
}

async function getBookById(
  binding: ContentD1Database,
  id: number,
): Promise<BookRecord> {
  const row = await binding
    .prepare("SELECT * FROM books WHERE id = ?")
    .bind(id)
    .first<BookRow>();
  if (!row) throw new Error("No se pudo recuperar el libro guardado.");
  return mapBookRow(row);
}

async function getCourseById(
  binding: ContentD1Database,
  id: number,
): Promise<CourseRecord> {
  const row = await binding
    .prepare("SELECT * FROM courses WHERE id = ?")
    .bind(id)
    .first<CourseRow>();
  if (!row) throw new Error("No se pudo recuperar el curso guardado.");
  return mapCourseRow(row);
}

function mapBookRow(row: BookRow): BookRecord {
  return {
    id: Number(row.id),
    title: row.title,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    category: row.category,
    categories: parseCategoriesColumn(row.categories, row.category),
    author: row.author,
    sortOrder: Number(row.sort_order),
    priceCents: Number(row.price_cents),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCourseRow(row: CourseRow): CourseRecord {
  return { ...mapBookRow(row), scormUrl: row.scorm_url };
}
