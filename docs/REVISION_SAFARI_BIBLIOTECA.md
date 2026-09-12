# Biblioteca: revisión de Safari

Fecha: 13 de septiembre de 2026. Rama local: `fix/safari-library`.
Base descargada de `CODIGOAFRX/WebHistoriaDeLaModa`: `4ba2b60ac5fd4b0c5f88c80c42f39f6366d79623`.

## Resultado

Se reprodujo que la ficha de un libro queda reducida a una línea de 2 px en
WebKit 18, con una ventana de 1440 × 900. La petición y el contenido funcionan:
el fallo está en el cálculo de altura del diálogo. En WebKit actual y Chromium
la misma ficha ya se mostraba correctamente antes del cambio.

La ficha usa altura automática limitada por `max-height` y dos contenedores
flexibles anidados con `flex: 1` (base del 0 %). Se cambia a `flex: 1 1 auto`
en `.book-dialog-panel` y `.book-dialog-scroll` para calcular el tamaño desde
el contenido. Se conserva el diseño, el límite de altura, la portada y el
desplazamiento de la reseña.

En la página pública, aplicando únicamente estas dos declaraciones al navegador
local de prueba, la ficha pasa de **2 px a 734,328125 px**. No se modificó el
servidor publicado para esta comprobación.

- [Antes, WebKit 18](../outputs/library-safari/production-before-webkit18.png)
- [Después, corrección aplicada solo en el navegador local](../outputs/library-safari/production-local-fix-webkit18.png)
- [Mediciones de la reproducción](../outputs/library-safari/reproduction.json)
- [Prueba local en móvil con reseña larga](../outputs/library-safari/webkit-18-390-long.png)

## Verificación

- `npm run build`: correcto.
- `npm run test:unit`: correcto.
- `node --test tests/browser-responsive.test.mjs`: 67 pruebas correctas.
- `npm run test:admin-ui`: correcto; altas, edición, publicación y borrado en D1 local.
- `npm run test:library`: 9 combinaciones correctas (WebKit 18, WebKit actual y
  Chromium; 1440, 768 y 390 px). Incluye libros con y sin portada, reseñas cortas
  y largas, filtros, búsqueda, apertura, área visible, desplazamiento hasta el
  último párrafo, cierre con botón, reapertura y Escape.
- `npm run lint -- --ignore-pattern work --ignore-pattern outputs`: sin errores;
  14 avisos sobre imágenes en archivos existentes.
- `npm run check:cloudflare:config` y `node scripts/check-cloudflare-readiness.mjs`:
  correctos.
- `git diff --check`: correcto.

`npx tsc --noEmit` no pasa: faltan declaraciones del módulo `cloudflare:workers`
en cuatro archivos existentes que no se han modificado (`db/index.ts`,
`app/media/storage.ts` y los limitadores de sesión/contacto). La compilación de
producción sí pasa. No se han añadido declaraciones ficticias para ocultarlo.

## Revisión y publicación

Los cambios están preparados localmente y **no se ha hecho push ni deploy**.
La dependencia de WebKit 18 es solo de desarrollo y se usa para conservar una
prueba del fallo que no aparece en el motor actual.

Para repetir la prueba en una instalación nueva:

```sh
npm ci
npm run test:library:install
npm run test:library
```

Las pruebas se ejecutaron en Windows con los motores de Playwright, no en un
iPhone ni un Mac físico. Antes de dar por validado el dispositivo del usuario,
conviene abrir una ficha corta y otra larga en ese Safari, desplazarse hasta
el final y cerrarlas. No se conoce su versión exacta. La corrección resuelve
el fallo reproducido sin sustituir la biblioteca por un listado diferente.

Revisar el diff y decidir el push es el siguiente paso del propietario. Si la
integración de GitHub despliega automáticamente la rama principal, aprobar el
push o la integración implica también revisar ese despliegue.
