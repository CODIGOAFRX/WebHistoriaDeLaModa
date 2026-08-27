"use client";

import { useCallback, useMemo, useState } from "react";
import { BookDialog } from "./BookDialog";

export type LibraryBook = {
  id: number;
  title: string;
  author: string;
  description: string;
  category: string;
  coverUrl: string;
  featured?: boolean;
};

export function LibraryGrid({ books }: { books: LibraryBook[] }) {
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [openBook, setOpenBook] = useState<LibraryBook | null>(null);
  const closeBook = useCallback(() => setOpenBook(null), []);
  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(books.map((book) => book.category))).filter(Boolean)],
    [books],
  );
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return books.filter((book) => {
      const matchesCategory = category === "Todos" || book.category === category;
      const matchesQuery =
        !normalized ||
        `${book.title} ${book.author} ${book.description}`
          .toLocaleLowerCase("es")
          .includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [books, category, query]);

  if (!books.length) {
    return (
      <div className="library-browser">
        <div className="empty-state" role="status">
          <h2>No hay libros publicados.</h2>
          <p>Los títulos aparecerán aquí cuando se publiquen desde la administración.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="library-browser">
      <div className="library-tools">
        <div className="library-filters" role="group" aria-label="Filtrar por categoría">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? "is-active" : undefined}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="library-search">
          <span>Buscar en la biblioteca</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Título, autor o palabra clave"
          />
        </label>
      </div>

      {visible.length ? (
        <div className="book-grid-public">
          {visible.map((book, index) => (
            <article className="book-card-public" key={book.id}>
              <div className={`book-card-cover tone-${(index % 5) + 1}`}>
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={`Cubierta de ${book.title}`} loading="lazy" />
                ) : (
                  <>
                    <span>{book.category}</span>
                    <span className="book-card-cover-title">{book.title}</span>
                    <p>{book.author}</p>
                    <i aria-hidden="true">HM</i>
                  </>
                )}
              </div>
              <div className="book-card-copy">
                <p>{book.category}</p>
                <h2>{book.title}</h2>
                <span>{book.author}</span>
                <p className="book-card-blurb">{book.description}</p>
                <button
                  type="button"
                  className="book-card-trigger"
                  aria-label={`Ver la ficha de ${book.title}`}
                  onClick={() => setOpenBook(book)}
                >
                  <span>Ver ficha</span>
                  <span className="book-card-trigger-mark" aria-hidden="true">
                    +
                  </span>
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state" role="status" aria-live="polite">
          <h2>No hay coincidencias.</h2>
          <p>Prueba con otra palabra o vuelve a ver todas las categorías.</p>
        </div>
      )}

      <BookDialog book={openBook} onClose={closeBook} />
    </div>
  );
}
