import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function source(pathname) {
  return readFile(new URL(pathname, projectRoot), "utf8");
}

test("uses the approved professional description and Granada location", async () => {
  const [home, layout] = await Promise.all([
    source("app/page.tsx"),
    source("app/layout.tsx"),
  ]);

  const combined = `${home}\n${layout}`;
  const lead = home.match(/<p className="about-lead">([\s\S]*?)<\/p>/)?.[1] ?? "";
  const normalizedLead = lead.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  assert.equal(
    normalizedLead,
    "Historiador del arte e investigador. Estudia la indumentaria y la moda como documentos culturales, expresiones de su contexto histórico, artístico y social.",
  );
  assert.match(home, /Docencia, investigación y divulgación/i);
  assert.match(home, /Granada · 2026/);
  assert.match(home, /ELLE Education · Universidad Camilo José Cela/);
  assert.doesNotMatch(home, /Istituto Europeo di Design|featured-quote-mark/);
  assert.doesNotMatch(combined, /doctorando|licenciado|Madrid|Escuela Arte Granada/i);
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
  const navigationBlock = header.match(/const navigation = \[([\s\S]*?)\];/)?.[1] ?? "";
  const navigationLabels = [...navigationBlock.matchAll(/label: "([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(navigationLabels, [
    "Historia",
    "Podcasts",
    "Conferencias",
    "Aula",
    "Archivo",
    "Biblioteca",
    "Contacto",
  ]);
  assert.doesNotMatch(header, /nav-instagram|>\s*Instagram\s*</i);
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

test("keeps unpublished editorial projects out of the public site and seed data", async () => {
  const [home, library, libraryGrid, styles, content] = await Promise.all([
    source("app/page.tsx"),
    source("app/biblioteca/page.tsx"),
    source("app/biblioteca/LibraryGrid.tsx"),
    source("app/globals.css"),
    source("db/content.ts"),
  ]);

  assert.doesNotMatch(home, /book-section|book-title-lines|book-publisher/i);
  assert.doesNotMatch(styles, /\.book-section|\.book-title-lines|\.upcoming-book|\.chanel-video/i);
  assert.match(content, /FALLBACK_BOOKS:\s*readonly BookRecord\[\]\s*=\s*\[\]/);
  assert.match(library, /La biblioteca de Historia de la Moda/i);
  assert.doesNotMatch(
    library,
    /<PageIntro|Leer para mirar mejor|Distintas formas de seguir el hilo|const resources|library-resources/i,
  );
  assert.doesNotMatch(libraryGrid, /Próxima incorporación|Una estantería en crecimiento/i);
  assert.match(libraryGrid, /role="group"/);
  assert.match(libraryGrid, /aria-pressed=/);
  assert.match(libraryGrid, /if \(!books\.length\)/);
  assert.match(libraryGrid, /role="status"/);
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
  assert.match(contactForm, /submissionId/);
  assert.match(contactRoute, /Idempotency-Key.*contact-/s);
  const adminContentRoute = await source("app/api/admin/content/route.ts");
  assert.match(adminContentRoute, /requireSecure/);
  assert.match(adminContentRoute, /debe usar HTTPS o comenzar por/);
});

test("keeps the archive focused on television and uses descriptive link titles", async () => {
  const [archive, styles] = await Promise.all([
    source("app/archivo/page.tsx"),
    source("app/globals.css"),
  ]);
  const featuredMedia = archive.match(/const featuredMedia = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
  const fullArchive = archive.match(/const fullArchive = \[([\s\S]*?)\n\];/)?.[1] ?? "";
  const publications = fullArchive.match(/title: "Publicaciones",([\s\S]*?)title: "Entrevistas"/)?.[1] ?? "";
  const interviews = fullArchive.match(/title: "Entrevistas",([\s\S]*?)title: "Documentales y directos"/)?.[1] ?? "";

  assert.match(archive, /En la televisión\./i);
  assert.doesNotMatch(archive, /En los medios\.|const institutions|trajectory-section/i);
  assert.match(archive, /RTVE Play · La 2/);
  assert.match(archive, /Serie · 12 capítulos/);
  assert.match(
    styles,
    /\.media-feature-card\s*\{[^}]*grid-column:\s*span 6;[^}]*min-height:\s*620px;/s,
  );
  assert.doesNotMatch(styles, /\.media-feature-card-[345][^{]*\{[^}]*grid-column:/s);
  const featuredOrder = [
    featuredMedia.indexOf("Geópolis: la geopolítica de la cosmética"),
    featuredMedia.indexOf("Canal Sur · La Memoria"),
    featuredMedia.indexOf("Canal Sur · Andalucía es moda"),
    featuredMedia.indexOf("Granada TV"),
  ];
  assert.ok(featuredOrder.every((position) => position >= 0));
  assert.deepEqual(featuredOrder, [...featuredOrder].sort((a, b) => a - b));
  assert.doesNotMatch(featuredMedia, /Barbie/i);
  assert.match(archive, /Granada TV\s*[·,:-]\s*La historia de la moda/i);
  assert.doesNotMatch(archive, /const secondaryMedia|Más apariciones/i);
  assert.match(archive, /const archiveCollaborations[\s\S]*Tacones, corsés y cómo vestiremos/i);
  assert.equal((archive.match(/Agonía y ocaso del zapato/gi) ?? []).length, 1);
  assert.match(archive, /La moda está en su peor momento/i);
  assert.match(archive, /Ya no queremos Versace/i);
  assert.match(archive, /Entrevista en Cadena SER/i);
  assert.match(interviews, /La historia de los pantalones vaqueros · Más de uno \(Onda Cero\)[\s\S]*eZGq2_RdGQ4/i);
  assert.match(interviews, /Ya no queremos Versace[\s\S]*Entrevista en Cadena SER/i);
  assert.match(interviews, /Cómo se estudiará el auge de los influencers en la historia de la moda[^\]]*OUux1zjyXdc"\],\s*\n\s*\]/i);
  const groupOrder = [
    fullArchive.indexOf('title: "Historia de la Moda · Andalucía es moda"'),
    fullArchive.indexOf('title: "Publicaciones"'),
    fullArchive.indexOf('title: "Entrevistas"'),
    fullArchive.indexOf('title: "Documentales y directos"'),
    fullArchive.indexOf('title: "Citas y fuentes"'),
    fullArchive.indexOf('title: "Dirección de arte"'),
  ];
  assert.ok(groupOrder.every((position) => position >= 0));
  assert.deepEqual(groupOrder, [...groupOrder].sort((a, b) => a - b));
  assert.match(publications, /Dialnet/i);
  assert.match(publications, /La madeja infinita · Catálogo Ángeles Agrela/i);
  assert.doesNotMatch(publications, /consulta online|slideshare/i);
  assert.doesNotMatch(archive, /10 capítulos disponibles/i);
  for (const title of [
    /Schiaparelli versus Chanel,? con Anita Ruiz/i,
    /La top model de los 90,? con Andy Esmoda/i,
    /Hablando de moda con Pedro Mansilla/i,
    /Hablando de moda con Erea Louro/i,
  ]) {
    assert.match(archive, title);
  }
  assert.doesNotMatch(archive, /Entrevista audiovisual 0[234]|Directo 0[1-4]/i);
  assert.match(archive, /carlos-la-memoria\.jpg/);
  assert.match(archive, /Hablando de moda con Erea Louro/i);
  assert.match(archive, /compan%cc%83ia-laseda-por-kiko-lozano/i);
  assert.doesNotMatch(archive, /Hablando de moda con Nerea Lobo/i);
});
