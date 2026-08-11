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
  assert.doesNotMatch(combined, /doctorando|licenciado|Madrid/i);
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
  assert.match(layout, /logo-icon\.png\?v=20260811/);
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
