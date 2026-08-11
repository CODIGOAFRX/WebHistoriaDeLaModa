import type { Metadata } from "next";
import { PageIntro } from "../components/PageIntro";
import { Reveal } from "../components/Reveal";
import { collaborations } from "../data/content";

export const metadata: Metadata = {
  title: "Archivo y trayectoria",
  description:
    "Archivo de medios, entrevistas, publicaciones, colaboraciones y trayectoria académica de Carlos Sánchez de Medina.",
};

const featuredMedia = [
  {
    outlet: "RTVE Play · La 2",
    title: "Geópolis: la geopolítica de la cosmética",
    year: "2024",
    kind: "Televisión",
    href: "https://www.rtve.es/play/videos/geopolis/la-geopolitica-de-la-cosmetica/16053311/",
    image: "https://img.rtve.es/v/16053311/?w=1200",
    imageAlt: "Miniatura oficial de La geopolítica de la cosmética, de Geópolis",
    description:
      "Carlos participa en el estreno del programa conducido por Silvia Intxaurrondo.",
  },
  {
    outlet: "Canal Sur · Andalucía es moda",
    title: "Historia de la Moda",
    year: "2024–2025",
    kind: "Serie · 12 capítulos",
    href: "https://www.canalsur.es/television/andalucia-es-moda/",
    image:
      "https://static.canalsur.es/clip/eae0007c-845e-494f-94f7-0891c013e912_facebook-aspect-ratio_default_0.jpg",
    imageAlt: "Imagen oficial del programa Andalucía es moda de Canal Sur",
    description:
      "Sección fija de Carlos dentro del programa presentado por Laura Sánchez. La serie reúne 12 capítulos; el archivo enlaza las 10 entregas verificadas.",
  },
  {
    outlet: "Canal Sur · La Memoria",
    title: "Indumentaria, moda, evolución y género",
    year: "2023",
    kind: "Entrevista",
    href: "https://www.canalsurmas.es/videos/detail/76072-la-memoria-27052023",
    image: "/images/media/carlos-la-memoria.jpg",
    imageAlt: "Carlos Sánchez de Medina durante su entrevista en La Memoria de Canal Sur",
    description:
      "Una conversación sobre la dimensión cultural y social de aquello que vestimos.",
  },
  {
    outlet: "Canal Sur · Andalucía es moda",
    title: "La historia de Barbie, musa de los grandes diseñadores",
    year: "2024",
    kind: "Capítulo",
    href: "https://www.canalsur.es/television/andalucia-es-moda/historia-barbie-musa-mejores-disenadores_1_1303458.html",
    image:
      "https://static.canalsur.es/clip/e7056805-521b-4314-8d09-e86ba3b00098_facebook-aspect-ratio_default_0.jpg",
    imageAlt: "Miniatura oficial del capítulo sobre Barbie en Andalucía es moda",
    description:
      "Una de las entregas de la sección Historia de la Moda, disponible en Canal Sur.",
  },
] as const;

const secondaryMedia = [
  {
    outlet: "La Vanguardia",
    title: "Agonía y ocaso del zapato",
    year: "2026",
    href: "https://www.lavanguardia.com/vida/20260322/11495827/agonia-ocaso-zapato.html",
  },
  {
    outlet: "El Confidencial · Pausa",
    title: "Tacones, corsés y cómo vestiremos",
    year: "2023",
    href: "https://www.elconfidencial.com/espana/2023-09-28/pausa-podcast-tacones-corses-vestiremos_3743282/",
  },
] as const;

