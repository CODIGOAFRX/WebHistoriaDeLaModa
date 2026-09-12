import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { chromium, webkit } from "playwright-core";
import { webkit as legacyWebkit } from "playwright-webkit-legacy";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("library cards and full reviews remain usable in WebKit and Chromium", async (t) => {
  // Real library components and global CSS, isolated from D1 and production data.
  const server = await createServer({ configFile: false, root, plugins: [react()], server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  const url = `${server.resolvedUrls.local[0]}tests/fixtures/library.html`;
  const output = path.join(root, "outputs", "library-safari");
  await mkdir(output, { recursive: true });
  try {
    for (const [name, engine, options] of [
      ["webkit-18", legacyWebkit, {}],
      ["webkit-current", webkit, {}],
      ["chromium", chromium, process.platform === "win32" ? { channel: "msedge" } : {}],
    ]) {
      const browser = await engine.launch({ headless: true, ...options });
      try {
        for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
          await t.test(`${name} ${viewport.width}px`, async () => {
            const page = await browser.newPage({ viewport });
            const errors = [];
            page.on("pageerror", error => errors.push(error.message));
            try {
              await page.goto(url);
              await page.getByRole("button", { name: "Ver la ficha de Historia del vestido" }).waitFor();
              // Exercise the actual filter/search event handlers before opening.
              await page.getByRole("button", { name: "Textiles", exact: true }).click();
              assert.equal(await page.locator(".book-card-public").count(), 1);
              await page.getByRole("button", { name: "Todos", exact: true }).click();
              await page.getByRole("searchbox").fill("vestido");
              assert.equal(await page.locator(".book-card-public").count(), 1);
              await page.getByRole("searchbox").fill("");
              for (const title of ["Historia del vestido", "Textiles y cultura"]) {
                const trigger = page.getByRole("button", { name: `Ver la ficha de ${title}` });
                await trigger.click();
                const dialog = page.locator(".book-dialog[open]");
                await dialog.waitFor();
                await page.waitForTimeout(500);
                const geometry = await dialog.evaluate(el => {
                  const scroller = el.querySelector(".book-dialog-scroll");
                  const rect = el.getBoundingClientRect();
                  return { height: rect.height, top: rect.top, bottom: rect.bottom, viewportHeight: innerHeight, scrollHeight: scroller.clientHeight, overflow: scroller.scrollWidth - scroller.clientWidth };
                });
                assert.ok(geometry.height > 200, `dialog collapsed: ${JSON.stringify(geometry)}`);
                assert.ok(geometry.scrollHeight > 100, "review has a visible scroll area");
                assert.ok(geometry.top >= -1 && geometry.bottom <= geometry.viewportHeight + 1, "dialog fits viewport");
                assert.ok(geometry.overflow <= 1, "no horizontal scrolling");
                const scroller = dialog.locator(".book-dialog-scroll");
                await scroller.evaluate(el => { el.scrollTop = el.scrollHeight; });
                const lastParagraph = dialog.locator(".book-dialog-text p").last();
                assert.ok(await lastParagraph.evaluate(el => {
                  const rect = el.getBoundingClientRect();
                  const parent = el.closest(".book-dialog-scroll").getBoundingClientRect();
                  return rect.bottom <= parent.bottom + 1 && rect.bottom > parent.top;
                }), "last paragraph is reachable");
                await scroller.evaluate(el => { el.scrollTop = 0; });
                await page.screenshot({ path: path.join(output, `${name}-${viewport.width}-${title === "Historia del vestido" ? "short" : "long"}.png`) });
                await dialog.getByRole("button", { name: "Cerrar" }).click();
                await page.locator(".book-dialog").waitFor({ state: "detached" });
                assert.equal(await page.evaluate(() => document.body.classList.contains("book-dialog-open")), false);
                await trigger.click();
                await page.locator(".book-dialog[open]").waitFor();
                await page.keyboard.press("Escape");
                await page.locator(".book-dialog").waitFor({ state: "detached" });
              }
              assert.deepEqual(errors, []);
            } finally { await page.close(); }
          });
        }
      } finally { await browser.close(); }
    }
  } finally { await server.close(); }
});
