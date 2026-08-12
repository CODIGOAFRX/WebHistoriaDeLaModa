import type { Metadata } from "next";
import { Reveal } from "./components/Reveal";
import { SectionHeading } from "./components/SectionHeading";
import { SocialLinks } from "./components/SocialLinks";

export const metadata: Metadata = {
  title: "Historia, cultura y pensamiento",
  description:
    "El universo de Carlos Sánchez de Medina: historia de la moda, conferencias, podcasts, biblioteca y formación online.",
};

const disciplines = [
  "Historia del arte",
  "Indumentaria",
  "Cultura visual",
  "Mitología de la moda",
];

const paths = [
  {
    index: "01",
    title: "Escuchar",
    label: "Podcast",
    text: "Relatos que recorren nombres, objetos y gestos que cambiaron nuestra manera de vestir.",
    href: "/podcasts",
    image: "/images/podcasts/00-serie-alt.webp",
  },
  {
    index: "02",
    title: "Ver",
    label: "Conferencias",
    text: "Clases abiertas y conversaciones para mirar la moda con la profundidad de la historia.",
    href: "/conferencias",
    image: "/images/media/carlos-conference.webp",
  },
  {
    index: "03",
    title: "Investigar",
    label: "Biblioteca",
    text: "Los libros que sostienen cada historia: una colección comentada, abierta y en crecimiento.",
    href: "/biblioteca",
    image: "/images/portraits/carlos-about.webp",
  },
];

const institutions = [
  "Estación Diseño · Escuela Superior de Diseño",
  "ELLE Education · Universidad Camilo José Cela",
  "Universidad de Almería",
  "Universidad de Málaga",
  "Universidad de Extremadura",
  "UPAEP · Universidad Popular Autónoma del Estado de Puebla, México",
  "Escuela de Dirección y Altos Estudios (EDIAE) · Cámara Granada",
  "Escuela de Arte y Superior de Diseño Carlos Pérez Siquier · Almería",
  "Museo Automovilístico y de la Moda de Málaga",
  "ESCO · Escuela Superior de Comunicación y Marketing de Granada",
];

