# Implementation Plan: Pulido de pantallas, restauración de copias y Capsulito más vivo (F14)

**Branch**: `main` (AGENTS.md §9) | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: `specs/014-pulido-pantallas-restauracion/spec.md`, aprobada el 2026-10-26 y traspasada a `historias.md` v0.26.0 (CAMBIO-026).

**Status**: Propuesta. Pendiente de la aprobación de la persona usuaria (AGENTS.md §2).

## Summary

F14 reúne siete mejoras independientes. La única con riesgo económico es la restauración de copias (US1). Se diseña para que nada se sustituya hasta que la copia elegida y la copia de resguardo estén comprobadas, y la sustitución se hace **al arrancar**, con la base de datos cerrada. Las otras seis mejoras solo tocan la presentación, Capsulito y un recurso de sonido. No hay migraciones ni dependencias nuevas.

## Technical Context

**Language/Version**: TypeScript 6 (estricto), Node 24, SvelteKit 3, Svelte 5 (runes)
**Primary Dependencies**: las de la constitución. Ninguna nueva: `aws4fetch` (ya en `copias/subida-s3.ts`) lista y descarga del bucket; `tar` (ya en `copias/empaquetado.ts`) desempaqueta.
**Storage**: SQLite en `/data/becafe.db` y fotos en `/data/fotos`. Sin cambios de esquema. La restauración preparada vive en `/data/restauracion/` hasta el arranque.
**Testing**: Vitest (unitarias, integración con SQLite real y bucket falso), Vitest Browser Mode (componentes), Playwright (E2E, `sin-js`, `acceso`, axe).
**Target Platform**: Docker en Coolify, una instancia; móvil primero.
**Performance Goals**: restauración de una copia de 50 MB en 2 min como máximo (RNF-F14-1); sonido del agua ≤ 30 KB (RF-260).
**Constraints**: constitución IV, V, X, XIII, XVI y XVII; sin JavaScript, restaurar funciona (formulario y *action*).
**Scale/Scope**: unos 10 usuarios; copias de cientos de KB.

## Constitution Check

| Principio | Cumplimiento |
| --- | --- |
| I. Trazabilidad | Cada decisión cita RF-253 a RF-265 y DEC-131 a DEC-134 de `historias.md` v0.26.0. |
| II. Complejidad | Sin dependencias, capas ni tareas programadas nuevas. Un componente nuevo (`DosColumnas`) sustituye cinco rejillas escritas a mano. |
| III. Módulos | La restauración vive en `copias`. Usa `auth` (reautenticar), `usuarios` (auditoría) y `plataforma` (reinicio y mantenimiento) por su `index.ts`. El orden de la visita es una función pura de `lib/shared`. |
| IV. Integridad económica | La restauración no modifica ni borra registros sueltos: sustituye la base entera por otra coherente, comprobada y con migraciones compatibles, después de guardar una copia de resguardo. Mientras se prepara, la aplicación rechaza los registros (D4). |
| V. Almacenamiento | La copia de resguardo va al bucket (fuera del servidor). La preparación usa el volumen `/data`. El navegador no guarda nada nuevo. |
| VI. Seguridad | Solo administradores, con contraseña (`reautenticar`). La clave de la copia se valida con un esquema y debe existir en el bucket. La URL firmada y las claves nunca salen del archivo de `aws4fetch`. |
| X. Usabilidad | La restauración muestra el efecto y pide confirmación en una pantalla propia. Cada pantalla tiene una acción primaria. |
| XI. Accesibilidad | Axe en claro y oscuro en las pantallas tocadas. «Nuevo» y «Quedan pocas» llevan texto, no solo color. «Saltar» sobre una pastilla opaca. |
| XVI. Registro | Códigos nuevos `copia.restauracion_*` con identificadores, tamaños y duraciones. Nunca la clave del objeto completa con datos personales (no los tiene) ni la contraseña. |
| XVII. SvelteKit | Restaurar es `<form method="post">` con *action* con nombre en una ruta propia. Funciona sin JavaScript. El reinicio lo hace `plataforma`. |
| XVIII. Mascota y movimiento | Cinco gestos en orden fijo según el tiempo en reposo; sin azar. Movimiento reducido: quieto. El fondo difuminado del corto es un filtro sobre la portada, no cristal. |

