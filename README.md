# Historia de la Moda

Web oficial de Carlos Sánchez de Medina Alcina: portfolio, podcast, conferencias,
biblioteca y futura aula online.

## Desarrollo local

Requiere Node.js 22.13 o posterior.

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Comprobaciones

```bash
npm run build
npm test
npm run lint
```

## Publicación en Cloudflare

El proyecto se publica como Cloudflare Worker con D1. La configuración está en
`wrangler.jsonc` y la guía completa para crear la base, cargar secretos, asociar
`historiadelamoda.net` y conectar GitHub está en
[`docs/DESPLIEGUE_CLOUDFLARE.md`](docs/DESPLIEGUE_CLOUDFLARE.md).

Antes de publicar, ejecuta:

```bash
npm run check:cloudflare
```

La comprobación se detiene deliberadamente mientras `wrangler.jsonc` conserve
el UUID D1 de ceros. Para revisar solo el build antes de crear la base remota,
usa `npm run check:cloudflare:artifact`.

## Contenido y administración

- La web pública vive en `app/`.
- Los contenidos editoriales estáticos están en `app/data/content.ts`.
- La biblioteca y los cursos usan Cloudflare D1.
- `/admin` permite gestionar libros y cursos mediante un acceso temporal con
  usuario y contraseña.
- En desarrollo, las credenciales predeterminadas son `admin` / `admin`.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` permiten
  sustituirlas sin tocar el código.
- Los cursos admiten una URL de lanzamiento SCORM, que se abre dentro del aula.
- `/contacto` ofrece un formulario con validación y entrega mediante la API de
  Resend. Configura `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` y, si se desea,
  `CONTACT_TO_EMAIL`; el remitente debe pertenecer a un dominio verificado. El
  formulario entrega la consulta al correo del dominio y envía al usuario una
  confirmación automática en la misma operación transaccional.

Para una instalación local, copia `.env.example` como `.env.local` y ajusta las
credenciales. El acceso `admin` / `admin` es deliberadamente provisional e
inseguro: debe reemplazarse antes de publicar. No publiques `.env.local`.

## Materiales visuales

Los recursos optimizados están en `public/images/`. Los originales entregados se
mantienen fuera del proyecto y no se modifican.
