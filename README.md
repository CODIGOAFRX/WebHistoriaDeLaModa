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
- `/admin` permite gestionar libros y cursos tras iniciar sesión con ChatGPT.
- `ADMIN_EMAILS` restringe el acceso a una lista de correos, separados por comas.
- Los cursos admiten una URL de lanzamiento SCORM, que se abre dentro del aula.

Para una instalación local, copia `.env.example` como `.env.local` y ajusta el
correo administrador. No publiques ese archivo.

## Materiales visuales

Los recursos optimizados están en `public/images/`. Los originales entregados se
mantienen fuera del proyecto y no se modifican.