Resultado: **supera la revisión**. No hace falta enmendar la constitución.

## Diseño por historia

### D1. Restauración de copias (US1, RF-253 a RF-256, DEC-131)

**Cliente S3** (`copias/subida-s3.ts`, sigue siendo el único archivo que importa `aws4fetch`): `crearClienteS3(configuracion)` devuelve `{ subir, listar, descargar }`.

- `listar()`: `GET /<bucket>?list-type=2&prefix=becafe/`. Extrae `Key`, `Size` y `LastModified` de cada `<Contents>` y los valida con Zod. Devuelve como máximo 30, de la más reciente a la más antigua. Es de resguardo si la clave empieza por `becafe/resguardos/`.
- `descargar(clave, destino)`: `GET` del objeto a un archivo de `/data/tmp/`. Devuelve la suma `x-amz-meta-sha256` de la cabecera.
- Los errores siguen el conjunto cerrado de `ErrorCopia`: `S3_RED`, `S3_CREDENCIALES`, `S3_RESPUESTA` y los nuevos `S3_LISTADO`, `SUMA`, `INTEGRIDAD`, `VERSION_NUEVA` y `EN_CURSO`.

**Ruta nueva `/admin/copias/restaurar?clave=…`** (`+page.server.ts` y `+page.svelte`). Es una pantalla y no un diálogo para que funcione sin JavaScript (XVII).

- El `load` valida la consulta con `z.strictObject({ clave })` (patrón `^becafe/[\w/.-]+\.tar\.gz$`). Comprueba que la clave está en `listar()` y muestra el efecto (RF-254) con la fecha de Madrid.
- La *action* `?/restaurar` valida `{ clave, contrasena }` y llama a `copias.restaurarCopia(ambiente, actor, entrada)`.
- Si todo va bien, redirige a `/admin/copias?restauracion=preparada`. Si falla, devuelve `fail(…)` con el código traducido a un mensaje de `textos.ts`.

**Caso de uso `restaurarCopia`** (`copias/restauracion.ts`). La E/S va fuera de transacciones y cada paso puede fallar sin efectos:

1. `exigirAdministrador` y `reautenticar(contrasena)`.
2. Bloquear: `ambiente.mantenimiento.restaurando = true`. Si ya estaba activo, falla con `EN_CURSO`.
3. **Copia de resguardo**: `hacerInstantanea`, `empaquetar` y `subir` con la clave `becafe/resguardos/AAAA/MM/becafe-<instante>.tar.gz`.
4. **Descarga y comprobación**: descargar la elegida, comparar SHA-256 con su metadato, desempaquetar en `/data/restauracion/preparada/` y comprobar con `verificarCopia`: `integrity_check = ok` y migraciones aplicadas ≤ las del journal de la aplicación (`VERSION_NUEVA` si no).
5. Escribir `/data/restauracion/pendiente.json` (`{ clave, resguardo, adminId, instante }`, esquema Zod) **como último paso**.
6. Llamar a `ambiente.reiniciar()`.

Si falla cualquier paso del 3 al 5: se borran `preparada/` y el temporal, se desbloquea, se registra `copia.restauracion_fallida` con su código y se devuelve el error. Los datos no cambian (RF-255, EV-113).

**Reinicio** (`plataforma/reinicio.ts`): `programarReinicio()` espera 1 s (para que la respuesta salga), cierra la base de datos y termina el proceso con código 0. En producción, Docker o Coolify vuelven a arrancar el contenedor. En las pruebas, `ambiente.reiniciar` es un doble que solo cuenta las llamadas.

**Aplicar al arrancar** (`copias/aplicar-restauracion.ts`, llamado desde `arranque.ts` **antes** de `abrirBaseDatos`):

