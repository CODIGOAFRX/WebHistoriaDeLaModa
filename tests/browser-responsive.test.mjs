import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test, { after, before } from "node:test";
import { chromium } from "playwright-core";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vinextCli = path.join(projectRoot, "node_modules", "vinext", "dist", "cli.js");
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const viewports = [
  { label: "desktop-wide", width: 1920, height: 1080 },
  { label: "desktop", width: 1440, height: 900 },
  { label: "laptop", width: 1024, height: 768 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "mobile", width: 390, height: 844 },
  { label: "mobile-small", width: 320, height: 800 },
];

const publicRoutes = [
  "/",
  "/podcasts",
  "/conferencias",
  "/biblioteca",
  "/escuela",
  "/archivo",
  "/contacto",
  "/admin/login",
];

let baseUrl;
let browser;
let serverProcess;
let serverOutput = "";

async function availablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function browserExecutable() {
  for (const candidate of [edgePath, chromePath]) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next installed Chromium browser.
    }
  }
  throw new Error("Microsoft Edge or Google Chrome is required for responsive QA.");
}

async function waitForServer(url) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`vinext start stopped early.\n${serverOutput}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`vinext start did not become ready.\n${serverOutput}`);
}

async function createContext(viewport, reducedMotion = "reduce") {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    locale: "es-ES",
    reducedMotion,
  });

  await context.route("**/*", async (route) => {
    const requestUrl = route.request().url();
    if (requestUrl.startsWith(baseUrl) || requestUrl.startsWith("data:")) {
      await route.continue();
    } else {
      await route.abort();
    }
  });
  return context;
}

async function settlePage(page) {
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = "auto";
    await document.fonts.ready;
    const step = Math.max(320, Math.floor(window.innerHeight * 0.72));
    for (let top = 0; top < document.documentElement.scrollHeight; top += step) {
      window.scrollTo(0, top);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(80);
}

async function layoutReport(page) {
  return page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const isVisible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0.01 &&
        rect.width > 1 &&
        rect.height > 1
      );
    };
    const label = (element) => {
      const classes = [...element.classList].slice(0, 3).join(".");
      const text = (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 56);
      return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ""}${text ? ` (${text})` : ""}`;
    };

    const horizontalOffenders = [];
    const containers = [
      ...document.querySelectorAll("body > *, main > *, .shell, [class*='grid'], [class*='list']"),
    ];
    const candidates = new Set(containers);
    for (const container of containers) {
      for (const child of container.children) candidates.add(child);
    }

    for (const element of candidates) {
      if (!(element instanceof HTMLElement) || !isVisible(element)) continue;
      if (element.closest(".discipline-strip")) continue;
      if (element.closest(".site-nav:not(.is-open)")) continue;
      const style = getComputedStyle(element);
      if (style.position === "absolute") continue;
      const rect = element.getBoundingClientRect();
      if (rect.left < -2 || rect.right > viewportWidth + 2) {
        horizontalOffenders.push({
          element: label(element),
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          viewportWidth,
        });
      }
    }

    const clippedText = [];
    for (const element of document.querySelectorAll("h1, h2, h3, p, a, button, label, strong")) {
      if (!(element instanceof HTMLElement) || !isVisible(element)) continue;
      if (element.closest(".discipline-strip, .site-nav:not(.is-open)")) continue;
      const style = getComputedStyle(element);
      if (
        element.scrollWidth > element.clientWidth + 2 &&
        style.overflowX === "visible" &&
        style.whiteSpace !== "nowrap"
      ) {
        clippedText.push({
          element: label(element),
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          overflowX: style.overflowX,
        });
      }
    }

    const overlappingText = [];
    const tightText = [];
    for (const element of document.querySelectorAll("h1, h2, h3, blockquote, .footer-statement, .about-lead")) {
      if (!(element instanceof HTMLElement) || !isVisible(element)) continue;
      const style = getComputedStyle(element);
      const fragments = [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let textNode = walker.nextNode();
      while (textNode) {
        if (textNode.textContent?.trim()) {
          const range = document.createRange();
          range.selectNodeContents(textNode);
          fragments.push(
            ...[...range.getClientRects()].filter((rect) => rect.width > 1 && rect.height > 1),
          );
        }
        textNode = walker.nextNode();
      }
      fragments.sort((a, b) => a.top - b.top || a.left - b.left);
      const lines = [];
      for (const fragment of fragments) {
        const existing = lines.find((line) => Math.abs(line.top - fragment.top) < 1.5);
        if (existing) {
          existing.bottom = Math.max(existing.bottom, fragment.bottom);
        } else {
          lines.push({ top: fragment.top, bottom: fragment.bottom });
        }
      }
      lines.sort((a, b) => a.top - b.top);
      if (lines.length > 1) {
        const fontSize = Number.parseFloat(style.fontSize);
        const lineHeight = Number.parseFloat(style.lineHeight);
        if (Number.isFinite(fontSize) && Number.isFinite(lineHeight) && lineHeight / fontSize < 0.999) {
          tightText.push({
            element: label(element),
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
          });
        }
      }
      const selectionBackground = getComputedStyle(element, "::selection").backgroundColor;
      const selectionIsTransparent =
        selectionBackground === "transparent" || /rgba\([^)]*,\s*0\s*\)$/.test(selectionBackground);
      for (let index = 1; index < lines.length; index += 1) {
        if (!selectionIsTransparent && lines[index].top < lines[index - 1].bottom - 1) {
          overlappingText.push({
            element: label(element),
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            overlap: Math.round((lines[index - 1].bottom - lines[index].top) * 10) / 10,
          });
          break;
        }
      }
    }

    const overlapSelectors = [
      ".social-links-list > li",
      ".institution-list > li",
      ".path-list > article",
      ".episode-grid > article",
      ".conference-grid > article",
      ".book-grid-public > article",
      ".trajectory-facts > div",
      ".timeline > article",
      ".archive-links > a",
    ];
    const cardOverlaps = [];
    for (const selector of overlapSelectors) {
      const elements = [...document.querySelectorAll(selector)].filter(isVisible);
      const groups = new Map();
      for (const element of elements) {
        const siblings = groups.get(element.parentElement) ?? [];
        siblings.push(element);
        groups.set(element.parentElement, siblings);
      }
      for (const siblings of groups.values()) {
        for (let first = 0; first < siblings.length; first += 1) {
          const a = siblings[first].getBoundingClientRect();
          for (let second = first + 1; second < siblings.length; second += 1) {
            const b = siblings[second].getBoundingClientRect();
            const overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (overlapWidth > 2 && overlapHeight > 2) {
              cardOverlaps.push(`${label(siblings[first])} <> ${label(siblings[second])}`);
            }
          }
        }
      }
    }

    const rawHorizontal = [...document.querySelectorAll("body *")]
      .filter((element) => element instanceof HTMLElement && isVisible(element))
      .filter((element) => !element.closest(".discipline-strip, .site-nav:not(.is-open)"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          element: label(element),
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          position: style.position,
          overflowX: style.overflowX,
        };
      })
      .filter(
        (item) =>
          item.left < -2 ||
          item.right > viewportWidth + 2 ||
          item.scrollWidth > item.clientWidth + 2,
      )
      .sort((a, b) => Math.max(b.right - viewportWidth, b.scrollWidth - b.clientWidth) - Math.max(a.right - viewportWidth, a.scrollWidth - a.clientWidth))
      .slice(0, 12);

    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      horizontalOffenders: horizontalOffenders.slice(0, 12),
      clippedText: clippedText.slice(0, 12),
      tightText: tightText.slice(0, 12),
      overlappingText: overlappingText.slice(0, 12),
      cardOverlaps: cardOverlaps.slice(0, 12),
      rawHorizontal,
    };
  });
}

