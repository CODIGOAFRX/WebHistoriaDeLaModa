import type { Metadata } from "next";
import { PageIntro } from "../components/PageIntro";
import { Reveal } from "../components/Reveal";
import { conferences } from "../data/content";

export const metadata: Metadata = {
  title: "Conferencias",
  description:
    "Conferencias y clases magistrales de Carlos Sánchez de Medina sobre historia del arte, indumentaria y moda.",
};

const verifiedConferenceVideos: Record<
  string,
  { videoId: string; date: string; displayDate?: string; dateLabel?: string }
> = {
  "mam-2026": { videoId: "wUzjeWzRTWQ", date: "2026-04-16" },
  KhFMU8wAqEI: { videoId: "KhFMU8wAqEI", date: "2024-05-16" },
  AN1LkIq0SAA: {
    videoId: "AN1LkIq0SAA",
    date: "2024-08-05",
    dateLabel: "Publicación",
  },
  yYdjksM6WwI: {
    videoId: "yYdjksM6WwI",
    date: "2024-07-15",
    dateLabel: "Publicación",
  },
  fNpCVX9qdHU: { videoId: "fNpCVX9qdHU", date: "2018-11-27" },
  "54r-yw9Ghcs": {
    videoId: "54r-yw9Ghcs",
    date: "2011-01-01",
    displayDate: "2011",
  },
};

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export default function ConferencesPage() {
  const conferenceVideos = conferences
    .flatMap((conference) => {
      const sourceKey = conference.year === "2026" && !conference.videoId
        ? "mam-2026"
        : conference.videoId;
      const verifiedVideo = sourceKey
        ? verifiedConferenceVideos[sourceKey]
        : undefined;

      return verifiedVideo
        ? [{ ...conference, ...verifiedVideo }]
        : [];
    })
    .sort((left, right) => right.date.localeCompare(left.date));
  const [featured, ...archive] = conferenceVideos;
  const featuredDate = formatDate(featured.date);

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
          <p className="eyebrow">Conferencia destacada</p>
          <h2>{featured.title}</h2>
          <p>{featured.context}</p>
          <div className="conference-feature-meta">
            <time dateTime={featured.date} aria-label={`Fecha: ${featuredDate}`}>
              {featuredDate}
            </time>
            <a
              className="text-link"
              href={`https://www.youtube.com/watch?v=${featured.videoId}`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir en YouTube
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
          {archive.map((conference, index) => {
            const displayDate = conference.displayDate ?? formatDate(conference.date);

            return (
              <Reveal
                as="article"
                className="conference-card"
                key={conference.videoId}
                delay={(index % 2) * 80}
              >
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
                  <span>{conference.dateLabel ?? "Fecha"}</span>
                  <time dateTime={conference.date} aria-label={`Fecha: ${displayDate}`}>
                    {displayDate}
                  </time>
                </div>
                <h3>{conference.title}</h3>
                <p>{conference.context}</p>
              </Reveal>
            );
          })}
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
