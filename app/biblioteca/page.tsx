import type { Metadata } from "next";
import { getPublicBooks } from "../../db/content";
import { PageIntro } from "../components/PageIntro";
import { Reveal } from "../components/Reveal";
import { LibraryGrid, type LibraryBook } from "./LibraryGrid";

export const metadata: Metadata = {
  title: "Biblioteca",
  description:
    "La biblioteca de trabajo de Carlos Sánchez de Medina: libros comentados sobre arte, moda, indumentaria y cultura visual.",
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
    <>
      <PageIntro
        index="03"
        eyebrow="Biblioteca"
        title="Leer para mirar mejor."
        summary="Una colección comentada de las fuentes que sostienen el trabajo de Carlos: historia, teoría, cultura visual y biografías."
        aside="Una biblioteca viva. Los títulos y comentarios se amplían desde el estudio de Carlos."
      />

      <section id="libro" className="upcoming-book shell section-pad">
        <Reveal className="upcoming-book-cover">
          <div className="upcoming-book-spine">Temas de Hoy · Grupo Planeta</div>
          <div className="upcoming-book-face">
            <p>Próximamente</p>
            <h2>Cómo reconocer un Chanel</h2>
            <span>Carlos Sánchez de Medina</span>
            <i aria-hidden="true">02</i>
          </div>
        </Reveal>

        <div className="upcoming-book-copy">
          <p className="eyebrow">El libro que viene</p>
          <h2>Reconocer una casa es aprender a leer sus códigos.</h2>
          <p>
            Carlos está escribiendo una historia de la moda que parte de una pregunta
            concreta: ¿qué vemos cuando decimos “esto es Chanel”? Un viaje por símbolos,
            objetos, creadoras, mitos y transformaciones.
          </p>
          <p className="book-note">
            Previsto con Temas de Hoy, sello editorial de Grupo Planeta. La fecha,
            portada y preventa se anunciarán cuando exista la ficha editorial.
          </p>
          <a
            className="button-link"
            href="mailto:demedinamoda@gmail.com?subject=Lista%20de%20espera%20%C2%BFC%C3%B3mo%20reconocer%20un%20Chanel%3F"
          >
            Avísame cuando esté disponible <span aria-hidden="true">↗</span>
          </a>
        </div>

        <Reveal className="chanel-video" delay={90}>
          <iframe
            title="¿Cómo reconocer un Chanel?"
            src="https://www.youtube-nocookie.com/embed/ryqmzyayQBE?rel=0"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          <p>Una primera pista audiovisual sobre los códigos de la casa.</p>
        </Reveal>
      </section>

      <section className="library-section section-pad-sm">
        <div className="shell">
          <div className="library-heading">
            <p className="eyebrow">Estanterías de trabajo</p>
            <h2>La biblioteca de Carlos.</h2>
            <p>
              No es una lista definitiva: es un mapa de lecturas en construcción,
              pensado para volver a las fuentes y seguir investigando.
            </p>
          </div>
          <LibraryGrid books={books} />
        </div>
      </section>

      <section className="library-coda shell section-pad-sm">
        <p className="eyebrow">Una nota al margen</p>
        <blockquote>
          “Cada publicación empieza mucho antes de abrir Instagram: empieza subrayando,
          comparando y volviendo a mirar.”
        </blockquote>
        <a className="text-link" href="/archivo">
          Publicaciones y fuentes <span aria-hidden="true">↗</span>
        </a>
      </section>
    </>
  );
}
