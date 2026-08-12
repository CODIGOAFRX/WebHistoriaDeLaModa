import type { Metadata } from "next";
import { getPublicBooks } from "../../db/content";
import { LibraryGrid, type LibraryBook } from "./LibraryGrid";

export const metadata: Metadata = {
  title: "Biblioteca",
  description:
    "Recursos y lecturas de Historia de la Moda sobre arte, indumentaria y cultura visual.",
};

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const rows = await getPublicBooks();
  const books: LibraryBook[] = rows.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      description: book.description,
      category: book.category,
      coverUrl: book.imageUrl,
      featured: false,
    }));

  return (
    <section id="biblioteca" className="library-section section-pad-sm">
      <div className="shell">
        <div className="library-heading">
          <p className="eyebrow">Directorio de libros</p>
          <h1>La biblioteca de Historia de la Moda.</h1>
        </div>
        <LibraryGrid books={books} />
      </div>
    </section>
  );
}
