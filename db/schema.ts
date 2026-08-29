import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const contentStatuses = ["draft", "published"] as const;
export type ContentStatus = (typeof contentStatuses)[number];

function timestampColumns() {
  return {
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  };
}

export const contentSetup = sqliteTable("content_setup", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const books = sqliteTable(
  "books",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    category: text("category").notNull().default("Biblioteca"),
    categories: text("categories").notNull().default(""),
    author: text("author").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    priceCents: integer("price_cents").notNull().default(0),
    status: text("status", { enum: contentStatuses })
      .$type<ContentStatus>()
      .notNull()
      .default("draft"),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("books_slug_unique").on(table.slug),
    index("books_public_order_idx").on(table.status, table.sortOrder, table.id),
    index("books_admin_order_idx").on(table.sortOrder, table.id),
    check("books_price_non_negative", sql`${table.priceCents} >= 0`),
    check(
      "books_status_valid",
      sql`${table.status} in ('draft', 'published')`,
    ),
  ],
);

export const courses = sqliteTable(
  "courses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    category: text("category").notNull().default("Formación"),
    categories: text("categories").notNull().default(""),
    author: text("author").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    priceCents: integer("price_cents").notNull().default(0),
    status: text("status", { enum: contentStatuses })
      .$type<ContentStatus>()
      .notNull()
      .default("draft"),
    scormUrl: text("scorm_url").notNull().default(""),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("courses_slug_unique").on(table.slug),
    index("courses_public_order_idx").on(
      table.status,
      table.sortOrder,
      table.id,
    ),
    index("courses_admin_order_idx").on(table.sortOrder, table.id),
    check("courses_price_non_negative", sql`${table.priceCents} >= 0`),
    check(
      "courses_status_valid",
      sql`${table.status} in ('draft', 'published')`,
    ),
  ],
);

export const contentCategories = sqliteTable(
  "content_categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ["book", "course"] }).notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("content_categories_kind_slug_unique").on(table.kind, table.slug),
    check("content_categories_kind_valid", sql`${table.kind} in ('book', 'course')`),
  ],
);

export type Book = typeof books.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type ContentCategory = typeof contentCategories.$inferSelect;