async function accessibilityReport(page) {
  await page.addScriptTag({ path: axePath });
  return page.evaluate(async () => {
    const results = await window.axe.run(document, {
      resultTypes: ["violations"],
      rules: {
        "frame-tested": { enabled: false },
      },
    });
    return results.violations
      .filter((violation) => ["critical", "serious", "moderate"].includes(violation.impact))
      .map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: violation.nodes.slice(0, 4).map((node) => node.target.join(" ")),
      }));
  });
}

before(async () => {
  const port = await availablePort();
  baseUrl = `http://127.0.0.1:${port}`;
  serverProcess = spawn(
    process.execPath,
    [vinextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        NODE_ENV: "production",
        ADMIN_USERNAME: "admin",
        ADMIN_PASSWORD: "admin",
        ADMIN_SESSION_SECRET: "browser-qa-session-secret-that-never-reaches-production",
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  for (const stream of [serverProcess.stdout, serverProcess.stderr]) {
    stream.on("data", (chunk) => {
      serverOutput = `${serverOutput}${chunk}`.slice(-12_000);
    });
  }
  await waitForServer(baseUrl);
  browser = await chromium.launch({
    executablePath: await browserExecutable(),
    headless: true,
    args: ["--disable-gpu"],
  });
});

after(async () => {
  await browser?.close();
  if (serverProcess && serverProcess.exitCode === null) serverProcess.kill();
});

test("public pages remain visible, non-overlapping and accessible at every breakpoint", async (t) => {
  const requestedViewport = process.env.QA_VIEWPORT;
  const requestedRoute = process.env.QA_ROUTE;
  const selectedViewports = requestedViewport
    ? viewports.filter((viewport) => viewport.label === requestedViewport)
    : viewports;
  const selectedRoutes = requestedRoute ? publicRoutes.filter((route) => route === requestedRoute) : publicRoutes;

  for (const viewport of selectedViewports) {
    for (const pathname of selectedRoutes) {
      await t.test(`${pathname} at ${viewport.width}px`, async () => {
        const context = await createContext(viewport);
        const page = await context.newPage();
        const unexpectedConsoleErrors = [];
        page.on("console", (message) => {
          if (message.type() === "error" && !/Failed to load resource/i.test(message.text())) {
            unexpectedConsoleErrors.push(message.text());
          }
        });
        page.on("pageerror", (error) => unexpectedConsoleErrors.push(error.message));
        try {
          const response = await page.goto(`${baseUrl}${pathname}`, {
            waitUntil: "domcontentloaded",
          });
          assert.equal(response?.status(), 200, `${pathname} should render`);
          await settlePage(page);

          const brokenImages = await page.locator("img").evaluateAll((images) =>
            images
              .filter((image) => {
                const source = image.currentSrc || image.getAttribute("src") || "";
                return source.startsWith(location.origin) && image.complete && image.naturalWidth === 0;
              })
              .map((image) => image.currentSrc || image.getAttribute("src") || "<sin src>"),
          );
          assert.deepEqual(brokenImages, [], `${pathname} ${viewport.label}: broken images`);

          const layout = await layoutReport(page);
          assert.equal(
            await page.locator("h1").count(),
            1,
            `${pathname} ${viewport.label}: every page needs exactly one h1`,
          );
          assert.ok(
            layout.documentWidth <= layout.viewportWidth + 1,
            `${pathname} ${viewport.label}: document is ${layout.documentWidth}px wide in a ${layout.viewportWidth}px viewport\n${JSON.stringify(layout, null, 2)}`,
          );
          assert.ok(
            layout.bodyWidth <= layout.viewportWidth + 1,
            `${pathname} ${viewport.label}: body is ${layout.bodyWidth}px wide in a ${layout.viewportWidth}px viewport\n${JSON.stringify(layout, null, 2)}`,
          );
          assert.deepEqual(layout.horizontalOffenders, [], `${pathname} ${viewport.label}: off-screen boxes`);
          assert.deepEqual(layout.clippedText, [], `${pathname} ${viewport.label}: clipped text`);
          assert.deepEqual(layout.tightText, [], `${pathname} ${viewport.label}: overly tight multiline text`);
          assert.deepEqual(layout.overlappingText, [], `${pathname} ${viewport.label}: overlapping text lines`);
          assert.deepEqual(layout.cardOverlaps, [], `${pathname} ${viewport.label}: overlapping cards`);

          if (pathname === "/") {
            assert.equal(await page.locator(".book-section").count(), 0);
            const sectionGap = await page.evaluate(() => {
              const paths = document.querySelector(".path-list");
              const nextHeading = document.querySelector(".featured-media .section-heading");
              if (!paths || !nextHeading) return Number.POSITIVE_INFINITY;
              return nextHeading.getBoundingClientRect().top - paths.getBoundingClientRect().bottom;
            });
            assert.ok(
              sectionGap <= 170,
              `${viewport.label}: removed promotion left a ${sectionGap}px gap on the homepage`,
            );
          }

          const violations = await accessibilityReport(page);
          assert.deepEqual(violations, [], `${pathname} ${viewport.label}: WCAG accessibility violations`);
          assert.deepEqual(
            unexpectedConsoleErrors,
            [],
            `${pathname} ${viewport.label}: unexpected console errors`,
          );

          if (process.env.QA_SCREENSHOTS === "1" && pathname === "/") {
            const output = path.join(projectRoot, "work", "qa");
            await mkdir(output, { recursive: true });
            await page.screenshot({
              path: path.join(output, `home-${viewport.label}-viewport.png`),
              fullPage: false,
            });
            await page.screenshot({
              path: path.join(output, `home-${viewport.label}.png`),
              fullPage: true,
            });
          }
        } finally {
          await context.close();
        }
      });
    }
  }
});

test(
  "reduced-motion removes perceptible page animation",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
    const viewport = viewports.find((candidate) => candidate.label === "mobile");
    const context = await createContext(viewport);
    const page = await context.newPage();
    try {
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      const animatedElements = await page.locator("body *").evaluateAll((elements) =>
        elements
          .map((element) => {
            const style = getComputedStyle(element);
            return {
              animationDuration: style.animationDuration,
              animationIterationCount: style.animationIterationCount,
              transitionDuration: style.transitionDuration,
              tag: element.tagName.toLowerCase(),
              className: element.className,
            };
          })
          .filter((item) => {
            const seconds = (value) =>
              Math.max(...value.split(",").map((part) => Number.parseFloat(part) || 0));
            return (
              seconds(item.animationDuration) > 0.011 ||
              item.animationIterationCount === "infinite" ||
              seconds(item.transitionDuration) > 0.011
            );
          })
          .slice(0, 12),
      );
      assert.deepEqual(animatedElements, [], "reduced-motion should suppress long motion");
    } finally {
      await context.close();
    }
  },
);

test(
  "normal motion keeps the restrained editorial animations active",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
    const viewport = viewports.find((candidate) => candidate.label === "desktop");
    const context = await createContext(viewport, "no-preference");
    const page = await context.newPage();
    try {
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      const motion = await page.evaluate(() => {
        const strip = getComputedStyle(document.querySelector(".discipline-strip > div"));
        const hero = getComputedStyle(document.querySelector(".hero-entrance"));
        return {
          bodyFont: getComputedStyle(document.body).fontFamily,
          displayFont: getComputedStyle(document.querySelector("h1")).fontFamily,
          stripName: strip.animationName,
          stripIteration: strip.animationIterationCount,
          stripDuration: strip.animationDuration,
          heroName: hero.animationName,
          heroDuration: hero.animationDuration,
        };
      });
      assert.match(motion.bodyFont, /Manrope/i);
      assert.match(motion.displayFont, /Cormorant Garamond/i);
      assert.equal(motion.stripName, "strip-move");
      assert.equal(motion.stripIteration, "infinite");
      assert.notEqual(motion.stripDuration, "0s");
      assert.equal(motion.heroName, "hero-entrance");
      assert.notEqual(motion.heroDuration, "0s");
    } finally {
      await context.close();
    }
  },
);

