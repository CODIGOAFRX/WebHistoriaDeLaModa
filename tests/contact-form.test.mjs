import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContactEmail,
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
