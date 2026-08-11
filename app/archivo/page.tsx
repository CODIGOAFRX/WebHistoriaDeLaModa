import type { Metadata } from "next";
import { PageIntro } from "../components/PageIntro";
import { Reveal } from "../components/Reveal";
import { collaborations, mediaAppearances } from "../data/content";

export const metadata: Metadata = {
  title: "Archivo y trayectoria",
  description:
    "Archivo de medios, entrevistas, publicaciones, colaboraciones y trayectoria académica de Carlos Sánchez de Medina.",
};

const timeline = [
  {
    years: "2006—2011",
    role: "Coordinación académica y docencia",
    place: "Escuela Arte Granada",
  },
  {
    years: "2011—2020",
    role: "Fundador, gerente y director académico",
    place: "Estación Diseño",
  },
  {
    years: "2021—2022",
    role: "Director académico de grados universitarios",
    place: "ESCO · Campus Europeo de Estudios Superiores",
  },
  {
    years: "2022—2024",
    role: "Jefe de Estudios y docente",
    place: "Estación Diseño · Escuela Superior de Diseño",
  },
  {
    years: "2006—Hoy",
    role: "Docencia, dirección académica y divulgación",
    place: "Historia del arte, diseño, indumentaria y moda",
  },
];

const fullArchive = [
  {
    title: "Publicaciones",
    items: [
      ["Artículo académico en Dialnet", "https://dialnet.unirioja.es/servlet/articulo?codigo=8248793"],
      ["La madeja infinita · Catálogo Ángeles Agrela", "https://files.cargocollective.com/c783562/AGRELA-19-ALCOBENDAS.pdf"],
      ["La madeja infinita · consulta online", "https://es.slideshare.net/slideshow/la-madeja-infinita-el-cuerpo-en-la-mirada-angeles-agrela-catalogo-pdf/281474367"],
    ],
  },
  {
    title: "Dirección de arte",
    items: [
      ["Editorial Escuela Española · Emilio López", "https://www.thefashionroute.com/Editoriales-moda/Editorial-Escuela-Espanola-by-Emilio-Lopez.html"],
      ["Editorial Compañía Laseda · Kiko Lozano", "https://kluidmagazine.com/editoriales/descubre-la-editorial-compañia-laseda-por-kiko-lozano/"],
    ],
  },
  {
    title: "Entrevistas",
    items: [
      ["Un intelectual en la moda · La Guía de Moda", "https://laguiademoda.com/entrevistas-inspiradoras/un-intelectual-en-la-moda-carlos-sanchez-de-medina-alcina/"],
      ["Entrevista audiovisual 01", "https://www.youtube.com/watch?v=OUux1zjyXdc"],
      ["La Memoria · Canal Sur Más", "https://www.canalsurmas.es/videos/detail/76072-la-memoria-27052023"],
      ["Entrevista audiovisual 02", "https://www.youtube.com/watch?v=g7bMLUH5QI0"],
      ["Entrevista audiovisual 03", "https://www.youtube.com/watch?v=oG2L8WsluGc&t=645s"],
      ["Entrevista audiovisual 04", "https://www.youtube.com/watch?v=kND6J93eFaA&list=PLZkzby6iVML5heKK8z2HAg6YZsawcQ4X1&index=25&t=904s"],
      ["Entrevista en Cadena SER", "https://cadenaser.com/audio/1784274475687/"],
    ],
  },
  {
    title: "Historia de la Moda en Canal Sur",
    items: [
      ["Programa 01", "https://www.youtube.com/watch?v=PAYH7oEPRLA"],
      ["Programa 02", "https://www.youtube.com/watch?v=zxyUOM7M3pI"],
      ["Programa 03", "https://www.youtube.com/watch?v=2ZbKxVa9soY"],
      ["Programa 04", "https://www.youtube.com/watch?v=Ic2uyonDcB0"],
      ["Programa 05", "https://www.youtube.com/watch?v=3L3J-PbCPA0"],
      ["Programa 06", "https://www.youtube.com/watch?v=KatzvQxlBEs"],
      ["Programa 07", "https://www.youtube.com/watch?v=iVBgxn7C1Pg"],
      ["Programa 08", "https://www.youtube.com/watch?v=3DF7lCXymYQ"],
      ["Programa 09", "https://www.youtube.com/watch?v=1bZeolL_RzE"],
      ["Programa 10", "https://www.youtube.com/watch?v=WSHXL3skSPs"],
    ],
  },
  {
    title: "Documentales y directos",
    items: [
      ["Documental · Archivo audiovisual", "https://www.youtube.com/watch?v=NBmyPMqVPHY"],
      ["Geópolis · RTVE", "https://www.rtve.es/television/20240411/geopolis-geopolitica-cosmetica/16053583.shtml"],
      ["Directo 01", "https://www.youtube.com/watch?v=wZPdEUWGKQU&t=1559s"],
      ["Directo 02", "https://www.youtube.com/watch?v=45hwEC5ov04&t=20s"],
      ["Directo 03", "https://www.youtube.com/watch?v=duf4HO6-Rco&t=67s"],
      ["Directo 04", "https://www.youtube.com/watch?v=5YFcllR0nHo&t=9s"],
    ],
  },
  {
    title: "Citas y fuentes",
    items: [
      ["El País ICON · Un hombre con abanico", "https://elpais.com/icon/2025-08-10/un-hombre-con-abanico-pierde-su-masculinidad-fragil-por-que-sigue-siendo-un-complemento-asociado-a-lo-femenino.html"],
      ["¡HOLA! Fashion · Estética flapper", "https://www.hola.com/fashion/tendencias/2022011272771/estetica-flapper-vestidos-flecos/"],
      ["El País S Moda · Ray-Ban Wayfarer", "https://elpais.com/smoda/moda/historia-ray-ban-wayfarer-disenador-invencion-20-grados-inclinacion.html"],
      ["Glamour · Vestidos con volumen", "https://www.glamour.es/articulos/vestidos-volumen-falda-tendencia-cancan"],
      ["Clara · Letizia y doña Sofía", "https://www.clara.es/celebrities/asi-rompio-letizia-camino-impuesto-por-dona-sofia-hace-10-anos-su-golpe-efecto-proclamacion-felipe-vi_35781"],
      ["La Vanguardia · Agonía y ocaso del zapato", "https://www.lavanguardia.com/vida/20260322/11495827/agonia-ocaso-zapato.html"],
      ["Las Provincias · Celia Forner", "https://www.lasprovincias.es/sociedad/moda/carlos-sanchez-medina-valenciana-celia-forner-pionera-20260213205020-nt.html"],
      ["Glamour · Castlecore", "https://www.glamour.es/articulos/castlecore-que-es-como-se-lleva-tendencia-inspiracion-medieval"],
      ["Cervezas Alhambra · Divulgación en redes", "https://www.cervezasalhambra.com/es/mirador/creadores/divulgacion-redes-sociales-impacto-educacion"],
      ["Cadena SER · Mes de la Moda", "https://cadenaser.com/andalucia/2026/04/07/el-mam-da-el-pistoletazo-de-salida-al-mes-de-la-moda-con-un-cartel-que-conecta-talento-industria-y-cultura-ser-malaga/"],
      ["EASD Alcoi · Guía docente", "https://www.easdalcoi.es/wp-content/uploads/guiesdocents_2425/disseny_moda/3/M3%20ESTE%CC%80TICA%20I%20TENDE%CC%80NCIES%20CONTEMPORA%CC%80NIES%20DEL%20DISSENY%20DE%20MODA%20I%20TE%CC%80XTIL.pdf"],
    ],
  },
];

