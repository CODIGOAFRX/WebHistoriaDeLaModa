import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, readFile, unlink } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { chromium } from "playwright-core";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vinextCli = path.join(projectRoot, "node_modules", "vinext", "dist", "cli.js");
const browserCandidates = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];
const devLockPath = path.join(projectRoot, ".vinext", "dev", "lock.json");

async function removeStaleDevLock() {
  try {
    const lock = JSON.parse(await readFile(devLockPath, "utf8"));
    try {
      process.kill(lock.pid, 0);
      throw new Error(`A vinext dev server is already running at ${lock.appUrl}.`);
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
      await unlink(devLockPath);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

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
  for (const candidate of browserCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next installed Chromium browser.
    }
  }
  throw new Error("Microsoft Edge or Google Chrome is required for admin QA.");
}

async function waitForServer(url, process, output) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (process.exitCode !== null) throw new Error(`vinext dev stopped early.\n${output()}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Development server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`vinext dev did not become ready.\n${output()}`);
}

test("D1-backed admin buttons create, edit, publish and delete books and courses", async () => {
  await removeStaleDevLock();
  const port = await availablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  let serverOutput = "";
  const serverProcess = spawn(
    process.execPath,
    [vinextCli, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        NODE_ENV: "development",
        ADMIN_USERNAME: "admin",
        ADMIN_PASSWORD: "admin",
        ADMIN_SESSION_SECRET: "admin-crud-qa-session-secret-that-never-reaches-production",
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  for (const stream of [serverProcess.stdout, serverProcess.stderr]) {
    stream.on("data", (chunk) => {
      serverOutput = `${serverOutput}${chunk}`.slice(-16_000);
    });
  }

  let browser;
  let context;
  let page;
  const suffix = `${Date.now()}`;
  const bookTitle = `Libro QA ${suffix}`;
  const courseTitle = `Curso QA ${suffix}`;

  const cleanupContent = async () => {
    if (!page || page.isClosed()) return;
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
      // Keep the original assertion failure if cleanup itself cannot finish.
    }
  };

  const feedbackText = async () =>
    (await page.locator('[role="status"], [role="alert"]').allTextContents()).join(" | ");

  const selectAdminTab = async (name) => {
    const tab = page.getByRole("button", { name });
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await tab.click();
      if ((await tab.getAttribute("aria-pressed")) === "true") return tab;
      await page.waitForTimeout(100);
    }
    assert.fail(`admin tab ${String(name)} did not hydrate`);
  };

  try {
    await waitForServer(baseUrl, serverProcess, () => serverOutput);
    browser = await chromium.launch({
      executablePath: await browserExecutable(),
      headless: true,
      args: ["--disable-gpu"],
    });
    context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "es-ES",
      reducedMotion: "reduce",
    });
    page = await context.newPage();
    const runtimeErrors = [];
    const requests = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("request", (request) => {
      if (request.url().includes("/api/admin/")) requests.push(`${request.method()} ${request.url()}`);
    });

    await page.goto(`${baseUrl}/admin/login`, { waitUntil: "domcontentloaded" });
    await page.getByLabel("Usuario").fill("admin");
    await page.getByLabel("Contraseña").fill("admin");
    await Promise.all([
      page.waitForURL(`${baseUrl}/admin`),
      page.getByRole("button", { name: "Entrar" }).click(),
    ]);
    await page.getByRole("heading", { name: /Biblioteca y aula/i }).waitFor();
    assert.equal(await page.getByRole("button", { name: /Nuevo libro/ }).isEnabled(), true);

    // The heading is server-rendered. Exercise a harmless tab switch until the
    // client has hydrated before testing mutations, otherwise an early click can
    // legitimately land before React has attached its handlers.
    const coursesTab = await selectAdminTab(/Cursos/);
    assert.equal(await coursesTab.getAttribute("aria-pressed"), "true", "admin did not hydrate");
    const booksTab = await selectAdminTab(/Biblioteca/);
    assert.equal(await booksTab.getAttribute("aria-pressed"), "true");

    const fillCommonFields = async (title, description) => {
      const editor = page.locator("#admin-editor");
      const titleInput = editor.locator('input[name="title"]');
      await titleInput.fill("");
      await titleInput.pressSequentially(title);
      assert.equal(await editor.locator('input[name="title"]').inputValue(), title, "title after fill");
      const descriptionInput = editor.locator('textarea[name="description"]');
      await descriptionInput.fill("");
      await descriptionInput.pressSequentially(description);
      assert.equal(await editor.locator('input[name="title"]').inputValue(), title, "title after description");
      await editor.locator('input[name="price"]').fill("0");
      assert.equal(await editor.locator('input[name="title"]').inputValue(), title, "title after price");
      await editor.locator('input[name="sortOrder"]').fill("9999");
      assert.equal(await editor.locator('input[name="title"]').inputValue(), title);
    };

    await page.getByRole("button", { name: /Nuevo libro/ }).click();
    await page.waitForTimeout(500);
    assert.equal(
      await page.locator("#admin-content-title").evaluate((element) => document.activeElement === element),
      true,
      `new book did not focus editor; errors: ${runtimeErrors.join(" | ")}`,
    );
    await fillCommonFields(bookTitle, "Descripción inicial para probar la ficha de biblioteca.");
    const coverPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    );
    await page.locator('#admin-editor input[name="coverFile"]').setInputFiles({
      name: "portada-qa.png",
      mimeType: "image/png",
      buffer: coverPng,
    });
    await page.getByRole("img", { name: "Vista previa de la portada" }).waitFor();
    const createBookButton = page.getByRole("button", { name: "Crear libro" });
    const formState = await page.locator("form").filter({ has: createBookButton }).evaluate((form) => ({
      valid: form.checkValidity(),
      values: Object.fromEntries(new FormData(form).entries()),
      invalid: [...form.elements]
        .filter((element) => "checkValidity" in element && !element.checkValidity())
        .map((element) => ({ name: element.name, value: element.value })),
    }));
    assert.equal(formState.valid, true, `invalid form: ${JSON.stringify(formState)}`);
    await createBookButton.click();
    await page.waitForTimeout(800);
    assert.match(
      await feedbackText(),
      /Contenido creado/,
      `book create feedback: ${await feedbackText()}; requests: ${requests.join(", ")}; errors: ${runtimeErrors.join(" | ")}; url: ${page.url()}`,
    );
    assert.equal(
      requests.some((request) => request.includes("POST") && request.includes("/api/admin/media")),
      true,
      `the book cover was not uploaded: ${requests.join(", ")}`,
    );

    let bookCard = page.locator("article").filter({ hasText: bookTitle });
    assert.match(
      (await bookCard.getByRole("img", { name: `Imagen de ${bookTitle}` }).getAttribute("style")) || "",
      /\/media\/book-covers\//,
    );
    await bookCard.getByRole("button", { name: `Editar ${bookTitle}` }).click();
    await page.waitForFunction(
      () => document.activeElement?.id === "admin-content-title",
    );
    assert.equal(
      await page
        .locator('#admin-editor input[name="title"]')
        .evaluate((element) => document.activeElement === element),
      true,
    );
    await page
      .locator('#admin-editor textarea[name="description"]')
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
    assert.equal(await page.locator('#admin-editor input[name="title"]').inputValue(), "");

    bookCard = page.locator("article").filter({ hasText: bookTitle });
    await bookCard.getByRole("button", { name: `Publicar ${bookTitle}` }).click();
    await page.getByRole("status").filter({ hasText: "Contenido publicado" }).waitFor();

    await page.goto(`${baseUrl}/biblioteca`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: bookTitle }).waitFor();
    const publicCover = page.getByRole("img", { name: `Cubierta de ${bookTitle}` });
    assert.match((await publicCover.getAttribute("src")) || "", /^\/media\/book-covers\//);
    await publicCover.evaluate(async (image) => {
      if (!image.complete) {
        await new Promise((resolve, reject) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", reject, { once: true });
        });
      }
      if (image.naturalWidth < 1) throw new Error("the uploaded cover did not render");
    });
    assert.equal(await page.getByRole("group", { name: "Filtrar por categoría" }).count(), 1);
    assert.equal(
      await page.getByRole("button", { name: "Todos" }).getAttribute("aria-pressed"),
      "true",
    );
    const librarySearch = page.getByRole("searchbox");
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await librarySearch.fill("");
      await librarySearch.pressSequentially("sin coincidencias qa");
      await page.waitForTimeout(100);
      if ((await page.locator(".book-card-public").count()) === 0) break;
    }
    const searchDebug = {
      value: await librarySearch.inputValue(),
      cards: await page.locator(".book-card-public").count(),
      statuses: await page.locator('[role="status"]').allTextContents(),
    };
    assert.equal(searchDebug.value, "sin coincidencias qa", JSON.stringify(searchDebug));
    assert.equal(searchDebug.cards, 0, JSON.stringify(searchDebug));
    await page.getByRole("status").waitFor({ timeout: 2_000 });
    assert.match(await page.getByRole("status").textContent(), /No hay coincidencias/i);
    await librarySearch.fill("");
    await librarySearch.pressSequentially("Libro QA");
    await page.getByRole("heading", { name: bookTitle }).waitFor();

    const publicCard = page.locator(".book-card-public").filter({ hasText: bookTitle });
    assert.equal(
      await publicCard
        .locator(".book-card-blurb")
        .evaluate((element) => getComputedStyle(element).webkitLineClamp),
      "3",
      "la reseña se recorta en la tarjeta para nivelar la rejilla",
    );

    // Toda la tarjeta abre la ficha: el clic central cae sobre el disparador.
    // Tras una recarga el clic puede adelantarse a la hidratación, así que se
    // reintenta igual que en la búsqueda de más arriba.
    const bookDialog = page.locator("dialog.book-dialog");
    const openBookDialog = async (card) => {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await card.click();
        if (await bookDialog.count()) break;
        await page.waitForTimeout(250);
      }
      await bookDialog.waitFor();
      // La animación de entrada aplica un `transform`, que falsearía cualquier
      // medida tomada antes de que termine.
      await bookDialog.evaluate((element) =>
        Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => {}))),
      );
    };

    await openBookDialog(publicCard);
    assert.deepEqual(
      await bookDialog.evaluate((element) => ({
        open: element.open,
        modal: element.matches(":modal"),
        scrollLocked: document.body.classList.contains("book-dialog-open"),
      })),
      { open: true, modal: true, scrollLocked: true },
    );
    assert.equal(await bookDialog.locator("#book-dialog-title").textContent(), bookTitle);
    assert.match(
      await bookDialog.locator(".book-dialog-text").textContent(),
      /Descripción editada y verificada/,
      "la ficha muestra la reseña completa",
    );

    await bookDialog.getByRole("button", { name: "Cerrar" }).click();
    await bookDialog.waitFor({ state: "detached" });
    assert.equal(
      await page.evaluate(() => document.body.classList.contains("book-dialog-open")),
      false,
      "al cerrar la ficha se devuelve el scroll a la página",
    );

    await openBookDialog(publicCard);
    await page.keyboard.press("Escape");
    await bookDialog.waitFor({ state: "detached" });

    // El fallo original: en móvil la reseña de la tarjeta quedaba oculta.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: "domcontentloaded" });
    const mobileCard = page.locator(".book-card-public").filter({ hasText: bookTitle });
    await mobileCard.waitFor();
    assert.equal(
      await mobileCard.locator(".book-card-blurb").isVisible(),
      true,
      "la reseña sigue visible en móvil",
    );
    await openBookDialog(mobileCard);
    assert.deepEqual(
      await bookDialog.evaluate((element) => {
        const scroller = element.querySelector(".book-dialog-scroll");
        return {
          fillsWidth: element.offsetWidth === window.innerWidth,
          fillsHeight: element.offsetHeight === window.innerHeight,
          noHorizontalOverflow: scroller.scrollWidth <= scroller.clientWidth + 1,
        };
      }),
      { fillsWidth: true, fillsHeight: true, noHorizontalOverflow: true },
      "en móvil la ficha ocupa toda la pantalla",
    );
    await page.keyboard.press("Escape");
    await bookDialog.waitFor({ state: "detached" });
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded" });
    await selectAdminTab(/Cursos/);
    await page.getByRole("button", { name: /Nuevo curso/ }).click();
    await page.waitForTimeout(500);
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
    await courseLink.click();
    await page.getByRole("heading", { name: courseTitle }).waitFor();
    assert.equal(await page.locator(`iframe[title="Curso ${courseTitle}"]`).count(), 1);
    assert.equal(
      await page.getByRole("link", { name: "Abrir el curso en una pestaña nueva" }).getAttribute("href"),
      "/og.png",
    );

    await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded" });
    await selectAdminTab(/Cursos/);
    await selectAdminTab(/Biblioteca/);
    await page.getByRole("button", { name: /Actualizar/ }).click();
    await page.getByRole("status").filter({ hasText: "Contenido actualizado" }).waitFor();

    await selectAdminTab(/Biblioteca/);
    bookCard = page.locator("article").filter({ hasText: bookTitle });
    page.once("dialog", (dialog) => dialog.accept());
    await bookCard.getByRole("button", { name: `Eliminar ${bookTitle}` }).click();
    await page.getByRole("status").filter({ hasText: "Contenido eliminado" }).waitFor();

    await selectAdminTab(/Cursos/);
    const courseCard = page.locator("article").filter({ hasText: courseTitle });
    page.once("dialog", (dialog) => dialog.accept());
    await courseCard.getByRole("button", { name: `Eliminar ${courseTitle}` }).click();
    await page.getByRole("status").filter({ hasText: "Contenido eliminado" }).waitFor();

    await page.getByRole("button", { name: /Cerrar sesión/i }).click();
    await page.waitForURL(`${baseUrl}/admin/login`);
  } finally {
    await cleanupContent();
    await context?.close();
    await browser?.close();
    if (serverProcess.exitCode === null) {
      serverProcess.kill();
      await Promise.race([
        new Promise((resolve) => serverProcess.once("exit", resolve)),
        new Promise((resolve) => setTimeout(resolve, 2_000)),
      ]);
    }
    await removeStaleDevLock();
  }
});