test(
  "header links and the brand perform real navigation",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
    const viewport = viewports.find((candidate) => candidate.label === "desktop");
    const context = await createContext(viewport);
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    try {
      const destinations = [
        ["Historia", "/#historia"],
        ["Podcasts", "/podcasts"],
        ["Conferencias", "/conferencias"],
        ["Aula", "/escuela"],
        ["Archivo", "/archivo"],
        ["Biblioteca", "/biblioteca"],
        ["Contacto", "/contacto"],
      ];

      for (const [label, pathname] of destinations) {
        await page.goto(`${baseUrl}/conferencias`, { waitUntil: "domcontentloaded" });
        await Promise.all([
          page.waitForURL(`${baseUrl}${pathname}`),
          page.locator("#site-navigation").getByRole("link", { name: label, exact: true }).click(),
        ]);
        assert.equal(page.url(), `${baseUrl}${pathname}`, `${label} should navigate to ${pathname}`);
      }

      await page.goto(`${baseUrl}/conferencias`, { waitUntil: "domcontentloaded" });
      await Promise.all([
        page.waitForURL(`${baseUrl}/`),
        page.getByRole("link", { name: "Historia de la Moda, inicio" }).click(),
      ]);
      assert.equal(page.url(), `${baseUrl}/`, "the brand should navigate to the homepage");
      assert.deepEqual(runtimeErrors, [], "navigation should not trigger client runtime errors");
    } finally {
      await context.close();
    }
  },
);

