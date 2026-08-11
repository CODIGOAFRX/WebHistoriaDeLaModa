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
  const featured = conferences.find((conference) => conference.featured) ?? conferences[0];
  const archive = conferences.filter((conference) => conference !== featured);
  const featuredHref = featured.videoId
    ? `https://www.youtube.com/watch?v=${featured.videoId}`
    : featured.href;

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
            {featuredHref ? (
              <a
                className="text-link"
                href={featuredHref}
                target="_blank"
                rel="noreferrer"
              >
                Abrir en YouTube
              </a>
            ) : null}
          </div>
        </div>

        <Reveal className="video-frame" delay={80}>
          {featured.videoId ? (
            <iframe
              title={featured.title}
              src={`https://www.youtube-nocookie.com/embed/${featured.videoId}?rel=0`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : null}
        </Reveal>
      </section>

      <div className="shell section-pad-sm">
        <div
          className="section-rule"
          role="separator"
          aria-label="Archivo audiovisual de conferencias"
        />
      </div>

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
            Canal completo
          </a>
        </div>

        <div className="conference-grid">
          {archive.map((conference, index) => (
            <Reveal
              as="article"
              className="conference-card"
              key={`${conference.year}-${conference.title}`}
              delay={(index % 2) * 80}
            >
              {conference.videoId ? (
                <div className="conference-video">
                  <iframe
                    title={conference.title}
                    src={`https://www.youtube-nocookie.com/embed/${conference.videoId}?rel=0`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : conference.href ? (
                <a
                  className="conference-video"
                  href={conference.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir la ficha oficial de ${conference.title}, ${conference.year}`}
                >
                  <img
                    src="/images/media/carlos-conference.webp"
                    alt="Carlos Sánchez de Medina impartiendo una conferencia"
                    loading="lazy"
                  />
                </a>
              ) : null}
              <div className="conference-card-meta">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{conference.duration}</span>
              </div>
              <h3>
                {conference.href && !conference.videoId ? (
                  <a href={conference.href} target="_blank" rel="noreferrer">
                    {conference.title}
                  </a>
                ) : (
                  conference.title
                )}
              </h3>
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
            Proponer una conferencia
          </a>
        </div>
      </section>
    </>
  );
}
