import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function source(pathname) {
  return readFile(new URL(pathname, projectRoot), "utf8");
}

test("uses the approved professional description and Granada location", async () => {
  const [home, archive, layout] = await Promise.all([
    source("app/page.tsx"),
    source("app/archivo/page.tsx"),
    source("app/layout.tsx"),
  ]);

  const combined = `${home}\n${archive}\n${layout}`;
  assert.match(combined, /Historiador del arte e investigador/i);
  assert.match(home, /Granada · 2026/);
  assert.match(home, /ELLE Education · Universidad Camilo José Cela/);
  assert.doesNotMatch(home, /Istituto Europeo di Design|featured-quote-mark/);
  assert.doesNotMatch(combined, /doctorando|licenciado|Madrid|Escuela Arte Granada/i);
  assert.match(archive, /Universidad de Almería/);
  assert.match(archive, /Escuela de Arte y Superior de Diseño Carlos Pérez Siquier/);
});

test("keeps the requested social profiles and brand assets explicit", async () => {
  const [socials, header, layout] = await Promise.all([
    source("app/components/SocialLinks.tsx"),
    source("app/components/SiteHeader.tsx"),
    source("app/layout.tsx"),
  ]);

  for (const network of ["Instagram", "TikTok", "YouTube", "LinkedIn", "Spotify", "iVoox"]) {
    assert.match(socials, new RegExp(`label: "${network}"`), network);
  }
  assert.match(header, /logo-wordmark-white\.png/);
  assert.match(header, /href: "\/contacto", label: "Contacto"/);
  assert.doesNotMatch(layout, /icons:\s*{/);
});

test("conference archive is newest-first and omits rejected talks", async () => {
  const content = await source("app/data/content.ts");
  const conferenceStart = content.indexOf("export const conferences");
  const conferenceEnd = content.indexOf("export const", conferenceStart + 20);
  const conferenceBlock = content.slice(
    conferenceStart,
    conferenceEnd === -1 ? undefined : conferenceEnd,
  );

  const years = [...conferenceBlock.matchAll(/year:\s*"(20\d{2})"/g)].map((match) =>
    Number(match[1]),
  );
  assert.ok(years.length >= 4, "conference archive should contain a meaningful selection");
  assert.deepEqual(years, [...years].sort((a, b) => b - a));
  assert.doesNotMatch(
    conferenceBlock,
    /Los mejores vestidos de la historia del cine|La historia del abanico/i,
  );
});

test("removes decorative diagonal arrows and rejected filler copy from app source", async () => {
  const files = [
    "app/page.tsx",
    "app/podcasts/page.tsx",
    "app/conferencias/page.tsx",
    "app/biblioteca/page.tsx",
    "app/escuela/page.tsx",
    "app/archivo/page.tsx",
    "app/components/Footer.tsx",
    "app/components/SectionHeading.tsx",
    "app/components/SiteHeader.tsx",
    "app/admin/AdminStudio.tsx",
  ];
  const combined = (await Promise.all(files.map(source))).join("\n");

  assert.doesNotMatch(combined, /↗/);
  assert.doesNotMatch(
    combined,
    /Rigor sin distancia|Una imagen, una puerta|Conversaci.n abierta|Una buena conferencia|Cada publicaci.n empieza|Aprender a leer una silueta|Historias para escuchar/i,
  );
});

test("keeps the Chanel title on complete editorial lines only on the homepage", async () => {
  const [home, library, styles] = await Promise.all([
    source("app/page.tsx"),
    source("app/biblioteca/page.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(home, /className="book-title-lines"/);
  assert.match(home, /<span aria-hidden="true">reconocer<\/span>/);
  assert.doesNotMatch(library, /Cómo reconocer un Chanel|ryqmzyayQBE/i);
  assert.match(library, /La biblioteca de Historia de la Moda/i);
  assert.match(styles, /\.book-title-lines > span\s*{[^}]*display:\s*block;[^}]*white-space:\s*nowrap;/s);
});

test("exposes the verified 2026 conference and a real contact form", async () => {
  const [conferences, contactPage, contactForm, contactRoute, rateLimit, viteConfig] = await Promise.all([
    source("app/conferencias/page.tsx"),
    source("app/contacto/page.tsx"),
    source("app/contacto/ContactForm.tsx"),
    source("app/api/contacto/route.ts"),
    source("app/api/contacto/rate-limit.ts"),
    source("vite.config.ts"),
  ]);

  assert.match(conferences, /wUzjeWzRTWQ/);
  assert.match(conferences, /date: "2018-11-27"/);
  assert.match(conferences, /displayDate: "2011"/);
  assert.doesNotMatch(conferences, /duration/);
  assert.match(contactPage, /title="Hablemos\."/);
  assert.match(contactForm, /name="message"/);
  assert.match(contactForm, /name="consent"/);
  assert.match(contactRoute, /api\.resend\.com\/emails/);
  assert.match(contactRoute, /getContactRateLimiter/);
  assert.match(rateLimit, /CONTACT_RATE_LIMITER/);
  assert.match(viteConfig, /CONTACT_RATE_LIMITER/);
  assert.match(contactRoute, /readBodyWithinLimit/);
});

test("prioritizes television and uses a different La Memoria still", async () => {
  const archive = await source("app/archivo/page.tsx");
  assert.match(archive, /RTVE Play · La 2/);
  assert.match(archive, /Serie · 12 capítulos/);
  assert.match(archive, /10 capítulos disponibles/);
  assert.match(archive, /carlos-la-memoria\.jpg/);
  assert.match(archive, /const secondaryMedia[\s\S]*La Vanguardia/);
});