test(
  "every visible first-party link performs its declared navigation",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
    const viewport = viewports.find((candidate) => candidate.label === "desktop");
    const context = await createContext(viewport);
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    try {
      for (const pathname of publicRoutes) {
        await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
        await settlePage(page);
        const links = await page.locator("a[href]").evaluateAll((elements) =>
          elements.map((element, index) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            const rawHref = element.getAttribute("href") ?? "";
            const resolved = new URL(rawHref, location.href);
            return {
              index,
              rawHref,
              skipLink: element.classList.contains("skip-link"),
              resolvedHref: resolved.href,
              sameOrigin: resolved.origin === location.origin,
              protocol: resolved.protocol,
              visible:
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                Number(style.opacity) > 0.01 &&
                rect.width > 1 &&
                rect.height > 1,
              label:
                element.getAttribute("aria-label") ||
                (element.textContent || "").replace(/\s+/g, " ").trim() ||
                rawHref,
            };
          }),
        );

        for (const link of links) {
          if (
            link.skipLink ||
            !link.visible ||
            !link.sameOrigin ||
            !["http:", "https:"].includes(link.protocol)
          ) {
            continue;
          }

          await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
          await settlePage(page);
          const locator = page.locator("a[href]").nth(link.index);
          assert.equal(
            await locator.getAttribute("href"),
            link.rawHref,
            `${pathname}: link order changed before testing ${link.label}`,
          );
          await locator.click();
          await page.waitForTimeout(40);
          assert.equal(
            page.url(),
            link.resolvedHref,
            `${pathname}: ${link.label} should navigate to ${link.resolvedHref}`,
          );

          const targetUrl = new URL(link.resolvedHref);
          if (targetUrl.hash) {
            const targetId = decodeURIComponent(targetUrl.hash.slice(1));
            assert.equal(
              await page.locator("[id]").evaluateAll(
                (elements, expectedId) => elements.filter((element) => element.id === expectedId).length,
                targetId,
              ),
              1,
              `${pathname}: ${link.label} points to missing #${targetId}`,
            );
          }
        }
      }
      assert.deepEqual(runtimeErrors, [], "first-party links should not raise runtime errors");
    } finally {
      await context.close();
    }
  },
);

test(
  "external links, mail links and embeds keep a safe valid contract",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
    const viewport = viewports.find((candidate) => candidate.label === "desktop");
    const context = await createContext(viewport);
    const page = await context.newPage();
    try {
      for (const pathname of publicRoutes) {
        await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
        const contract = await page.evaluate(() => {
          const external = [...document.querySelectorAll('a[href^="http://"], a[href^="https://"]')]
            .filter((link) => new URL(link.href).origin !== location.origin)
            .map((link) => ({
              href: link.href,
              target: link.getAttribute("target"),
              rel: (link.getAttribute("rel") || "").split(/\s+/).filter(Boolean),
            }));
          const mail = [...document.querySelectorAll('a[href^="mailto:"]')].map((link) =>
            link.getAttribute("href"),
          );
          const frames = [...document.querySelectorAll("iframe")].map((frame) => ({
            src: frame.getAttribute("src"),
            title: frame.getAttribute("title"),
            loading: frame.getAttribute("loading"),
          }));
          return { external, mail, frames };
        });

        for (const link of contract.external) {
          assert.equal(link.target, "_blank", `${pathname}: ${link.href} should open separately`);
          assert.ok(link.rel.includes("noreferrer"), `${pathname}: ${link.href} needs noreferrer`);
        }
        for (const href of contract.mail) {
          assert.match(href ?? "", /^mailto:[^?\s]+@[^?\s]+(?:\?.*)?$/i, `${pathname}: invalid mailto`);
        }
        for (const frame of contract.frames) {
          assert.match(frame.src ?? "", /^https:\/\//, `${pathname}: iframe must use HTTPS`);
          assert.ok(frame.title?.trim(), `${pathname}: iframe needs a title`);
          assert.equal(frame.loading, "lazy", `${pathname}: public iframe should load lazily`);
        }
      }
    } finally {
      await context.close();
    }
  },
);

test(
  "skip link works from the keyboard",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
    const viewport = viewports.find((candidate) => candidate.label === "desktop");
    const context = await createContext(viewport);
    const page = await context.newPage();
    try {
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      await page.keyboard.press("Tab");
      assert.equal(
        await page.locator(".skip-link").evaluate((element) => document.activeElement === element),
        true,
      );
      await page.keyboard.press("Enter");
      await page.waitForURL(`${baseUrl}/#contenido`);
      assert.equal(page.url(), `${baseUrl}/#contenido`);
    } finally {
      await context.close();
    }
  },
);

test(
  "every podcast episode button selects its matching player",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
    const viewport = viewports.find((candidate) => candidate.label === "desktop");
    const context = await createContext(viewport);
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    try {
      await page.goto(`${baseUrl}/podcasts`, { waitUntil: "domcontentloaded" });
      const buttons = page.locator(".episode-card");
      assert.equal(await buttons.count(), 13, "the complete season should expose 13 buttons");
      const playerSources = new Set();

      for (let index = 0; index < 13; index += 1) {
        const button = buttons.nth(index);
        const expectedTitle = (await button.locator(".episode-meta > span").textContent())?.trim();
        await button.click();
        assert.equal(await button.getAttribute("aria-pressed"), "true");
        assert.equal(await page.locator('.episode-card[aria-pressed="true"]').count(), 1);
        assert.equal(
          (await page.locator(".podcast-player-copy h2").textContent())?.trim(),
          expectedTitle,
        );
        assert.equal(
          await page.locator(".podcast-player iframe").getAttribute("title"),
          `Reproductor de ${expectedTitle}`,
        );
        playerSources.add(await page.locator(".podcast-player iframe").getAttribute("src"));
      }

      assert.equal(playerSources.size, 13, "every episode should load its own iVoox player");
      const keyboardEpisode = buttons.nth(1);
      await keyboardEpisode.focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(100);
      const keyboardFocus = await page.locator(".podcast-player-copy h2").evaluate((heading) => {
        const rect = heading.getBoundingClientRect();
        return {
          active: document.activeElement === heading,
          visible: rect.bottom > 0 && rect.top < innerHeight,
        };
      });
      assert.deepEqual(keyboardFocus, { active: true, visible: true });
      assert.deepEqual(runtimeErrors, [], "episode selection should not raise runtime errors");
    } finally {
      await context.close();
    }
  },
);