1. Si no existe `pendiente.json`, no hace nada. Si no supera su esquema, registra `copia.restauracion_marca_invalida` y la aparta sin aplicar nada.
2. Mueve `becafe.db` (y `-wal` y `-shm` si existen) y `fotos/` a `/data/restauracion/anterior/`, y mueve `preparada/becafe.db` y `preparada/fotos/` a su sitio. Usa `rename` dentro del mismo volumen.
3. Si un `rename` falla, devuelve lo movido a su sitio y registra `copia.restauracion_fallida`. La aplicación arranca con los datos de antes.
4. Abre la base y aplica las migraciones que falten (solo avanzan, XIV). Escribe la auditoría (`accion: 'copia.restaurada'`, `detalle` con la clave restaurada y la del resguardo) mediante una función pública de `usuarios`. Guarda la marca de la última restauración en `ejecucion_tarea` o en una fila de `copia_seguridad` (ver research R4). Borra `pendiente.json` y `anterior/`.

**Pantalla `/admin/copias`** (RF-253, RF-256, RF-257):

- Sección «Copias en el bucket», con su lista y un enlace «Restaurar» por copia (los destinos son enlaces, X).
- Sin S3, la explicación y ningún enlace.
- Si el bucket no responde, «No se pudo leer el bucket» y el resto de la pantalla sigue.
- Aviso de la última restauración (fecha, copia y resguardo) o «Restauración preparada: la aplicación se está reiniciando» si existe `pendiente.json`.
- Textos nuevos de «Anotar una prueba de restauración».
- El enlace de vuelta pasa a «Volver a Administración».

### D2. Bloqueo de registros durante la restauración (RF-255 a)

`Ambiente` gana `mantenimiento: { restaurando: boolean }`. Es un objeto creado al arrancar y no estado a nivel de módulo (AGENTS §6). `hooks.server.ts` responde **503** a toda petición que no sea `GET` ni `HEAD` mientras `restaurando` es `true`:

- Las *actions* devuelven la página de error con «Estamos restaurando una copia. Inténtalo en unos segundos».
- La API de la cola sin conexión responde 503, y el cliente ya reintenta con 5xx (RF-019).

### D3. Orden de la visita en Inicio (US3, RF-258, DEC-132)

- **Función pura** `ordenarSegunVisita(ordenInicial: string[], tipos)` en `lib/shared/capsulas/orden-visita.ts`: conserva el orden de los identificadores conocidos y pone al final los nuevos (en el orden en que llegan del servidor). Los desaparecidos se quitan.
- **En `src/routes/(app)/+page.svelte`**: `const ordenInicial = untrack(() => data.tipos.map((t) => t.id))` y `const tiposEnPantalla = $derived(ordenarSegunVisita(ordenInicial, data.tipos))`.
- **Cuándo se recalcula**: el componente se vuelve a montar al volver a entrar, así que el orden se recalcula. Un `load` repetido tras la *action* no lo cambia.
- **El confeti** ya sale sobre la tarjeta con el identificador del tipo. Al no moverse la tarjeta, deja de parecer que sale en otra.

### D4. Cinco gestos de reposo (US4, RF-259, DEC-133)

- **`lib/shared/mascota/reposo.ts`**:
  - `GESTOS = ['mirarLados', 'pie', 'bostezoMano', 'tocarReloj', 'bostezo']`.
  - Instantes 4; 9,5; 15; 20,5 y 26 s. Duraciones 1,2; 1,2; 1,8; 2 y 2 s. Ciclo de 29 s.
- **`gestoEn`**: pasa a trabajar en medios segundos.
- **`Capsulito.svelte`**: el contador de reposo avanza cada 0,5 s. Sigue pausado con la pestaña oculta.
- **`docs/diseno/f12/rive/generar-reposo.mjs`**:
  - `reloj` se renombra a `bostezoMano`: la misma mano junto a la boca, con la boca en su apertura máxima y los ojos entornados.
  - Animación nueva `tocarReloj` (2 s): el brazo izquierdo sube con la muñeca delante; el brazo derecho cruza y da 4 toquecitos (cada uno de 0,2 s, de ida y vuelta); cejas fruncidas y mirada a la muñeca.
  - Se añaden los *triggers* `bostezoMano` y `tocarReloj` al *view model*.
