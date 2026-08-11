"use client";

import { useMemo, useState } from "react";

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
  const placeholderCount =
    category === "Todos" && !query.trim() ? Math.max(0, 5 - visible.length) : 0;

  return (
    <div className="library-browser">
      <div className="library-tools">
        <div className="library-filters" aria-label="Filtrar por categoría">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? "is-active" : undefined}
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
                    <h3>{book.title}</h3>
                    <p>{book.author}</p>
                    <i aria-hidden="true">HM</i>
                  </>
                )}
              </div>
              <div className="book-card-copy">
                <p>{book.category}</p>
                <h3>{book.title}</h3>
                <span>{book.author}</span>
                <p>{book.description}</p>
              </div>
            </article>
          ))}
          {Array.from({ length: placeholderCount }, (_, index) => (
            <article className="book-card-public is-placeholder" key={`placeholder-${index}`}>
              <div className={`book-card-cover tone-${((visible.length + index) % 5) + 1}`}>
                <span>Biblioteca abierta</span>
                <h3>Próxima incorporación</h3>
                <p>Selección y comentario de Carlos</p>
                <i aria-hidden="true">+</i>
              </div>
              <div className="book-card-copy">
                <p>En preparación</p>
                <h3>Una estantería en crecimiento</h3>
                <span>Nuevo título próximamente</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No hay coincidencias.</h3>
          <p>Prueba con otra palabra o vuelve a ver todas las categorías.</p>
        </div>
      )}
    </div>
  );
}