export default function Home() {
  return (
    <>
      <section className="home-hero shell hero-entrance" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="eyebrow home-hero-name">Carlos Sánchez de Medina Alcina</p>
          <h1 id="home-title">
            <span>La moda</span>
            <span>también</span>
            <em>se piensa.</em>
          </h1>
          <p className="home-hero-summary">
            Historia, cultura y pensamiento para comprender todo lo que vestimos.
          </p>
          <div className="home-hero-actions">
            <a className="button-link" href="#historia">
              Conoce a Carlos
            </a>
            <a
              className="text-link"
              href="https://www.instagram.com/historia_de_la_moda/"
              target="_blank"
              rel="noreferrer"
            >
              @historia_de_la_moda
            </a>
          </div>
        </div>

        <figure className="home-hero-portrait">
          <img
            src="/images/portraits/carlos-hero.webp"
            alt="Retrato de Carlos Sánchez de Medina"
            width="1120"
            height="1400"
            fetchPriority="high"
          />
          <figcaption>
            <span>Historiador especializado en indumentaria y moda</span>
            <span>Granada · 2026</span>
          </figcaption>
        </figure>

        <p className="home-hero-note">
          Un recorrido por la cultura visual y la mitología de la moda.
        </p>
      </section>

      <div className="discipline-strip" aria-label="Áreas de trabajo">
        <div>
          {[...disciplines, ...disciplines, ...disciplines, ...disciplines].map((item, index) => (
            <span key={`${item}-${index}`}>
              {item} <i aria-hidden="true">✦</i>
            </span>
          ))}
        </div>
      </div>

      <section
        id="historia"
        className="about-section shell section-pad"
        aria-labelledby="about-title"
      >
        <div className="about-intro">
          <p className="eyebrow">Quién soy</p>
          <h2 id="about-title">Carlos Sánchez de Medina Alcina</h2>
        </div>

        <div className="about-grid">
          <Reveal className="about-image-wrap">
            <img
              src="/images/portraits/carlos-about.webp"
              alt="Carlos Sánchez de Medina durante una entrevista"
              width="1440"
              height="1080"
              loading="lazy"
            />
            <span className="image-caption">Divulgación · Docencia · Investigación</span>
          </Reveal>

          <Reveal className="about-copy" delay={80}>
            <p className="about-lead">
              Historiador del arte e investigador. Estudia la indumentaria y la moda como
              documentos culturales, expresiones
              de su contexto histórico, artístico y social.
            </p>
            <div className="about-columns">
              <p>
                Docente y director académico desde 2006, su trabajo reúne investigación,
                educación y divulgación. Cada historia parte de una pregunta sencilla y
                abre el mundo que produjo una silueta, un tejido o un gesto.
              </p>
              <p>
                En redes, aulas y auditorios propone una manera distinta de mirar: con
                contexto, curiosidad y el placer de descubrir que ninguna prenda es
                solamente una prenda.
              </p>
            </div>
            <a className="text-link" href="/archivo">Recorrer su trayectoria</a>
          </Reveal>
        </div>

        <section className="home-institutions" aria-labelledby="institutions-title">
          <Reveal>
            <div className="home-institutions-heading">
              <p className="eyebrow">Trayectoria académica</p>
              <h2 id="institutions-title">Docencia, investigación y divulgación.</h2>
              <p>
                Selección de universidades, escuelas superiores y entidades culturales en
                las que ha desarrollado actividad docente o participado como conferenciante.
              </p>
            </div>
            <ol className="institution-list">
              {institutions.map((institution, index) => (
                <li key={institution}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <strong>{institution}</strong>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>
      </section>

      <section className="impact-section">
        <div className="shell section-pad-sm">
          <div className="impact-intro">
            <p className="eyebrow">Una comunidad que mira de otra manera</p>
            <p>
              Historia de la Moda convierte investigación en cultura compartida:
              piezas breves, precisas y visuales que invitan a seguir aprendiendo.
            </p>
          </div>

          <Reveal className="impact-number">
            <strong>+400.000</strong>
            <span>personas siguen el proyecto en Instagram</span>
          </Reveal>

          <div className="social-presence" aria-labelledby="social-presence-title">
            <div className="social-presence-heading">
              <p className="eyebrow">También puedes encontrarme aquí</p>
              <h2 id="social-presence-title">Historia de la Moda en todos sus formatos.</h2>
            </div>
            <SocialLinks />
          </div>
        </div>
      </section>

      <section className="paths-section shell section-pad">
        <SectionHeading
          eyebrow="El proyecto"
          title="Tres formas de entrar en la historia."
          text="Elige cómo quieres empezar. Puedes escuchar un episodio, sentarte en una conferencia o abrir la biblioteca de trabajo."
        />

        <div className="path-list">
          {paths.map((path, index) => (
            <Reveal as="article" className="path-card" key={path.title} delay={index * 60}>
              <a href={path.href} aria-label={`${path.title}: ${path.label}`}>
                <div className="path-meta">
                  <span>{path.index}</span>
                  <span>{path.label}</span>
                </div>
                <div className="path-image">
                  <img src={path.image} alt="" loading="lazy" />
                </div>
                <h3>{path.title}</h3>
                <p>{path.text}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="featured-media shell section-pad">
        <SectionHeading
          eyebrow="En primera persona"
          title="Conocimiento que se ve y se escucha."
          text="Una selección de conversaciones, entrevistas y conferencias donde las ideas tienen espacio para desarrollarse."
          action={{ href: "/conferencias", label: "Ver conferencias" }}
        />

        <div className="featured-media-grid">
          <Reveal as="article" className="featured-story">
            <a href="/archivo">
              <div className="featured-story-image">
                <img
                  src="/images/media/carlos-tv-detail.webp"
                  alt="Carlos explicando historia del calzado en televisión"
                  loading="lazy"
                />
                <span className="media-badge">Televisión</span>
              </div>
              <div className="featured-story-copy">
                <p className="eyebrow">Aparición destacada</p>
                <h3>La historia se entiende mejor cuando podemos verla.</h3>
                <span className="text-link">Ir al archivo</span>
              </div>
            </a>
          </Reveal>

          <Reveal as="article" className="featured-quote" delay={90}>
            <p className="eyebrow">La mirada de Carlos</p>
            <blockquote>
              “Vestirse también es contar una historia, aunque no siempre sepamos
              todavía cómo leerla.”
            </blockquote>
          </Reveal>
        </div>
      </section>

      <section className="school-teaser">
        <img
          src="/images/media/carlos-classroom.webp"
          alt="Carlos impartiendo una clase de historia de la moda"
          loading="lazy"
        />
        <div className="school-overlay" />
        <Reveal className="school-copy">
          <p className="eyebrow">Aula Historia de la Moda</p>
          <h2>Aprender a mirar.<br />Aprender a contar.</h2>
          <p>
            Una escuela online en construcción para estudiar la moda con contexto,
            método y una buena historia detrás.
          </p>
          <a className="button-link is-light" href="/escuela">Conocer el aula</a>
        </Reveal>
      </section>
    </>
  );
}
