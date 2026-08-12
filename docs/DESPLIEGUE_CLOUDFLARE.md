# Despliegue de Historia de la Moda en Cloudflare

Guía para publicar este proyecto como **Cloudflare Worker** y asociarlo a
`historiadelamoda.net`. No se debe crear un proyecto de Cloudflare Pages: la web
usa renderizado de servidor, rutas API, administración y una base de datos D1.

## Estado preparado en el repositorio

- Configuración de Cloudflare: `wrangler.jsonc`.
- Worker de entrada: `worker/index.ts`.
- Base de datos: binding `DB` y migraciones en `drizzle/`.
- Dominio canónico y metadatos: `https://historiadelamoda.net`.
- Fuentes servidas desde `public/fonts/`, sin depender de Google ni de rutas del
  ordenador donde se compila.
- Dos limitadores de Cloudflare: formulario de contacto y acceso administrativo.
- Secretos obligatorios declarados para impedir un despliegue incompleto.
- Comprobación automática: `npm run check:cloudflare`. Esta orden exige un
  UUID D1 real antes de construir y revisar el artefacto.

El único dato que el repositorio no puede conocer de antemano es el UUID de la
base D1 de tu cuenta. Hasta que se cree, `wrangler.jsonc` contiene el UUID neutro
`00000000-0000-4000-8000-000000000000`. El despliegue se detendrá si no se
sustituye.

## 1. Comprobar la cuenta y el dominio

El 12 de agosto de 2026, `historiadelamoda.net` ya respondía con los nameservers
de Cloudflare `dorthy.ns.cloudflare.com` y `hunts.ns.cloudflare.com`. Si el
dominio aparece como **Active** dentro de la misma cuenta donde vas a crear el
Worker, no cambies los nameservers.

Si no aparece en esa cuenta:

1. Cloudflare → **Domains** → **Onboard a domain**.
2. Añade `historiadelamoda.net` (sin `www`).
3. Revisa los registros DNS existentes, especialmente MX y TXT de correo.
4. Cambia en el registrador los nameservers por los dos que asigne Cloudflare.
5. Espera a que la zona figure como **Active**.