test(
  "library filters and search expose their state and results",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
    const viewport = viewports.find((candidate) => candidate.label === "desktop");
    const context = await createContext(viewport);
    const page = await context.newPage();
    try {
      await page.goto(`${baseUrl}/biblioteca`, { waitUntil: "domcontentloaded" });
      assert.equal(await page.locator(".library-tools").count(), 0, "empty libraries hide inert tools");
      assert.match(await page.getByRole("status").textContent(), /No hay libros publicados/i);
    } finally {
      await context.close();
    }
  },
);

test(
  "every archive disclosure opens and closes with its links intact",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
    const viewport = viewports.find((candidate) => candidate.label === "desktop");
    const context = await createContext(viewport);
    const page = await context.newPage();
    try {
      await page.goto(`${baseUrl}/archivo`, { waitUntil: "domcontentloaded" });
      const groups = page.locator("details.archive-group");
      assert.equal(await groups.count(), 6);

      for (let index = 0; index < 6; index += 1) {
        const group = groups.nth(index);
        const summary = group.locator("summary");
        const initiallyOpen = await group.evaluate((element) => element.open);
        await summary.click();
        assert.equal(await group.evaluate((element) => element.open), !initiallyOpen);
        await summary.click();
        assert.equal(await group.evaluate((element) => element.open), initiallyOpen);
        if (!initiallyOpen) await summary.click();
        assert.ok(await group.locator(".archive-links a[href]").count(), "an open group needs links");
      }
    } finally {
      await context.close();
    }
  },
);

test(
  "television cards form two perfectly aligned equal-size rows",
  { skip: Boolean(process.env.QA_ROUTE) && process.env.QA_ROUTE !== "/archivo" },
  async () => {
    const viewport = viewports.find((candidate) => candidate.label === "desktop-wide");
    const context = await createContext(viewport);
    const page = await context.newPage();
    try {
      await page.goto(`${baseUrl}/archivo`, { waitUntil: "domcontentloaded" });
      const cards = await page.locator(".media-feature-card").evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return { left: box.left, top: box.top, width: box.width, height: box.height };
        }),
      );
      assert.equal(cards.length, 4);
      for (const card of cards.slice(1)) {
        assert.ok(Math.abs(card.width - cards[0].width) <= 1, JSON.stringify(cards));
        assert.ok(Math.abs(card.height - cards[0].height) <= 1, JSON.stringify(cards));
      }
      assert.ok(Math.abs(cards[0].left - cards[2].left) <= 1, JSON.stringify(cards));
      assert.ok(Math.abs(cards[1].left - cards[3].left) <= 1, JSON.stringify(cards));
      assert.ok(Math.abs(cards[0].top - cards[1].top) <= 1, JSON.stringify(cards));
      assert.ok(Math.abs(cards[2].top - cards[3].top) <= 1, JSON.stringify(cards));
    } finally {
      await context.close();
    }
  },
);

test(
  "mobile navigation fills the viewport and its links never collide",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
  const viewport = viewports.find((candidate) => candidate.label === "mobile");
  const context = await createContext(viewport);
  const page = await context.newPage();
  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /menú/i }).click();
    await page.waitForTimeout(320);
    const navigation = await page.locator("#site-navigation").evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const links = [...element.querySelectorAll(".site-nav-links a")].map((link) => {
        const box = link.getBoundingClientRect();
        return {
          top: box.top,
          right: box.right,
          bottom: box.bottom,
          left: box.left,
          label: (link.textContent || "")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/^0\d\s*/, ""),
        };
      });
      const overlaps = [];
      for (let index = 1; index < links.length; index += 1) {
        if (links[index].top < links[index - 1].bottom - 1) overlaps.push(index);
      }
      return {
        rect: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left },
        viewport: { width: innerWidth, height: innerHeight },
        overlaps,
        labels: links.map((link) => link.label),
        hasInstagramButton: Boolean(element.querySelector(".nav-instagram")),
        bodyLocked: document.body.classList.contains("menu-open"),
        initialFocusIsFirstLink: document.activeElement === element.querySelector(".site-nav-links a"),
        activeElement: document.activeElement?.outerHTML,
        currentPageLinks: element.querySelectorAll('[aria-current="page"]').length,
        mainIsolated:
          document.querySelector("main")?.inert === true &&
          document.querySelector("main")?.getAttribute("aria-hidden") === "true",
        footerIsolated:
          document.querySelector("footer")?.inert === true &&
          document.querySelector("footer")?.getAttribute("aria-hidden") === "true",
      };
    });
    assert.ok(navigation.rect.left >= -1);
    assert.ok(navigation.rect.right <= navigation.viewport.width + 1);
    assert.ok(navigation.rect.top >= -1);
    assert.ok(navigation.rect.bottom >= navigation.viewport.height - 1);
    assert.deepEqual(navigation.overlaps, []);
    assert.deepEqual(navigation.labels, [
      "Historia",
      "Podcasts",
      "Conferencias",
      "Aula",
      "Archivo",
      "Biblioteca",
      "Contacto",
    ]);
    assert.equal(navigation.hasInstagramButton, false);
    assert.equal(navigation.bodyLocked, true);
    assert.equal(
      navigation.initialFocusIsFirstLink,
      true,
      `the first menu link should receive initial focus; active element: ${navigation.activeElement}`,
    );
    assert.equal(navigation.currentPageLinks, 1);
    assert.equal(navigation.mainIsolated, true);
    assert.equal(navigation.footerIsolated, true);

    const firstHeaderLink = page.locator(".brand");
    const lastNavigationLink = page.locator(".site-nav-links a").last();
    await lastNavigationLink.focus();
    await page.keyboard.press("Tab");
    assert.equal(await firstHeaderLink.evaluate((element) => document.activeElement === element), true);
    await page.keyboard.press("Shift+Tab");
    assert.equal(
      await lastNavigationLink.evaluate((element) => document.activeElement === element),
      true,
    );
    if (process.env.QA_SCREENSHOTS === "1") {
      const output = path.join(projectRoot, "work", "qa");
      await mkdir(output, { recursive: true });
      await page.screenshot({ path: path.join(output, "mobile-menu-open.png") });
    }
    await page.keyboard.press("Escape");
    await assert.doesNotReject(page.locator("#site-navigation:not(.is-open)").waitFor());
    assert.equal(
      await page.getByRole("button", { name: /abrir menú/i }).evaluate((element) =>
        document.activeElement === element,
      ),
      true,
    );
    const restoredPage = await page.evaluate(() => ({
      bodyLocked: document.body.classList.contains("menu-open"),
      mainInert: document.querySelector("main")?.inert,
      mainAriaHidden: document.querySelector("main")?.getAttribute("aria-hidden"),
      footerInert: document.querySelector("footer")?.inert,
      footerAriaHidden: document.querySelector("footer")?.getAttribute("aria-hidden"),
    }));
    assert.deepEqual(restoredPage, {
      bodyLocked: false,
      mainInert: false,
      mainAriaHidden: null,
      footerInert: false,
      footerAriaHidden: null,
    });

    await page.getByRole("button", { name: /abrir menú/i }).click();
    await Promise.all([
      page.waitForURL(`${baseUrl}/contacto`),
      page.locator('#site-navigation a[href="/contacto"]').click(),
    ]);
    assert.equal(page.url(), `${baseUrl}/contacto`);
    assert.equal(await page.locator("body.menu-open").count(), 0);
  } finally {
    await context.close();
  }
  },
);