- **Recursos**:
  - Se compila con `~/.rive/bin/rive` a `static/mascota/capsulito.riv`.
  - El respaldo SVG estático no cambia.
  - Capturas de los cinco gestos en `docs/diseno/f12/rive/reposo/capturas/` para la revisión de la persona usuaria.

### D5. Sonido del agua (US5, RF-260)

- **`scripts/generar-sonido.mjs`** gana `--sonido cafe|agua`, con la petición y el destino de cada uno:
  - Agua: «short cheerful cartoon water pouring and bubbling into a jug, 1 second, bright, no voice».
  - Destino: `static/mascota/sonidos/agua.mp3`.
  - Candidatos en `.local/sonidos/agua/`.
- **Generación**: 4 candidatos. Queda uno provisional y la persona usuaria elige con `--sonido agua --elegir NN`.
- **`EstadoMascota.celebrar(fraseId, sonido: 'cafe' | 'agua' = 'cafe')`**: Inicio pasa `'agua'` en la celebración del relleno. RF-244 no cambia.
- **Service worker**: `agua.mp3` entra en su precarga, como `celebracion.mp3`.

### D6. Dos columnas en escritorio (US6, RF-261)

- **Componente nuevo `lib/ui/DosColumnas.svelte`** con los snippets `acciones` y `listado`.
  - En el DOM van primero las acciones (orden de móvil).
  - En `lg` (1024 px): `grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`, y el listado sobre `rounded-panel border border-hairline bg-wall-raised p-4`, la misma superficie que `Section panel`.
  - Sin cristal (XVIII: listados y formularios sobre superficie estable).
- **Rutas**:
  - `admin/usuarios`: alta | listado.
  - `admin/control`: arqueo y recuento | historial.
  - `admin/capsulas`: alta | listado.
  - `compras`: registrar con el ticket | listado.
  - `avisos`: pendientes | vistos.
- **Ancho**: `(app)/+layout.svelte` da a `/avisos` el ancho `wide`.

### D7. Avisos pendientes y stock en Compras (US7, RF-262, RF-263)

- **Avisos**:
  - Los pendientes llevan `bg-accent-soft border border-accent`, más una `Badge` «Nuevo» con texto.
  - Los vistos llevan `bg-wall-raised border-hairline`.
  - Se comprueba el contraste del texto sobre `accent-soft` en los dos temas.
- **Compras**:
  - `economia.leerTiposComprables` añade `stock` y `stockBajo` desde `existencias`, con la misma regla de RF-218.
  - Bajo el nombre: «Quedan N». Con stock bajo, además, el icono `triangle-alert` y «Quedan pocas» en `text-warning`.

### D8. Corto a pantalla completa (US8, RF-264, RF-265, DEC-134)

- **`lib/ui/Corto.svelte`** ocupa `fixed inset-0` y lleva tres capas:
  1. `portada.jpg` con `object-cover`, `blur-2xl` y `scale-110` (`aria-hidden`).
  2. El vídeo o la portada nítida con `object-contain`, a toda la altura.
  3. Los controles:
     - «Ver el corto», centrado y grande.
     - «Saltar», arriba a la derecha sobre `bg-wall-raised`, ≥ 24 × 24 px.
     - «Leer la transcripción», abajo; abre un `Dialog` de Bits UI con la transcripción.
- **Movimiento reducido**: deja de abrir la transcripción. La hoja se abre a petición.
- **Se quitan** el `<track>`, `static/corto/subtitulos.vtt`, su entrada en `RUTAS_CORTO` y su paso en `exportar-web.mjs` (con su prueba). El vídeo no se vuelve a montar.
- **Modo `dialogo`** (Ajustes y Ayuda): usa la misma presentación a pantalla completa.

## Project Structure

### Documentation (this feature)

```text
specs/014-pulido-pantallas-restauracion/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/restauracion.md
└── tasks.md            (/speckit-tasks)
```

### Source Code (repository root)

