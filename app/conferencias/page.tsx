import type { Metadata } from "next";
import { PageIntro } from "../components/PageIntro";
import { Reveal } from "../components/Reveal";
import { conferences } from "../data/content";

export const metadata: Metadata = {
  title: "Conferencias",
  description:
    "Conferencias y clases magistrales de Carlos Sánchez de Medina sobre historia del arte, indumentaria y moda.",
};

export default function ConferencesPage() {
  const [featured, ...archive] = conferences;

  return (
    <>
      <PageIntro
        index="02"
        eyebrow="Conferencias"
        title="Pensar en voz alta."
        summary="Auditorios, museos y aulas donde una imagen se convierte en relato y el relato abre otra manera de mirar."
        aside="Una selección de conferencias completas, disponibles para ver sin salir de esta página."
      />

      <section className="conference-feature shell section-pad">
        <div className="conference-feature-copy">
          <p className="eyebrow">Conferencia destacada · {featured.year}</p>
          <h2>{featured.title}</h2>
          <p>{featured.context}</p>
          <div className="conference-feature-meta">
            <span>{featured.duration}</span>
            <a
              className="text-link"
              href={`https://www.youtube.com/watch?v=${featured.videoId}`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir en YouTube <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <Reveal className="video-frame" delay={80}>
          <iframe
            title={featured.title}
            src={`https://www.youtube-nocookie.com/embed/${featured.videoId}?rel=0`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </Reveal>
      </section>

      <section className="conference-manifesto">
        <div className="shell conference-manifesto-grid">
          <p className="eyebrow">El aula como espacio vivo</p>
          <p>
            Una buena conferencia no entrega una lista de fechas. Construye relaciones:
            entre una pintura y un patrón, entre una idea política y una silueta, entre
            el archivo y la calle.
          </p>
          <img
            src="/images/media/carlos-conference.webp"
            alt="Carlos Sánchez de Medina impartiendo una conferencia"
            loading="lazy"
          />
        </div>
      </section>

      <section className="conference-archive shell section-pad">
        <div className="conference-archive-heading">
          <p className="eyebrow">Archivo audiovisual</p>
          <h2>Una sala abierta, siempre.</h2>
          <a
            className="text-link"
            href="https://www.youtube.com/@Historia_de_la_moda"
            target="_blank"
            rel="noreferrer"
          >
            Canal completo <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="conference-grid">
          {archive.map((conference, index) => (
            <Reveal as="article" className="conference-card" key={conference.videoId} delay={(index % 2) * 80}>
              <div className="conference-video">
                <iframe
                  title={conference.title}
                  src={`https://www.youtube-nocookie.com/embed/${conference.videoId}?rel=0`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="conference-card-meta">
                <span>{String(index + 2).padStart(2, "0")}</span>
                <span>{conference.duration}</span>
              </div>
              <h3>{conference.title}</h3>
              <p>{conference.context}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="speaker-cta">
        <div className="shell speaker-cta-grid">
          <p className="eyebrow">Conferencias · Museos · Centros educativos</p>
          <h2>Invita a Carlos a contar una historia.</h2>
          <p>
            Ponencias a medida sobre historia de la moda, cultura visual, lujo,
            cine e indumentaria.
          </p>
          <a
            className="button-link is-light"
            href="mailto:demedinamoda@gmail.com?subject=Propuesta%20de%20conferencia"
          >
            Proponer una conferencia <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </>
  );
}
