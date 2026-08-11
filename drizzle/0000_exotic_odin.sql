CREATE TABLE `books` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'Biblioteca' NOT NULL,
	`author` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`price_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "books_price_non_negative" CHECK("books"."price_cents" >= 0),
	CONSTRAINT "books_status_valid" CHECK("books"."status" in ('draft', 'published'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `books_slug_unique` ON `books` (`slug`);--> statement-breakpoint
CREATE INDEX `books_public_order_idx` ON `books` (`status`,`sort_order`,`id`);--> statement-breakpoint
CREATE INDEX `books_admin_order_idx` ON `books` (`sort_order`,`id`);--> statement-breakpoint
CREATE TABLE `content_setup` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'Formación' NOT NULL,
	`author` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`price_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`scorm_url` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "courses_price_non_negative" CHECK("courses"."price_cents" >= 0),
	CONSTRAINT "courses_status_valid" CHECK("courses"."status" in ('draft', 'published'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_slug_unique` ON `courses` (`slug`);--> statement-breakpoint
CREATE INDEX `courses_public_order_idx` ON `courses` (`status`,`sort_order`,`id`);--> statement-breakpoint
CREATE INDEX `courses_admin_order_idx` ON `courses` (`sort_order`,`id`);