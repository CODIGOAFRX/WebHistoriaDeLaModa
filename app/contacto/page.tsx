import type { Metadata } from "next";
import { PageIntro } from "../components/PageIntro";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta con Carlos Sánchez de Medina para conferencias, docencia, medios y colaboraciones.",
};

export default function ContactPage() {
  return (
    <>
      <PageIntro
        index="07"
        eyebrow="Contacto"
        title="Hablemos."
        summary="Para propuestas de conferencias, docencia, entrevistas o colaboraciones, cuéntanos aquí lo esencial."
        aside="Los mensajes llegan al estudio de Historia de la Moda y se responden por correo electrónico."
      />

      <section className="contact-section shell section-pad-sm" aria-labelledby="contact-heading">
        <div className="contact-context">
          <p className="eyebrow">Una conversación directa</p>
          <h2 id="contact-heading">¿Qué tienes entre manos?</h2>
          <p>
            Indica el tipo de propuesta, la entidad y las fechas orientativas. Así podremos
            darte una respuesta útil desde el primer correo.
          </p>
        </div>
        <ContactForm />
      </section>
    </>
  );
}
