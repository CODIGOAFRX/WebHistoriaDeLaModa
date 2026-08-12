"use client";

import { FormEvent, useRef, useState } from "react";
import { PUBLIC_CONTACT_EMAIL } from "./contact";

type FormStatus =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>({ state: "idle" });
  const submissionId = useRef<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    submissionId.current ??= crypto.randomUUID();
    setStatus({ state: "sending" });

    try {
      const response = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.get("name"),
          email: values.get("email"),
          organization: values.get("organization"),
          topic: values.get("topic"),
          message: values.get("message"),
          website: values.get("website"),
          consent: values.get("consent") === "yes",
          submissionId: submissionId.current,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus({
          state: "error",
          message: result.error || "No se ha podido enviar el mensaje.",
        });
        return;
      }

      form.reset();
      submissionId.current = null;
      setStatus({
        state: "success",
        message: "Mensaje enviado. Te hemos mandado una confirmación por correo.",
      });
    } catch {
      setStatus({
        state: "error",
        message: `No se ha podido conectar. Puedes escribir a ${PUBLIC_CONTACT_EMAIL}.`,
      });
    }
  }

  return (
    <form
      className="contact-form"
      onSubmit={submit}
      onInput={() => {
        if (status.state === "error" || status.state === "success") {
          if (status.state === "error") submissionId.current = null;
          setStatus({ state: "idle" });
        }
      }}
      aria-busy={status.state === "sending"}
      noValidate={false}
    >
      <fieldset disabled={status.state === "sending"}>
      <div className="contact-field">
        <label htmlFor="contact-name">Nombre y apellidos</label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          minLength={2}
          maxLength={100}
          required
        />
      </div>
      <div className="contact-field">
        <label htmlFor="contact-email">Correo electrónico</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
        />
      </div>
      <div className="contact-field">
        <label htmlFor="contact-organization">Entidad u organización <span>Opcional</span></label>
        <input
          id="contact-organization"
          name="organization"
          type="text"
          autoComplete="organization"
          maxLength={120}
        />
      </div>
      <div className="contact-field">
        <label htmlFor="contact-topic">Motivo</label>
        <select id="contact-topic" name="topic" defaultValue="" required>
          <option value="" disabled>Selecciona una opción</option>
          <option>Conferencias y docencia</option>
          <option>Medios y entrevistas</option>
          <option>Colaboraciones</option>
          <option>Aula y cursos</option>
          <option>Otro</option>
        </select>
      </div>
      <div className="contact-field contact-field--wide">
        <label htmlFor="contact-message">Mensaje</label>
        <textarea
          id="contact-message"
          name="message"
          rows={7}
          minLength={20}
          maxLength={3000}
          required
        />
      </div>
      <div className="contact-honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Página web</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="contact-consent">
        <input name="consent" type="checkbox" value="yes" required />
        <span>Autorizo el uso de estos datos únicamente para responder a mi consulta.</span>
      </label>
      <div className="contact-submit-row">
        <button className="button-link" type="submit">
          {status.state === "sending" ? "Enviando…" : "Enviar mensaje"}
        </button>
        <a className="text-link" href={`mailto:${PUBLIC_CONTACT_EMAIL}`}>
          {PUBLIC_CONTACT_EMAIL}
        </a>
      </div>
      </fieldset>
      {status.state === "success" ? (
        <p className="contact-status is-success" role="status">{status.message}</p>
      ) : null}
      {status.state === "error" ? (
        <p className="contact-status is-error" role="alert">{status.message}</p>
      ) : null}
    </form>
  );
}