test(
  "mobile menu restores the page when the viewport becomes desktop",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
    const context = await createContext({ width: 390, height: 844 });
    const page = await context.newPage();
    try {
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: /abrir menú/i }).click();
      assert.equal(await page.locator("body.menu-open").count(), 1);
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(100);
      const restored = await page.evaluate(() => ({
        bodyLocked: document.body.classList.contains("menu-open"),
        menuOpen: document.querySelector("#site-navigation")?.classList.contains("is-open"),
        mainInert: document.querySelector("main")?.inert,
        mainAriaHidden: document.querySelector("main")?.getAttribute("aria-hidden"),
        footerInert: document.querySelector("footer")?.inert,
        footerAriaHidden: document.querySelector("footer")?.getAttribute("aria-hidden"),
      }));
      assert.deepEqual(restored, {
        bodyLocked: false,
        menuOpen: false,
        mainInert: false,
        mainAriaHidden: null,
        footerInert: false,
        footerAriaHidden: null,
      });
    } finally {
      await context.close();
    }
  },
);

test(
  "primary touch controls provide a robust 44px target",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
    const viewport = viewports.find((candidate) => candidate.label === "mobile-small");
    const context = await createContext(viewport);
    const page = await context.newPage();
    try {
      const checks = [
        ["/", ".menu-toggle, .footer-links a"],
        ["/biblioteca", ".menu-toggle, .library-filters button, .footer-links a"],
        ["/admin/login", "[class*='loginFoot'] a"],
      ];
      for (const [pathname, selector] of checks) {
        await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
        const undersized = await page.locator(selector).evaluateAll((elements) =>
          elements
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.width < 43.5 || rect.height < 43.5;
            })
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return {
                label: (element.textContent || element.getAttribute("aria-label") || "")
                  .replace(/\s+/g, " ")
                  .trim(),
                width: Math.round(rect.width * 10) / 10,
                height: Math.round(rect.height * 10) / 10,
              };
            }),
        );
        assert.deepEqual(undersized, [], `${pathname}: undersized touch controls`);
      }
    } finally {
      await context.close();
    }
  },
);

test(
  "admin redirects to login and the temporary admin/admin session works",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
  const viewport = viewports.find((candidate) => candidate.label === "mobile");
  const context = await createContext(viewport);
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded" });
    assert.match(page.url(), /\/admin\/login$/);
    await page.getByLabel("Usuario").fill("admin");
    await page.getByLabel("Contraseña").fill("admin");
    await Promise.all([
      page.waitForURL(/\/admin$/),
      page.getByRole("button", { name: "Entrar" }).click(),
    ]);
    await page.getByRole("heading", { name: /Biblioteca y aula/i }).waitFor();
    const layout = await layoutReport(page);
    assert.ok(layout.documentWidth <= layout.viewportWidth + 1);
    assert.deepEqual(layout.horizontalOffenders, []);
    assert.deepEqual(await accessibilityReport(page), []);

    await Promise.all([
      page.waitForURL(/\/admin\/login$/),
      page.getByRole("button", { name: /cerrar sesión/i }).click(),
    ]);
  } finally {
    await context.close();
  }
  },
);

test(
  "admin login throttles repeated attempts without blocking another username",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
    const viewport = viewports.find((candidate) => candidate.label === "desktop");
    const context = await createContext(viewport);
    try {
      const uniqueUsername = `qa-${Date.now()}`;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const response = await context.request.post(`${baseUrl}/api/admin/session`, {
          data: { username: uniqueUsername, password: "incorrecta" },
          headers: { origin: baseUrl },
        });
        assert.equal(response.status(), 401);
      }

      const limited = await context.request.post(`${baseUrl}/api/admin/session`, {
        data: { username: uniqueUsername, password: "incorrecta" },
        headers: { origin: baseUrl },
      });
      assert.equal(limited.status(), 429);
      assert.equal(limited.headers()["retry-after"], "60");

      const valid = await context.request.post(`${baseUrl}/api/admin/session`, {
        data: { username: "admin", password: "admin" },
        headers: { origin: baseUrl },
      });
      assert.equal(valid.status(), 200, "a different username should retain its own allowance");
    } finally {
      await context.close();
    }
  },
);

