import type { Metadata } from "next";
import Link from "next/link";
import { getPublicBooks } from "../../db/content";
import { PageIntro } from "../components/PageIntro";
import { Reveal } from "../components/Reveal";
import { LibraryGrid, type LibraryBook } from "./LibraryGrid";

export const metadata: Metadata = {
  title: "Biblioteca",
  description:
    "Recursos y lecturas de Historia de la Moda sobre arte, indumentaria y cultura visual.",
};

export const dynamic = "force-dynamic";

const resources = [
  {
    title: "Biblioteca comentada",
    description:
      "Libros y fuentes seleccionados para continuar investigando cada tema.",
    href: "#biblioteca",
    label: "Lecturas",
  },
  {
    title: "Archivo documental",
    description:
      "Entrevistas, publicaciones, prensa y materiales reunidos en un mismo índice.",
    href: "/archivo",
    label: "Documentación",
  },
  {
    title: "Podcast",
    description:
      "Episodios para recorrer personas, objetos e ideas de la historia de la moda.",
    href: "/podcasts",
    label: "Audio",
  },
  {
    title: "Conferencias",
    description:
      "Clases abiertas y encuentros audiovisuales ordenados para volver a ellos.",
    href: "/conferencias",
    label: "Vídeo",
  },
] as const;

export default async function LibraryPage() {
  const rows = await getPublicBooks();
  const books: LibraryBook[] = rows
    .filter(
      (book) =>
        book.category.trim().toLocaleLowerCase("es") !== "próximamente",
    )
    .map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      description: book.description,
      category: book.category,
      coverUrl: book.imageUrl,
      featured: false,
    }));

  return (
    <>
      <PageIntro
        index="03"
        eyebrow="Biblioteca"
        title="Leer para mirar mejor."
        summary="Una colección comentada de fuentes y recursos sobre historia, teoría, cultura visual e indumentaria."
        aside="Una biblioteca viva: los títulos y comentarios se amplían desde el estudio de Historia de la Moda."
      />

      <section className="library-resources shell section-pad" aria-labelledby="resources-title">
        <div className="library-resources-heading">
          <p className="eyebrow">Recursos</p>
          <h2 id="resources-title">Distintas formas de seguir el hilo.</h2>
          <p>
            Lecturas, documentos, audio y vídeo organizados para consultar,
            contrastar y continuar investigando.
          </p>
        </div>

        <div className="library-resource-grid">
          {resources.map((resource, index) => (
            <Reveal as="article" className="library-resource-card" key={resource.href} delay={index * 45}>
              <Link href={resource.href}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{resource.label}</p>
                <h3>{resource.title}</h3>
                <p>{resource.description}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="biblioteca" className="library-section section-pad-sm">
        <div className="shell">
          <div className="library-heading">
            <p className="eyebrow">Estanterías de trabajo</p>
            <h2>La biblioteca de Historia de la Moda.</h2>
            <p>
              Un mapa de lecturas en construcción para volver a las fuentes y
              seguir investigando.
            </p>
          </div>
          <LibraryGrid books={books} />
        </div>
      </section>

      <section className="library-coda shell section-pad-sm">
        <div
          className="section-rule"
          role="separator"
          aria-label="Biblioteca y archivo"
        />
        <Link className="text-link" href="/archivo">
          Publicaciones y fuentes
        </Link>
      </section>
    </>
  );
}
