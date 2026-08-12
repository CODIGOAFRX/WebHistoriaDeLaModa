import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicCourses } from "../../../db/content";

export const dynamic = "force-dynamic";

type CoursePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = (await getPublicCourses()).find((item) => item.slug === slug);
  return {
    title: course?.title ?? "Curso",
    description: course?.description ?? "Curso online de Historia de la Moda.",
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = (await getPublicCourses()).find((item) => item.slug === slug);
  if (!course) notFound();

  return (
    <section className="course-room shell section-pad-sm">
      <div className="course-room-header">
        <div>
          <p className="eyebrow">Aula Historia de la Moda · {course.category}</p>
          <h1>{course.title}</h1>
        </div>
        <a className="text-link" href="/escuela">
          Volver al aula
        </a>
      </div>

      {course.scormUrl ? (
        <>
          <div className="course-room-frame">
            <iframe
              title={`Curso ${course.title}`}
              src={course.scormUrl}
              loading="lazy"
              allow="fullscreen"
              allowFullScreen
              sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
            />
          </div>
          <a className="text-link" href={course.scormUrl} target="_blank" rel="noreferrer">
            Abrir el curso en una pestaña nueva
          </a>
        </>
      ) : (
        <div className="empty-state">
          <h2>Este curso todavía está en preparación.</h2>
          <p>El aula se abrirá cuando el contenido esté listo.</p>
        </div>
      )}
    </section>
  );
}
