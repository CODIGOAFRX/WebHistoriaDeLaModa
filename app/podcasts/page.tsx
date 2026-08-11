import type { Metadata } from "next";
import { PageIntro } from "../components/PageIntro";
import { Reveal } from "../components/Reveal";
import { podcastEpisodes } from "../data/content";
import { PodcastArchive } from "./PodcastArchive";

export const metadata: Metadata = {
  title: "Podcast",
  description:
    "Escucha Historia de la Moda, el podcast de Carlos Sánchez de Medina y Pedro Jesús Gómez Pérez.",
};

export default function PodcastsPage() {
  return (
    <>
      <PageIntro
        index="01"
        eyebrow="Podcast"
        title="Historias para escuchar."
        summary="Un recorrido sonoro por las personas, las ideas y los objetos que cambiaron nuestra manera de vestir."
        aside="Dirigido y producido por Carlos Sánchez de Medina y Pedro Jesús Gómez Pérez."
      />

      <section className="podcast-show shell section-pad">
        <div className="podcast-show-copy">
          <p className="eyebrow">Historia de la Moda · El podcast</p>
          <h2>Vestirse es una forma de contar quiénes somos.</h2>
          <p>
            Cada episodio parte de una figura, un color o una obsesión para abrir una
            historia mayor. Sin prisa, con contexto y con la curiosidad intacta.
          </p>
          <div className="podcast-platforms">
            <a
              className="button-link"
              href="https://open.spotify.com/show/5azV7BnvrJGkHWTDEful8k"
              target="_blank"
              rel="noreferrer"
            >
              Spotify <span aria-hidden="true">↗</span>
            </a>
            <a
              className="text-link"
              href="https://www.ivoox.com/podcast-historia-moda-podcast_sq_f12837071_1.html"
              target="_blank"
              rel="noreferrer"
            >
              iVoox <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <Reveal className="spotify-embed" delay={80}>
          <iframe
            title="Historia de la Moda en Spotify"
            src="https://open.spotify.com/embed/show/5azV7BnvrJGkHWTDEful8k?utm_source=generator&theme=0"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        </Reveal>
      </section>

      <section className="episode-section section-pad-sm">
        <div className="shell">
          <div className="episode-heading">
            <p className="eyebrow">Temporada 01 · 13 episodios</p>
            <h2>Elige una historia y dale al play.</h2>
          </div>
          <PodcastArchive episodes={podcastEpisodes} />
        </div>
      </section>

      <section className="podcast-coda shell section-pad-sm">
        <p className="eyebrow">Sigue escuchando</p>
        <p>
          Una conversación sobre moda puede empezar en Balenciaga, atravesar una
          guillotina y terminar preguntándonos quién decide hoy lo que deseamos.
        </p>
        <a className="text-link" href="/archivo#colaboraciones">
          Podcasts invitados y entrevistas <span aria-hidden="true">↗</span>
        </a>
      </section>
    </>
  );
}
