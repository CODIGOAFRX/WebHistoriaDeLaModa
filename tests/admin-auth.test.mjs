import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdminSession,
  createAdminSessionCookie,
  expireAdminSessionCookie,
  getAdminCredentials,
  getAdminSessionFromCookieHeader,
  isAdminConfigurationReady,
  isLocalAdminHost,
  verifyAdminCredentials,
  verifyAdminSession,
} from "../app/admin/auth.ts";

const environment = {
  ADMIN_USERNAME: "gestor",
  ADMIN_PASSWORD: "una-clave-de-prueba",
  ADMIN_SESSION_SECRET: "un-secreto-de-sesion-distinto-y-largo",
};

test("allows the temporary admin/admin defaults only when explicitly local", () => {
  assert.equal(getAdminCredentials({}), null);
  assert.equal(isAdminConfigurationReady({}), false);
  assert.deepEqual(getAdminCredentials({}, { allowInsecureDefaults: true }), {
    username: "admin",
    password: "admin",
  });
  assert.equal(
    isAdminConfigurationReady({}, { allowInsecureDefaults: true }),
    true,
  );
});

test("recognizes loopback hosts without trusting lookalike domains", () => {
  for (const host of [
    "localhost",
    "localhost:30000",
    "127.0.0.1",
    "127.0.0.1:30000",
    "[::1]:30000",
    "::1",
  ]) {
    assert.equal(isLocalAdminHost(host), true, host);
  }
  for (const host of [
    "historiadelamoda.net",
    "localhost.historiadelamoda.net",
    "localhost@historiadelamoda.net",
    "",
    undefined,
  ]) {
    assert.equal(isLocalAdminHost(host), false, String(host));
  }
});

test("fails closed with incomplete production configuration", () => {
  assert.equal(
    getAdminCredentials({ ADMIN_USERNAME: "gestor" }),
    null,
  );
  assert.equal(
    getAdminCredentials({ ADMIN_PASSWORD: "clave" }),
    null,
  );
  assert.equal(
    isAdminConfigurationReady({
      ADMIN_USERNAME: "gestor",
      ADMIN_PASSWORD: "clave",
    }),
    false,
  );
});

test("compares both credentials and rejects partial matches", async () => {
  assert.equal(
    await verifyAdminCredentials("gestor", "una-clave-de-prueba", environment),
    true,
  );
  assert.equal(
    await verifyAdminCredentials("gestor", "incorrecta", environment),
    false,
  );
  assert.equal(
    await verifyAdminCredentials("otro", "una-clave-de-prueba", environment),
    false,
  );
});

test("signs, validates and expires an admin session", async () => {
  const issuedAt = Date.UTC(2026, 7, 11, 10, 0, 0);
  const token = await createAdminSession("gestor", environment, issuedAt);
  const valid = await verifyAdminSession(token, environment, issuedAt + 60_000);

  assert.equal(valid?.username, "gestor");
  assert.equal(
    await verifyAdminSession(token, environment, issuedAt + 8 * 60 * 60 * 1000),
    null,
  );
  assert.equal(
    await verifyAdminSession(token, { ...environment, ADMIN_SESSION_SECRET: "otro" }, issuedAt),
    null,
  );
});

test("rejects tampered tokens", async () => {
  const issuedAt = Date.UTC(2026, 7, 11, 10, 0, 0);
  const token = await createAdminSession("gestor", environment, issuedAt);
  const [payload, signature] = token.split(".");
  const tampered = `${payload?.slice(0, -1)}A.${signature}`;

  assert.equal(await verifyAdminSession(tampered, environment, issuedAt), null);
});

test("does not accept a localhost default session under production policy", async () => {
  const issuedAt = Date.UTC(2026, 7, 11, 10, 0, 0);
  const localOptions = { allowInsecureDefaults: true };
  const token = await createAdminSession("admin", {}, issuedAt, localOptions);

  assert.equal(
    (await verifyAdminSession(token, {}, issuedAt, localOptions))?.username,
    "admin",
  );
  assert.equal(await verifyAdminSession(token, {}, issuedAt), null);
});

test("builds an HttpOnly Strict cookie shared by /admin and its API", async () => {
  const issuedAt = Date.UTC(2026, 7, 11, 10, 0, 0);
  const token = await createAdminSession("gestor", environment, issuedAt);
  const cookie = createAdminSessionCookie(token, true);

  assert.match(cookie, /^hdlm_admin_session=/);
  assert.match(cookie, /; Path=\//);
  assert.match(cookie, /; HttpOnly/);
  assert.match(cookie, /; SameSite=Strict/);
  assert.match(cookie, /; Secure/);
  assert.equal(
    (
      await getAdminSessionFromCookieHeader(
        `preference=compact; ${cookie.split(";")[0]}`,
        environment,
        issuedAt,
      )
    )?.username,
    "gestor",
  );
  assert.match(expireAdminSessionCookie(false), /Max-Age=0/);
});