const institutions = [
  {
    place: "Estación Diseño · Escuela Superior de Diseño",
    role: "Fundador, dirección académica, jefatura de estudios y docencia",
  },
  {
    place: "ELLE Education · Universidad Camilo José Cela",
    role: "Docencia en Historia de la Moda",
  },
  {
    place: "ESCO · Escuela Superior de Comunicación y Marketing de Granada",
    role: "Dirección académica de grados universitarios y docencia",
  },
  {
    place: "Escuela de Dirección y Altos Estudios (EDIAE) · Cámara Granada",
    role: "Docencia en Historia del Lujo",
  },
  {
    place: "Universidad de Almería",
    role: "Conferencia sobre indumentaria y pintura",
  },
  {
    place: "Escuela de Arte y Superior de Diseño Carlos Pérez Siquier · Almería",
    role: "Conferencias sobre indumentaria, arte y cultura visual",
  },
  {
    place: "Universidad de Málaga",
    role: "Conferencias sobre diseño e indumentaria",
  },
  {
    place: "Museo Automovilístico y de la Moda de Málaga",
    role: "Masterclasses de Historia de la Moda",
  },
  {
    place: "Universidad de Extremadura",
    role: "Docencia y conferencias sobre creatividad y proyectos",
  },
  {
    place: "UPAEP · Universidad Popular Autónoma del Estado de Puebla, México",
    role: "Conferencia sobre arte y moda",
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
    title: "Historia de la Moda · Andalucía es moda · 10 capítulos disponibles",
    items: [
      ["Mariano Fortuny", "https://www.youtube.com/watch?v=PAYH7oEPRLA"],
      ["La moda transforma el cuerpo", "https://www.youtube.com/watch?v=zxyUOM7M3pI"],
      ["Los vestidos joya", "https://www.youtube.com/watch?v=2ZbKxVa9soY"],
      ["La historia de los trajes de novia", "https://www.youtube.com/watch?v=Ic2uyonDcB0"],
      ["El color negro en la moda", "https://www.youtube.com/watch?v=3L3J-PbCPA0"],
      ["Alta costura y prêt-à-porter", "https://www.youtube.com/watch?v=KatzvQxlBEs"],
      ["El Museo del Automóvil y la Moda de Málaga", "https://www.youtube.com/watch?v=iVBgxn7C1Pg"],
      ["Los ornamentos litúrgicos", "https://www.youtube.com/watch?v=3DF7lCXymYQ"],
      ["La historia de Barbie", "https://www.youtube.com/watch?v=1bZeolL_RzE"],
      ["La historia de los pantalones vaqueros", "https://www.youtube.com/watch?v=WSHXL3skSPs"],
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
      ["El Confidencial · Tacones, corsés y cómo vestiremos", "https://www.elconfidencial.com/espana/2023-09-28/pausa-podcast-tacones-corses-vestiremos_3743282/"],
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
          {featuredMedia.map((item, index) => (
            <Reveal as="article" className={`media-feature-card media-feature-card-${index + 1}`} key={item.href} delay={index * 60}>
              <a href={item.href} target="_blank" rel="noreferrer">
                <img src={item.image} alt={item.imageAlt} loading="lazy" />
                <div className="media-feature-meta">
                  <span>{item.kind}</span>
                  <span>{item.year}</span>
                </div>
                <p className="eyebrow">{item.outlet}</p>
                <h3>{item.title}</h3>
                <p className="media-feature-description">{item.description}</p>
              </a>
            </Reveal>
          ))}
        </div>

        <div className="media-secondary" aria-labelledby="secondary-media-title">
          <div>
            <p className="eyebrow">Prensa y audio</p>
            <h3 id="secondary-media-title">Más apariciones.</h3>
          </div>
          <div className="media-secondary-links">
            {secondaryMedia.map((item) => (
              <a href={item.href} target="_blank" rel="noreferrer" key={item.href}>
                <span>{item.outlet}</span>
                <strong>{item.title}</strong>
                <small>{item.year}</small>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="trajectory-section">
        <div className="shell section-pad-sm">
          <div className="trajectory-heading">
            <p className="eyebrow">Trayectoria académica</p>
            <p>
              Historiador del arte e investigador, Carlos desarrolla su práctica entre
              la docencia, la dirección académica, la cultura visual y la divulgación.
            </p>
          </div>

          <div className="timeline-list">
            {institutions.map((entry, index) => (
              <Reveal className="timeline-entry" key={entry.place} delay={(index % 4) * 45}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{entry.place}</h3>
                <p>{entry.role}</p>
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