test(
  "admin controls expose a safe read-only state or complete their lifecycle",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
    const viewport = viewports.find((candidate) => candidate.label === "desktop");
    const context = await createContext(viewport);
    const page = await context.newPage();
    const suffix = `${Date.now()}`;
    const bookTitle = `Libro QA ${suffix}`;
    const courseTitle = `Curso QA ${suffix}`;

    const cleanup = async () => {
      try {
        await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded" });
        await page.evaluate(async (titles) => {
          const response = await fetch("/api/admin/content", { cache: "no-store" });
          if (!response.ok) return;
          const content = await response.json();
          for (const [kind, items] of [
            ["book", content.books],
            ["course", content.courses],
          ]) {
            for (const item of items.filter((entry) => titles.includes(entry.title))) {
              await fetch(`/api/admin/content?kind=${kind}&id=${item.id}`, { method: "DELETE" });
            }
          }
        }, [bookTitle, courseTitle]);
      } catch {
        // The assertions retain the original failure if cleanup cannot complete.
      }
    };

    try {
      await page.goto(`${baseUrl}/admin/login`, { waitUntil: "domcontentloaded" });
      await page.getByLabel("Usuario").fill("admin");
      await page.getByLabel("Contraseña").fill("admin");
      await Promise.all([
        page.waitForURL(`${baseUrl}/admin`),
        page.getByRole("button", { name: "Entrar" }).click(),
      ]);

      const fillCommonFields = async (title, description) => {
        await page.getByLabel(/Título/).fill(title);
        await page.getByLabel(/Descripción/).fill(description);
        await page.getByLabel(/Precio/).fill("0");
        await page.getByLabel("Orden").fill("9999");
      };

      const newBookButton = page.getByRole("button", { name: /Nuevo libro/ });
      if (await newBookButton.isDisabled()) {
        assert.match(await page.getByRole("alert").textContent(), /Persistencia pendiente/i);
        await page.getByRole("button", { name: "Reintentar" }).click();
        await page
          .locator('[role="alert"], [role="status"]')
          .filter({ hasText: /D1|Contenido actualizado/i })
          .first()
          .waitFor();
        return;
      }
      await newBookButton.click();
      await fillCommonFields(bookTitle, "Descripción inicial para probar la ficha de biblioteca.");
      await page.getByRole("button", { name: "Crear libro" }).click();
      await page.getByRole("status").filter({ hasText: "Contenido creado" }).waitFor();

      let bookCard = page.locator("article").filter({ hasText: bookTitle });
      await bookCard.getByRole("button", { name: `Editar ${bookTitle}` }).click();
      assert.equal(
        await page.getByLabel(/Título/).evaluate((element) => document.activeElement === element),
        true,
      );
      await page
        .getByLabel(/Descripción/)
        .fill("Descripción editada y verificada mediante el botón Guardar cambios.");

      let releaseSaveResponse;
      let markSaveHeld;
      const saveResponseHeld = new Promise((resolve) => {
        markSaveHeld = resolve;
      });
      const releaseSave = new Promise((resolve) => {
        releaseSaveResponse = resolve;
      });
      let holdNextPatch = true;
      await page.route(`${baseUrl}/api/admin/content`, async (route) => {
        if (holdNextPatch && route.request().method() === "PATCH") {
          holdNextPatch = false;
          const response = await route.fetch();
          markSaveHeld();
          await releaseSave;
          await route.fulfill({ response });
          return;
        }
        await route.continue();
      });
      await page.getByRole("button", { name: "Guardar cambios" }).click();
      await saveResponseHeld;
      assert.equal(await page.getByRole("button", { name: /Cursos/ }).isDisabled(), true);
      assert.equal(await page.getByRole("button", { name: "Cancelar" }).isDisabled(), true);
      assert.equal(
        await page.getByRole("button", { name: `Editar ${bookTitle}` }).isDisabled(),
        true,
      );
      releaseSaveResponse();
      await page.getByRole("status").filter({ hasText: "Cambios guardados" }).waitFor();
      await page.getByRole("button", { name: "Cancelar" }).click();
      assert.equal(await page.getByRole("button", { name: "Cancelar" }).count(), 0);
      assert.equal(await page.getByLabel(/Título/).inputValue(), "");
      bookCard = page.locator("article").filter({ hasText: bookTitle });
      await bookCard.getByRole("button", { name: `Publicar ${bookTitle}` }).click();
      await page.getByRole("status").filter({ hasText: "Contenido publicado" }).waitFor();

      await page.goto(`${baseUrl}/biblioteca`, { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: bookTitle }).waitFor();
      assert.equal(await page.getByRole("group", { name: "Filtrar por categoría" }).count(), 1);
      assert.equal(
        await page.getByRole("button", { name: "Todos" }).getAttribute("aria-pressed"),
        "true",
      );
      await page.getByRole("searchbox").fill("sin coincidencias qa");
      assert.match(await page.getByRole("status").textContent(), /No hay coincidencias/i);
      await page.getByRole("searchbox").fill("Libro QA");
      await page.getByRole("heading", { name: bookTitle }).waitFor();

      await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: /Cursos/ }).click();
      assert.equal(await page.getByRole("button", { name: /Cursos/ }).getAttribute("aria-pressed"), "true");
      await page.getByRole("button", { name: /Nuevo curso/ }).click();
      await fillCommonFields(courseTitle, "Curso temporal para verificar el aula y su iframe.");
      await page.getByLabel("URL de lanzamiento SCORM").fill("http://example.com/course");
      await page.getByLabel("Estado").selectOption("published");
      await page.getByRole("button", { name: "Crear curso" }).click();
      await page.getByRole("alert").filter({ hasText: /debe usar HTTPS/i }).waitFor();

      await page.getByLabel("URL de lanzamiento SCORM").fill("/og.png");
      await page.getByRole("button", { name: "Crear curso" }).click();
      await page.getByRole("status").filter({ hasText: "Contenido creado" }).waitFor();

      await page.goto(`${baseUrl}/escuela`, { waitUntil: "domcontentloaded" });
      const courseLink = page.getByRole("link", { name: `Entrar al aula: ${courseTitle}` });
      await courseLink.waitFor();
      await courseLink.click();
      await page.getByRole("heading", { name: courseTitle }).waitFor();
      assert.equal(await page.locator(`iframe[title="Curso ${courseTitle}"]`).count(), 1);
      assert.equal(
        await page.getByRole("link", { name: "Abrir el curso en una pestaña nueva" }).getAttribute("href"),
        "/og.png",
      );

      await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: /Actualizar/ }).click();
      await page.getByRole("status").filter({ hasText: "Contenido actualizado" }).waitFor();

      await page.getByRole("button", { name: /Biblioteca/ }).click();
      bookCard = page.locator("article").filter({ hasText: bookTitle });
      page.once("dialog", (dialog) => dialog.accept());
      await bookCard.getByRole("button", { name: `Eliminar ${bookTitle}` }).click();
      await page.getByRole("status").filter({ hasText: "Contenido eliminado" }).waitFor();
      assert.equal(await page.locator("article").filter({ hasText: bookTitle }).count(), 0);

      await page.getByRole("button", { name: /Cursos/ }).click();
      const courseCard = page.locator("article").filter({ hasText: courseTitle });
      page.once("dialog", (dialog) => dialog.accept());
      await courseCard.getByRole("button", { name: `Eliminar ${courseTitle}` }).click();
      await page.getByRole("status").filter({ hasText: "Contenido eliminado" }).waitFor();
      assert.equal(await page.locator("article").filter({ hasText: courseTitle }).count(), 0);
    } finally {
      await cleanup();
      await context.close();
    }
  },
);