No hace falta transferir la propiedad del dominio a Cloudflare; basta con que
Cloudflare gestione sus DNS. Véanse las guías oficiales de
[alta de DNS](https://developers.cloudflare.com/dns/get-started/) y
[cambio de nameservers](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/).

## 2. Abrir una terminal en la raíz correcta

Todos los comandos de esta guía se ejecutan desde:

```powershell
Set-Location "C:\Users\USUARIO\Desktop\CODE\historia de la moda web"
```

Instala exactamente las dependencias registradas en `package-lock.json`:

```powershell
npm ci
```

## 3. Iniciar sesión en Cloudflare

```powershell
npx wrangler login
npx wrangler whoami
```

El segundo comando debe mostrar la cuenta donde está la zona
`historiadelamoda.net`.

## 4. Crear la base D1 de producción

```powershell
npx wrangler d1 create historia-de-la-moda-production --location=weur
```

Cloudflare devolverá un `database_id`. Copia solo ese UUID en
`wrangler.jsonc`, sustituyendo el UUID de ceros dentro de `d1_databases`.
No cambies el binding `DB` ni el nombre `historia-de-la-moda-production`.
El UUID de D1 identifica el recurso pero no concede acceso y no es una
contraseña: confirma este cambio en Git y súbelo a `main` antes de conectar
Workers Builds, para que los despliegues automáticos usen la misma base.

Comprueba que la configuración ya está completa:

```powershell
npm run check:cloudflare:config
```

Documentación oficial:
[crear D1](https://developers.cloudflare.com/d1/wrangler-commands/#d1-create) y
[configurar el binding](https://developers.cloudflare.com/workers/wrangler/configuration/#d1-databases).

## 5. Aplicar el esquema a D1

Lista y aplica las migraciones contra la base remota:

```powershell
npx wrangler d1 migrations list DB --remote --config wrangler.jsonc
npx wrangler d1 migrations apply DB --remote --config wrangler.jsonc
```

Comprueba las tablas:

```powershell
npx wrangler d1 execute DB --remote --config wrangler.jsonc --command "SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;"
```

Deben aparecer, entre otras, `books` y `courses`. Las migraciones se registran
para no volver a aplicar una ya ejecutada. Consulta la
[documentación de migraciones D1](https://developers.cloudflare.com/d1/reference/migrations/).

Los identificadores de los dos rate limits ya están declarados en
`wrangler.jsonc`. Si Cloudflare informa de una colisión con otro Worker de tu
cuenta, sustituye cada `namespace_id` por otro entero positivo distinto y vuelve
a ejecutar las comprobaciones.

## 6. Preparar credenciales y correo sin subir secretos a Git

Copia el ejemplo local:

```powershell
Copy-Item .env.production.example .env.production
```

Edita `.env.production` y sustituye todos los valores. Nunca uses `admin/admin`
en Internet. Elige un usuario no predecible, una contraseña larga y única, y
genera el secreto de sesión, por ejemplo:

```powershell
$bytes = New-Object byte[] 48
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
[Convert]::ToBase64String($bytes)
```

Copia la cadena resultante en `ADMIN_SESSION_SECRET`. No pegues ninguno de esos
valores en `wrangler.jsonc`, GitHub, una captura o este documento.

### Configurar Resend

1. En Resend, añade y verifica `historiadelamoda.net`.
2. Añade en Cloudflare DNS exactamente los registros TXT/DKIM/SPF que entregue
   Resend; no inventes sus valores.
3. Cuando vayas a activar el formulario, crea una API key y guárdala como
   `RESEND_API_KEY` en `.env.production`.

`RESEND_API_KEY` es opcional durante el primer despliegue. Mientras no exista,
el formulario responde de forma controlada indicando que el envío automático
no está configurado; el resto de la web continúa funcionando normalmente.

El remitente ya está configurado como
`Historia de la Moda <contacto@historiadelamoda.net>` y los mensajes se envían
a `contacto@historiadelamoda.net`, cuya regla de correo los reenvía a
`demedinamoda@gmail.com`. El formulario también manda una confirmación
automática a la persona que contacta.

Cloudflare cifra estos valores como secretos. Referencia:
[Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

## 7. Ejecutar todas las comprobaciones antes de publicar

```powershell
npm run lint
npm test
npm run check:cloudflare
```

La última orden recompila y verifica:

- todas las rutas públicas con el host real;
- `robots.txt` y `sitemap.xml`;
- que no haya `C:\...`, `file://`, `localhost` ni `127.0.0.1` en URLs públicas;
- que los artefactos no revelen rutas del ordenador;
- que las tres fuentes locales estén incluidas en el build.

No publiques si alguna orden termina con error.

## 8. Primera publicación

La primera vez hay que enviar los secretos junto al código:

```powershell
npm run deploy:cloudflare:first
```

Esta orden comprueba que `.env.production` ya no contiene valores de ejemplo,
valida D1 y el dominio, genera el artefacto y finalmente publica los secretos
junto al Worker.

`dist/` se genera localmente y está ignorado por Git. Cloudflare publicará el
Worker `historia-de-la-moda` y el Custom Domain declarado en `wrangler.jsonc`.
La URL secundaria `workers.dev` está desactivada para evitar otra copia pública
de la web y del acceso administrativo.

Los secretos quedan guardados en Cloudflare y no es necesario reenviarlos en
cada actualización. Para despliegues manuales posteriores basta con:

```powershell
npm run deploy:cloudflare
```

## 9. Asociar `historiadelamoda.net`

El `routes` de `wrangler.jsonc` ya declara `historiadelamoda.net` como
**Custom Domain**, por lo que el despliegue debe crearlo automáticamente. Si se
prefiere comprobarlo o añadirlo desde el panel:

1. Cloudflare → **Workers & Pages**.
2. Selecciona `historia-de-la-moda`.
3. **Settings** → **Domains & Routes**.
4. **Add** → **Custom Domain**.
5. Introduce `historiadelamoda.net` y confirma.

Cloudflare crea el registro DNS y el certificado TLS. No crees una IP de origen
ni un CNAME al Worker para el dominio raíz. Un Custom Domain es el mecanismo
correcto cuando el Worker es el origen completo:
[documentación oficial](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

Cloudflare emite automáticamente un certificado administrado para el Custom
Domain. La emisión puede tardar; su estado se consulta en
**SSL/TLS → Edge Certificates**.

## 10. Redirigir `www` al dominio raíz

`www.historiadelamoda.net` es otro hostname y no queda cubierto por añadir solo
el dominio raíz. Para evitar contenido duplicado:

1. En **DNS → Records**, crea para `www` un registro **A** hacia `192.0.2.0` y
   déjalo **Proxied** (nube naranja).
2. En **Rules → Redirect Rules**, crea una **Single Redirect**.
3. Condición: hostname igual a `www.historiadelamoda.net`.
4. Destino: `https://historiadelamoda.net` conservando ruta y query string.
5. Código: **301**.

Resultado esperado:

```text
https://www.historiadelamoda.net/archivo
→ https://historiadelamoda.net/archivo
```

Cloudflare documenta este patrón en
[Redirect between www and root domain](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/#redirect-between-www-and-root-domain).

## 11. Activar despliegues automáticos desde GitHub

Hazlo después del primer despliegue manual, cuando D1, secretos y dominio ya
funcionen:

1. Cloudflare → **Workers & Pages** → `historia-de-la-moda`.
2. **Settings → Builds → Connect**.
3. Autoriza GitHub solo para `CODIGOAFRX/WebHistoriaDeLaModa`.
4. Rama de producción: `main`.
5. Directorio raíz: `/`.
6. Build command:

   ```bash
   npm run check:cloudflare
   ```

7. Deploy command:

   ```bash
   npx vinext-cloudflare deploy --skip-build --config dist/server/wrangler.json
   ```

8. Desactiva inicialmente los builds de ramas no productivas. Las previews no
   deben usar la D1 de producción.

Los secretos del Worker son variables **runtime**, no variables temporales del
build. Comprueba en **Settings → Variables and Secrets** que siguen presentes.
Cloudflare explica la integración en
[Workers Builds con Git](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/).

Cuando haya una migración nueva, aplícala manualmente antes del despliegue o
concede al token de Builds el permiso limitado **D1 Edit** y añade este paso al
Deploy command:

```bash
npx wrangler d1 migrations apply DB --remote --config wrangler.jsonc
```

## 12. Verificación final en producción

Comprueba en una ventana privada:

1. `https://historiadelamoda.net/` carga con candado HTTPS.
2. `https://www.historiadelamoda.net/` redirige una sola vez al dominio raíz.
3. Recarga directa en `/podcasts`, `/conferencias`, `/archivo`, `/biblioteca`,
   `/escuela` y `/contacto` sin errores 404.
4. `/robots.txt` y `/sitemap.xml` responden y solo usan el dominio real.
5. `/admin` no acepta `admin/admin`.
6. Crear, publicar y eliminar una ficha de prueba confirma D1.
7. El formulario envía la consulta a `contacto@historiadelamoda.net`, que la
   reenvía a `demedinamoda@gmail.com`; al pulsar **Responder**, el destinatario
   es el correo introducido en el formulario. Esa persona recibe además un
   acuse automático desde el correo del dominio.
8. En DevTools → Network no aparece ninguna petición a `localhost`,
   `127.0.0.1`, `file://`, puertos 3000/30000 ni rutas `C:\...`.
9. Los recursos `/fonts/*`, `/images/*` y `/_next/static/*` responden 200.
10. Revisa **Workers Logs** después de la prueba.

## 13. Copias y vuelta atrás

Antes de cambios importantes en contenido o esquema:

```powershell
New-Item -ItemType Directory -Force backups
npx wrangler d1 export historia-de-la-moda-production --remote --output=backups/backup-AAAA-MM-DD.sql
```

`backups/` está ignorado por Git porque las exportaciones pueden contener datos
personales y contenido privado.

Para volver al código anterior:

```powershell
npx wrangler rollback
```

Un rollback del Worker no revierte D1. Las restauraciones de base son una acción
distinta y destructiva; usa primero la información de
[D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) y
[rollbacks de Workers](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).

## Regla de mantenimiento

Antes de cada publicación:

```powershell
git pull --ff-only
npm ci
npm test
npm run check:cloudflare
npm run deploy:cloudflare
```

No subas `.env.production`, `.env.local`, `dist/`, `.wrangler/` ni los materiales
originales de `Web Historia de la moda/`.
