import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContactConfirmationEmail,
  buildContactEmail,
  buildContactEmailBatch,
  PUBLIC_CONTACT_EMAIL,
  readBodyWithinLimit,
  validateContactPayload,
} from "../app/contacto/contact.ts";

const validPayload = {
  name: "Ana Pérez",
  email: "ANA@example.com",
  organization: "Universidad de Granada",
  topic: "Conferencias y docencia",
  message: "Nos gustaría invitar a Carlos a una conferencia en noviembre.",
  website: "",
  consent: true,
};

test("validates and normalizes a legitimate contact message", () => {
  const result = validateContactPayload(validPayload);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.isBot, false);
  assert.equal(result.data.email, "ana@example.com");
  assert.equal(result.data.organization, "Universidad de Granada");
});

test("rejects incomplete, oversized or unconsented messages", () => {
  for (const payload of [
    { ...validPayload, email: "correo-inválido" },
    { ...validPayload, message: "Muy corto" },
    { ...validPayload, consent: false },
    { ...validPayload, organization: "x".repeat(121) },
  ]) {
    assert.equal(validateContactPayload(payload).ok, false);
  }
});

test("marks the honeypot as a bot without exposing that decision", () => {
  const result = validateContactPayload({ ...validPayload, website: "https://spam.example" });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.isBot, true);
});

test("builds a plain-text email and removes header newlines", () => {
  const email = buildContactEmail({
    name: "Ana\r\nBcc: intruso@example.com",
    email: "ana@example.com",
    organization: "Museo",
    topic: "Otro\nAsunto",
    message: "Un mensaje de prueba suficientemente largo.",
  });
  assert.doesNotMatch(email.subject, /[\r\n]/);
  assert.match(email.text, /Correo: ana@example\.com/);
  assert.match(email.text, /Entidad: Museo/);
});

test("builds the internal message and the automatic confirmation as one batch", () => {
  const confirmation = buildContactConfirmationEmail();
  assert.match(confirmation.subject, /Hemos recibido tu mensaje/);
  assert.match(confirmation.text, /equipo de Historia de la Moda/i);
  assert.match(confirmation.text, /responderemos lo antes posible/i);

  const batch = buildContactEmailBatch(
    {
      name: "Ana Pérez",
      email: "ana@example.com",
      organization: "Museo",
      topic: "Otro",
      message: "Un mensaje de prueba suficientemente largo.",
    },
    `Historia de la Moda <${PUBLIC_CONTACT_EMAIL}>`,
  );

  assert.equal(batch.length, 2);
  assert.deepEqual(batch[0].to, [PUBLIC_CONTACT_EMAIL]);
  assert.equal(batch[0].reply_to, "ana@example.com");
  assert.deepEqual(batch[1].to, ["ana@example.com"]);
  assert.equal(batch[1].reply_to, PUBLIC_CONTACT_EMAIL);
});

test("stops reading request bodies as soon as the byte limit is exceeded", async () => {
  const accepted = await readBodyWithinLimit(
    new Request("https://example.com/contacto", {
      method: "POST",
      body: "ábc",
    }),
    4,
  );
  assert.deepEqual(accepted, { ok: true, text: "ábc" });

  const rejected = await readBodyWithinLimit(
    new Request("https://example.com/contacto", {
      method: "POST",
      body: "demasiado grande",
    }),
    8,
  );
  assert.deepEqual(rejected, { ok: false, reason: "too-large" });
});
