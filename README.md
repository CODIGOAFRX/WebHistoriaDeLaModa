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

Para una instalación local, copia `.env.example` como `.env.local` y ajusta las
credenciales. El acceso `admin` / `admin` es deliberadamente provisional e
inseguro: debe reemplazarse antes de publicar. No publiques `.env.local`.

## Materiales visuales

Los recursos optimizados están en `public/images/`. Los originales entregados se
mantienen fuera del proyecto y no se modifican.
