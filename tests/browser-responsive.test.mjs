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
  { label: "desktop", width: 1440, height: 900 },
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

async function createContext(viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    locale: "es-ES",
    reducedMotion: "reduce",
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
      .filter((violation) => ["critical", "serious"].includes(violation.impact))
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
      env: { ...process.env, NODE_ENV: "production" },
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
        try {
          const response = await page.goto(`${baseUrl}${pathname}`, {
            waitUntil: "domcontentloaded",
          });
          assert.equal(response?.status(), 200, `${pathname} should render`);
          await settlePage(page);

          const layout = await layoutReport(page);
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

          const violations = await accessibilityReport(page);
          assert.deepEqual(violations, [], `${pathname} ${viewport.label}: serious accessibility violations`);

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
        return { top: box.top, right: box.right, bottom: box.bottom, left: box.left };
      });
      const overlaps = [];
      for (let index = 1; index < links.length; index += 1) {
        if (links[index].top < links[index - 1].bottom - 1) overlaps.push(index);
      }
      return {
        rect: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left },
        viewport: { width: innerWidth, height: innerHeight },
        overlaps,
        bodyLocked: document.body.classList.contains("menu-open"),
      };
    });
    assert.ok(navigation.rect.left >= -1);
    assert.ok(navigation.rect.right <= navigation.viewport.width + 1);
    assert.ok(navigation.rect.top >= -1);
    assert.ok(navigation.rect.bottom >= navigation.viewport.height - 1);
    assert.deepEqual(navigation.overlaps, []);
    assert.equal(navigation.bodyLocked, true);
    if (process.env.QA_SCREENSHOTS === "1") {
      const output = path.join(projectRoot, "work", "qa");
      await mkdir(output, { recursive: true });
      await page.screenshot({ path: path.join(output, "mobile-menu-open.png") });
    }
    await page.getByRole("button", { name: /cerrar/i }).click();
    await assert.doesNotReject(page.locator("#site-navigation:not(.is-open)").waitFor());
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
      page.getByRole("link", { name: /cerrar sesión/i }).click(),
    ]);
  } finally {
    await context.close();
  }
  },
);