export default function ArchivePage() {
  const featured = mediaAppearances.filter((item) => item.featured);

  return (
    <>
      <PageIntro
        index="06"
        eyebrow="Archivo y trayectoria"
        title="Todo lo que deja huella."
        summary="Una cartografía de entrevistas, proyectos, publicaciones y aulas: lugares donde la historia de la moda se ha convertido en conversación."
        aside="Selección editorial al comienzo; índice documental completo al final."
      />

      <section className="media-feature shell section-pad">
        <div className="media-feature-heading">
          <p className="eyebrow">Selección destacada</p>
          <h2>En los medios.</h2>
          <p>Televisión, prensa y radio para llevar contexto a la conversación pública.</p>
        </div>

        <div className="media-feature-grid">
          {featured.map((item, index) => (
            <Reveal as="article" className={`media-feature-card media-feature-card-${index + 1}`} key={item.href} delay={index * 60}>
              <a href={item.href} target="_blank" rel="noreferrer">
                {index < 2 ? (
                  <img
                    src={index === 0 ? "/images/media/carlos-tv-detail.webp" : "/images/media/carlos-tv.webp"}
                    alt=""
                    loading="lazy"
                  />
                ) : null}
                <div className="media-feature-meta">
                  <span>{item.kind}</span>
                  <span>{item.year}</span>
                </div>
                <p className="eyebrow">{item.outlet}</p>
                <h3>{item.title}</h3>
                <span className="media-open" aria-hidden="true">↗</span>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="trajectory-section">
        <div className="shell section-pad-sm">
          <div className="trajectory-heading">
            <p className="eyebrow">Trayectoria académica</p>
            <p>
              Licenciado y doctorando en Historia del Arte, diseñador gráfico y
              docente desde 2006. La práctica de Carlos une dirección académica,
              cultura visual y educación superior.
            </p>
          </div>

          <div className="timeline-list">
            {timeline.map((entry, index) => (
              <Reveal className="timeline-entry" key={`${entry.years}-${entry.place}`} delay={index * 45}>
                <span>{entry.years}</span>
                <h3>{entry.role}</h3>
                <p>{entry.place}</p>
              </Reveal>
            ))}
          </div>

          <div className="trajectory-facts">
            <div><strong>20</strong><span>años dedicados a la educación</span></div>
            <div><strong>35</strong><span>asignaturas impartidas</span></div>
            <div><strong>15</strong><span>conferencias seleccionadas</span></div>
            <div><strong>12</strong><span>ediciones de eventos coordinadas</span></div>
          </div>
        </div>
      </section>

      <section id="colaboraciones" className="collaboration-section shell section-pad">
        <div className="collaboration-heading">
          <p className="eyebrow">Otras conversaciones</p>
          <h2>Donde también puedes escucharme.</h2>
          <p>Podcasts y videopodcasts en los que Carlos participa como invitado.</p>
        </div>

        <div className="collaboration-list">
          {collaborations.map((item, index) => (
            <Reveal as="article" className="collaboration-item" key={item.href} delay={(index % 3) * 45}>
              <a href={item.href} target="_blank" rel="noreferrer">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p>{item.outlet}</p>
                  <h3>{item.title}</h3>
                </div>
                <span>{item.year}</span>
                <b aria-hidden="true">↗</b>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="archive-index">
        <div className="shell section-pad-sm">
          <div className="archive-index-heading">
            <p className="eyebrow">Índice documental</p>
            <h2>El archivo completo.</h2>
            <p>
              Enlaces reunidos y ordenados para investigadores, periodistas y personas
              que quieran seguir tirando del hilo.
            </p>
          </div>

          <div className="archive-groups">
            {fullArchive.map((group, groupIndex) => (
              <details className="archive-group" key={group.title} open={groupIndex === 0}>
                <summary>
                  <span>{String(groupIndex + 1).padStart(2, "0")}</span>
                  <h3>{group.title}</h3>
                  <b>{group.items.length}</b>
                  <i aria-hidden="true">+</i>
                </summary>
                <div className="archive-links">
                  {group.items.map(([label, href], itemIndex) => (
                    <a href={href} target="_blank" rel="noreferrer" key={href}>
                      <span>{String(itemIndex + 1).padStart(2, "0")}</span>
                      <span>{label}</span>
                      <span>{new URL(href).hostname.replace("www.", "")}</span>
                      <b aria-hidden="true">↗</b>
                    </a>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
