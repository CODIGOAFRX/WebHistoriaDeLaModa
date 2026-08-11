import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "./components/Reveal";
import { SectionHeading } from "./components/SectionHeading";

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
    image: "/images/podcasts/01-balenciaga.webp",
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

export default function Home() {
  return (
    <>
      <section className="home-hero shell hero-entrance" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="eyebrow">Carlos Sánchez de Medina Alcina</p>
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
              Conoce a Carlos <span aria-hidden="true">↓</span>
            </a>
            <a
              className="text-link"
              href="https://www.instagram.com/historia_de_la_moda/"
              target="_blank"
              rel="noreferrer"
            >
              @historia_de_la_moda <span aria-hidden="true">↗</span>
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
            <span>Madrid · 2026</span>
          </figcaption>
        </figure>

        <p className="home-hero-note">
          Un recorrido por la cultura visual y la mitología de la moda.
        </p>
      </section>

      <div className="discipline-strip" aria-label="Áreas de trabajo">
        <div>
          {[...disciplines, ...disciplines].map((item, index) => (
            <span key={`${item}-${index}`}>
              {item} <i aria-hidden="true">✦</i>
            </span>
          ))}
        </div>
      </div>

      <section id="historia" className="about-section shell section-pad">
        <SectionHeading
          eyebrow="Quién soy"
          title="La historia detrás de cada prenda."
          text="La moda no aparece de la nada. Es el resultado de ideas, poder, deseo, técnica y memoria. Carlos convierte ese entramado en relatos claros, rigurosos y fascinantes."
        />

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
              Licenciado y doctorando en Historia del Arte, Carlos Sánchez de Medina
              Alcina investiga la indumentaria y la moda como documentos culturales.
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
            <a className="text-link" href="/archivo">
              Recorrer su trayectoria <span aria-hidden="true">↗</span>
            </a>
          </Reveal>
        </div>
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

          <div className="impact-cards">
            <Reveal as="article" className="impact-card" delay={0}>
              <span>01</span>
              <h3>Rigor sin distancia</h3>
              <p>Historia del arte contada con precisión, claridad y sentido del humor.</p>
            </Reveal>
            <Reveal as="article" className="impact-card" delay={70}>
              <span>02</span>
              <h3>Una imagen, una puerta</h3>
              <p>Cada publicación empieza en lo visual y conduce hacia una época completa.</p>
            </Reveal>
            <Reveal as="article" className="impact-card" delay={140}>
              <span>03</span>
              <h3>Conversación abierta</h3>
              <p>Una comunidad que pregunta, comparte referencias y vuelve a mirar.</p>
            </Reveal>
          </div>

          <a
            className="button-link"
            href="https://www.instagram.com/historia_de_la_moda/"
            target="_blank"
            rel="noreferrer"
          >
            Seguir en Instagram <span aria-hidden="true">↗</span>
          </a>
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
                <span className="path-arrow" aria-hidden="true">↗</span>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="book-section">
        <div className="shell book-grid">
          <Reveal className="book-object">
            <div className="book-spine">Carlos Sánchez de Medina</div>
            <div className="book-cover">
              <span>Próximamente</span>
              <h2>Cómo reconocer un Chanel</h2>
              <div className="book-cover-mark">HM</div>
              <p>Temas de Hoy</p>
            </div>
          </Reveal>

          <Reveal className="book-copy" delay={100}>
            <p className="eyebrow">En proceso de escritura</p>
            <h2>Una historia de la moda para leerla de otra manera.</h2>
            <p>
              <em>Cómo reconocer un Chanel</em> es el nuevo libro de Carlos: una
              invitación a reconocer las claves, los símbolos y las historias que
              han construido el imaginario de la moda.
            </p>
            <div className="book-publisher">
              <span>Temas de Hoy</span>
              <span>Grupo Planeta</span>
            </div>
            <a className="button-link" href="/biblioteca#libro">
              Descubrir el proyecto <span aria-hidden="true">↗</span>
            </a>
          </Reveal>
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
                <span className="text-link">Ir al archivo <b aria-hidden="true">↗</b></span>
              </div>
            </a>
          </Reveal>

          <Reveal as="article" className="featured-quote" delay={90}>
            <p className="eyebrow">La mirada de Carlos</p>
            <blockquote>
              “Vestirse también es contar una historia, aunque no siempre sepamos
              todavía cómo leerla.”
            </blockquote>
            <img
              src="/images/media/carlos-tv.webp"
              alt="Carlos Sánchez de Medina en un plató de televisión"
              loading="lazy"
            />
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
          <Link className="button-link is-light" href="/escuela">
            Conocer el aula <span aria-hidden="true">↗</span>
          </Link>
        </Reveal>
      </section>
    </>
  );
}