```text
src/lib/server/copias/{subida-s3,restauracion,aplicar-restauracion,errores,esquema,index}.ts (+ pruebas)
src/lib/server/plataforma/{ambiente,reinicio,index}.ts
src/lib/server/arranque.ts, src/hooks.server.ts
src/lib/server/economia/compras.ts
src/lib/server/usuarios/ (función pública de auditoría, si no existe)
src/lib/shared/capsulas/orden-visita.ts (+ prueba), src/lib/shared/mascota/reposo.ts (+ prueba), src/lib/shared/textos.ts
src/lib/ui/{DosColumnas,Corto,Capsulito}.svelte, src/lib/ui/contextos/mascota.svelte.ts
src/routes/(app)/{+page,+layout}.svelte, avisos/, compras/, admin/{usuarios,control,capsulas,copias}/, admin/copias/restaurar/
static/mascota/{capsulito.riv,sonidos/agua.mp3}, static/corto/ (sin subtitulos.vtt), src/service-worker.ts
docs/diseno/f12/rive/generar-reposo.mjs, scripts/generar-sonido.mjs, docs/diseno/corto-capsulito/html/exportar-web.mjs
e2e/: restauracion-f14, columnas-f14, inicio-orden-f14, corto-f13 (ajustada), sin-js/restauracion-f14, a11y/acceso (ruta nueva)
ARCHITECTURE.md, docs/operacion.md §6, docs/pruebas.md
```

## Verificación

- **Unitarias**:
  - `orden-visita` (con propiedades: la tarjeta pulsada nunca cambia de puesto).
  - `reposo` (los instantes de CA-259).
  - El análisis del listado de S3.
  - El esquema de `pendiente.json`.
- **Integración** (SQLite real y bucket falso en memoria):
  - EV-112: restauración completa: aplicar al arrancar, saldos iguales a los de la copia, resguardo subido y auditoría.
  - EV-113: un fallo inyectado en cada paso; la base no cambia y `restaurando` vuelve a `false`.
  - Un `rename` que falla al arrancar.
  - Un miembro rechazado.
  - Una contraseña incorrecta.
  - Una restauración en curso.
- **Evento falso**: la *action* `restaurar` (fallos y redirección) y el 503 de `hooks.server.ts` con mantenimiento.
- **Componentes**:
  - `Corto` (sin pista de subtítulos; la transcripción en hoja).
  - `DosColumnas` (el orden del DOM).
  - `EstadoMascota.celebrar` con el sonido del agua.
- **E2E**:
  - CA-253 (sin S3, en el entorno E2E), CA-257, CA-258, CA-261 (1280 y 390 px), CA-262, CA-263 y CA-264/265.
  - La ruta `/admin/copias/restaurar` entra en `acceso` (EV-050) y en axe en claro y oscuro.
  - `sin-js`: la pantalla de restaurar se carga y el formulario se envía (contra el bucket falso no hay S3 en E2E: se comprueba el rechazo «sin bucket»).
- **Manual**: una restauración real contra el bucket de Backblaze en local (`npm run build && node build`), anotada en `quickstart.md`. La hace la persona usuaria con sus credenciales.
- **Cierre**: `npm run verify` (cambian `hooks.server.ts`, `plataforma/` y contratos). **Sin benchmark completo**, por decisión de la persona usuaria.

## Riesgos

- **Reinicio en Coolify**: depende de la política de reinicio del contenedor. Se documenta en `docs/operacion.md` cómo comprobarla (`unless-stopped`). Si el contenedor no vuelve, la restauración queda preparada y se aplica en el siguiente arranque manual: no se pierde ni se mezcla nada.
- **Cafés de la cola sin conexión**: los enviados entre la copia y la restauración se pierden; la pantalla de efecto lo dice (RF-254).
- **Precisión respecto a la spec**: el caso límite «La aplicación no se reinicia sola» decía «los datos ya están sustituidos». Con este diseño la sustitución se hace al arrancar, así que **los datos siguen intactos hasta el reinicio** y la pantalla lo dice. Es más seguro y cumple RF-255 y RF-256 igual. Se corrige la frase en `spec.md`.

## Complexity Tracking

Sin desviaciones de la constitución.
