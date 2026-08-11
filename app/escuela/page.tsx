import type { Metadata } from "next";
import { getPublicCourses } from "../../db/content";
import { PageIntro } from "../components/PageIntro";
import { Reveal } from "../components/Reveal";

export const metadata: Metadata = {
  title: "Aula Historia de la Moda",
  description:
    "Cursos online con Carlos Sánchez de Medina para aprender historia de la moda, cultura visual y método de investigación.",
};

export const dynamic = "force-dynamic";

const method = [
  {
    number: "01",
    title: "Mirar",
    text: "Aprender a detectar formas, códigos, materiales y detalles antes de buscar respuestas.",
  },
  {
    number: "02",
    title: "Relacionar",
    text: "Conectar una prenda con su contexto artístico, económico, político y social.",
  },
  {
    number: "03",
    title: "Contar",
    text: "Convertir investigación en una historia rigurosa que otra persona quiera escuchar.",
  },
];

function formatPrice(priceCents: number) {
  if (!priceCents) return "Próximamente";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}

export default async function SchoolPage() {
  const courses = await getPublicCourses();

  return (
    <>
      <PageIntro
        index="04"
        eyebrow="Aula Historia de la Moda"
        title="Aprender a mirar."
        summary="Una escuela online para estudiar la moda con contexto, método y el placer de una buena historia."
        aside="Cursos en preparación. El aula ya está diseñada para alojar experiencias SCORM dentro de la propia web."
      />

      <section className="school-origin shell section-pad">
        <div className="school-origin-image">
          <img
            src="/images/media/carlos-classroom.webp"
            alt="Carlos Sánchez de Medina impartiendo clase"
            loading="lazy"
          />
          <span>Docencia desde 2006</span>
        </div>

        <div className="school-origin-copy">
          <p className="eyebrow">Aprende con Carlos</p>
          <h2>Veinte años de aula, ahora también online.</h2>
          <p>
            Carlos ha impartido Historia del Arte, Historia de la Indumentaria,
            Historia de la Moda, cultura visual, diseño e imagen en educación superior.
            El Aula reúne esa experiencia en recorridos claros, visuales y exigentes.
          </p>
          <dl className="school-facts">
            <div><dt>35</dt><dd>asignaturas impartidas</dd></div>
            <div><dt>20</dt><dd>años de experiencia docente</dd></div>
            <div><dt>01</dt><dd>método: mirar, relacionar, contar</dd></div>
          </dl>
        </div>
      </section>

      <section className="method-section">
        <div className="shell section-pad-sm">
          <div className="method-heading">
            <p className="eyebrow">El método</p>
            <h2>Del detalle al relato.</h2>
          </div>
          <div className="method-grid">
            {method.map((item, index) => (
              <Reveal as="article" className="method-card" key={item.number} delay={index * 70}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="courses-section shell section-pad">
        <div className="courses-heading">
          <p className="eyebrow">Cursos online</p>
          <h2>La primera colección.</h2>
          <p>
            Programas en desarrollo. Puedes apuntarte a la lista o, cuando un curso
            esté activo, entrar directamente en el aula desde aquí.
          </p>
        </div>

        {courses.length ? (
          <div className="course-grid-public">
            {courses.map((course, index) => (
              <Reveal as="article" className="course-card-public" key={course.id} delay={index * 70}>
                <div className={`course-card-image course-tone-${(index % 3) + 1}`}>
                  {course.imageUrl ? <img src={course.imageUrl} alt="" loading="lazy" /> : null}
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{course.category}</p>
                </div>
                <div className="course-card-copy">
                  <div>
                    <span>{formatPrice(course.priceCents)}</span>
                    <span>{course.scormUrl ? "Aula disponible" : "En preparación"}</span>
                  </div>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  {course.scormUrl ? (
                    <a className="button-link" href={`/escuela/${course.slug}`}>
                      Entrar al aula <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <a
                      className="text-link"
                      href={`mailto:demedinamoda@gmail.com?subject=${encodeURIComponent(`Lista de espera: ${course.title}`)}`}
                    >
                      Apuntarme a la lista <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>La programación está tomando forma.</h3>
            <p>Pronto aparecerán aquí los primeros recorridos formativos.</p>
          </div>
        )}
      </section>

      <section className="scorm-section">
        <div className="shell scorm-grid">
          <p className="eyebrow">Un aula preparada para crecer</p>
          <h2>Contenido interactivo, sin salir de Historia de la Moda.</h2>
          <p>
            Los cursos pueden incorporar experiencias SCORM, actividades y recursos
            interactivos dentro del aula. La gestión de títulos y lanzamientos ya está
            disponible en el área privada de administración.
          </p>
          <div className="scorm-window" aria-hidden="true">
            <div><span /><span /><span /></div>
            <p>Lección 01</p>
            <strong>Aprender a leer una silueta</strong>
            <span>Progreso · 00%</span>
          </div>
        </div>
      </section>
    </>
  );
}