test(
  "contact form is keyboard-labelled and enforces native validation",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
    const viewport = viewports.find((candidate) => candidate.label === "mobile-small");
    const context = await createContext(viewport);
    const page = await context.newPage();
    try {
      await page.goto(`${baseUrl}/contacto`, { waitUntil: "domcontentloaded" });
      await page.getByLabel("Nombre y apellidos").fill("Ana Pérez");
      await page.getByLabel("Correo electrónico").fill("correo-inválido");
      await page.getByLabel("Mensaje").fill("Mensaje suficientemente largo para validar el campo.");
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "Enviar mensaje" }).click();
      assert.equal(
        await page.getByLabel("Correo electrónico").evaluate((element) => element.matches(":invalid")),
        true,
      );
      assert.equal(page.url(), `${baseUrl}/contacto`);
      assert.equal(await page.locator(".contact-honeypot").isVisible(), false);
    } finally {
      await context.close();
    }
  },
);

test(
  "contact submit button handles sending, success and server errors",
  { skip: Boolean(process.env.QA_ROUTE) },
  async () => {
    const viewport = viewports.find((candidate) => candidate.label === "mobile-small");
    const context = await createContext(viewport);
    const page = await context.newPage();
    const submittedPayloads = [];
    try {
      await page.route(`${baseUrl}/api/contacto`, async (route) => {
        const payload = route.request().postDataJSON();
        submittedPayloads.push(payload);
        if (payload.name.startsWith("Error de prueba")) {
          await route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ error: "Servicio de correo no disponible." }),
          });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 120));
        await route.fulfill({
          status: 202,
          contentType: "application/json",
          body: JSON.stringify({ accepted: true }),
        });
      });

      const fillValidForm = async (name) => {
        await page.getByLabel("Nombre y apellidos").fill(name);
        await page.getByLabel("Correo electrónico").fill("ana@example.com");
        await page.getByLabel(/Entidad u organización/).fill("Museo de prueba");
        await page.getByLabel("Motivo").selectOption({ label: "Colaboraciones" });
        await page
          .getByLabel("Mensaje")
          .fill("Este es un mensaje completo para comprobar el envío del formulario.");
        await page.getByRole("checkbox").check();
      };

      await page.goto(`${baseUrl}/contacto`, { waitUntil: "domcontentloaded" });
      await fillValidForm("Ana Pérez");
      await page.getByRole("button", { name: "Enviar mensaje" }).click();
      const sendingButton = page.getByRole("button", { name: /Enviando/ });
      await sendingButton.waitFor();
      assert.equal(await sendingButton.isDisabled(), true);
      assert.equal(await page.getByLabel("Nombre y apellidos").isDisabled(), true);
      assert.equal(await page.locator("form.contact-form").getAttribute("aria-busy"), "true");
      await page.getByRole("status").waitFor();
      assert.match(await page.getByRole("status").textContent(), /Mensaje enviado/i);
      assert.equal(await page.getByLabel("Nombre y apellidos").inputValue(), "");
      assert.equal(await page.getByRole("checkbox").isChecked(), false);

      await page.getByLabel("Nombre y apellidos").fill("Nueva consulta");
      assert.equal(await page.getByRole("status").count(), 0, "success feedback clears for a new draft");
      await fillValidForm("Error de prueba");
      await page.getByRole("button", { name: "Enviar mensaje" }).click();
      await page.getByRole("alert").waitFor();
      assert.equal(
        (await page.getByRole("alert").textContent())?.trim(),
        "Servicio de correo no disponible.",
      );
      const firstErrorId = submittedPayloads[1].submissionId;
      await Promise.all([
        page.waitForResponse(`${baseUrl}/api/contacto`),
        page.getByRole("button", { name: "Enviar mensaje" }).click(),
      ]);
      assert.equal(submittedPayloads[2].submissionId, firstErrorId, "a retry reuses its delivery key");

      await page.getByLabel("Nombre y apellidos").fill("Error de prueba actualizado");
      await Promise.all([
        page.waitForResponse(`${baseUrl}/api/contacto`),
        page.getByRole("button", { name: "Enviar mensaje" }).click(),
      ]);
      assert.notEqual(
        submittedPayloads[3].submissionId,
        firstErrorId,
        "editing a failed message starts a new delivery",
      );
      assert.equal(submittedPayloads.length, 4);
      assert.match(submittedPayloads[0].submissionId, /^[0-9a-f-]{36}$/i);
      const { submissionId: firstSubmissionId, ...firstPayload } = submittedPayloads[0];
      assert.deepEqual(firstPayload, {
        name: "Ana Pérez",
        email: "ana@example.com",
        organization: "Museo de prueba",
        topic: "Colaboraciones",
        message: "Este es un mensaje completo para comprobar el envío del formulario.",
        website: "",
        consent: true,
      });
      assert.notEqual(firstErrorId, firstSubmissionId);
    } finally {
      await context.close();
    }
  },
);
