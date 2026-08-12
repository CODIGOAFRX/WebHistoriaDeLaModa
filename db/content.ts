import type { ContentStatus } from "./schema";

export type ContentKind = "book" | "course";

export type BookRecord = {
  id: number;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  category: string;
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
  category: string;
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

  if (kind === "course") {
    const result = await binding
      .prepare(`INSERT INTO courses
        (title, slug, description, image_url, category, author, sort_order, price_cents, status, scorm_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        input.title,
        slug,
        input.description,
        input.imageUrl,
        input.category,
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
      (title, slug, description, image_url, category, author, sort_order, price_cents, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      input.title,
      slug,
      input.description,
      input.imageUrl,
      input.category,
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
  if (kind === "course") {
    await binding
      .prepare(`UPDATE courses SET
        title = ?, slug = ?, description = ?, image_url = ?, category = ?,
        author = ?, sort_order = ?, price_cents = ?, status = ?, scorm_url = ?,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`)
      .bind(
        input.title,
        slug,
        input.description,
        input.imageUrl,
        input.category,
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
      author = ?, sort_order = ?, price_cents = ?, status = ?,
      updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`)
    .bind(
      input.title,
      slug,
      input.description,
      input.imageUrl,
      input.category,
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
