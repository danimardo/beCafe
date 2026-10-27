# Implementation Plan: Descargar copias, copia manual, origen y registro de restauración (F17)

**Branch**: `main` (AGENTS.md §9) | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Input**: `specs/017-descarga-copia-manual/spec.md`, aprobada por la persona usuaria el 2026-10-27.

**Status**: Aprobado por la persona usuaria el 2026-10-27.

## Summary

F17 amplía el módulo `copias` con cuatro piezas: descarga en flujo de una copia del bucket, copia manual, origen de cada copia y eventos técnicos por paso de la restauración. No hay dependencias nuevas ni tareas programadas nuevas. Hay una migración pequeña (columna `tipo`). El origen y el tipo de una copia viajan **en la clave del objeto del bucket**, de modo que la lista los lee sin consultas extra y cualquier sistema que importe el bucket los ve.

## Technical Context

**Language/Version**: TypeScript 6 (estricto), Node 24, SvelteKit 3, Svelte 5 (runes).
**Primary Dependencies**: las de la constitución. `aws4fetch` (solo en `copias/subida-s3.ts`) y `tar` (solo en `empaquetado.ts`).
**Storage**: SQLite. Migración `0011` que añade `tipo` a `copia_seguridad`.
**Testing**: Vitest con SQLite real y bucket falso, Playwright (`acceso`, `sin-js`, axe en claro y oscuro).
**Constraints**: constitución IV, V, VI, X, XIII, XVI y XVII; `AGENTS.md` §5 y §6.

## Constitution Check

| Principio | Cumplimiento |
| --- | --- |
| I. Trazabilidad | Cada decisión cita RF-284 a RF-292 de la spec y, tras traspasar, de `historias.md` (CAMBIO-029). |
| II. Complejidad | Una columna y una función pura de clave en lugar de un manifiesto dentro del `.tar.gz` o 30 consultas `HEAD` por pantalla (D2). Sin dependencias ni tareas nuevas. |
| III. Módulos | Todo vive en `copias`. Usa `auth` (permiso), `usuarios` (auditoría) y `plataforma` (registro, ambiente) por su `index.ts`. La función de clave es pura y va en `copias/dominio/clave-copia.ts` sin reloj ni azar. |
| IV. Integridad económica | La copia manual solo lee (`VACUUM INTO`) y no toca registros. La restauración no cambia: solo se añaden eventos. |
| V. Almacenamiento | El origen no se guarda en el navegador. Las copias siguen en el bucket. |
| VI. Seguridad | Descarga solo para administradores, con la clave validada por esquema y presente en el bucket. La URL firmada y las claves de S3 no salen de `subida-s3.ts`. |
| X. Usabilidad | «Hacer copia ahora» pide confirmación (efecto sobre el bucket). Cada sección conserva una sola acción primaria. Errores en español con qué hacer. |
| XI. Accesibilidad | Etiquetas con texto, no solo color. Axe en claro y oscuro en `/admin/copias` y en la confirmación. |
| XVI. Registro | Eventos con identificadores, códigos, tamaños y duraciones. El dominio de origen se trata como identificador. Sin claves de S3, nombres ni contenido. |
| XVII. SvelteKit | Descargar es un `+server.ts` GET sin formulario, justificado en un ADR (D1). Hacer copia es `<form method="post">` con *action* con nombre. Funciona sin JavaScript. |

Resultado: **supera la revisión**. No hace falta enmendar la constitución. Se añade el ADR `0007-descarga-de-copias.md`.

## Decisiones

### D1. Descarga (RF-284, RF-285, DEC-140)

- **Ruta** `src/routes/(app)/admin/copias/descargar/[...clave]/+server.ts`, solo `GET`. Mismo patrón que `routes/fotos/…/+server.ts`: sin formulario, con sesión.
- **Caso de uso** `descargarCopia(ambiente, actor, clave, cliente)` en `copias/descarga.ts`:
  1. `exigirPermisoCopias` (administrador) y `ambiente.copias.s3` (si no, `SIN_S3`, 404).
  2. Valida `clave` con `esquemaClaveCopia` antes de tocar el bucket.
  3. `cliente.abrir(clave)` pide el objeto y devuelve `{ cuerpo: ReadableStream, tamano }`; un 404 del bucket es `NO_ENCONTRADA`.
  4. Anota la auditoría `copia.descargada` en una transacción (`actorId`, clave) **antes** de devolver el flujo, y emite `copia.descarga_iniciada`.
  5. Devuelve `{ nombre, tamano, cuerpo }`.
- **Respuesta**: `content-type: application/gzip`, `content-disposition: attachment; filename="<nombre>"`, `content-length` y `cache-control: no-store`. El nombre es el último segmento de la clave, que ya cumple `[\w.-]+`.
- **Cliente S3**: `ClienteS3.abrir(clave)` es nueva y no escribe en disco. `descargar` (a archivo) se queda para la restauración.
- **Errores**: `ErrorRestauracion` no sirve aquí; se amplía el conjunto cerrado de `ErrorCopia` con `SIN_S3`, `NO_ENCONTRADA` y `EN_CURSO` (la descarga usa los dos primeros). El `+server.ts` los traduce con `error(estado, mensaje)` de `textos.copias`.
- **ADR**: `docs/adr/0007-descarga-de-copias.md` justifica el `+server.ts` fuera de la lista de XVII (no hay formulario posible: devuelve un archivo) y recoge el precedente de las fotos.
- **Acceso**: la ruta entra en `e2e/acceso/rutas.ts` (EV-050) con su clave de ejemplo.

### D2. Origen y tipo en la clave (RF-287, RF-289)

Clave nueva: `becafe/AAAA/MM/becafe-<instante>__<origen>__<tipo>.tar.gz`, y `becafe/resguardos/AAAA/MM/…` para los resguardos.

- `<origen>` es el *hostname* de `ORIGIN` sin puerto, en minúsculas; `localhost` y `127.0.0.1` se guardan como `local`. `<tipo>` es `diaria`, `manual` o `resguardo`.
- `copias/dominio/clave-copia.ts` (puro, sin reloj): `construirClave({ instante, origen, tipo })` y `leerClave(clave)`. `leerClave` acepta también las claves antiguas (`becafe-<instante>.tar.gz`) y devuelve `origen: null`, `tipo` según el prefijo. Así XIV se cumple: las copias anteriores siguen válidas.
- `esquemaClaveCopia` ya admite `[\w/.-]`; el separador `__` y el *hostname* (letras, dígitos, `.` y `-`) caben sin cambios. El dominio se valida al construir la clave.
- **Origen del sistema**: `ambiente.copias.origen` se rellena en `arranque.ts` desde `configuracion.origen`. Una función `origenDeSistema(origen: string)` (pura) hace la conversión a `local` o *hostname*.
- **Lista**: `analizarListado` incluye `origen` y `tipo` en cada `CopiaBucket` leyéndolos con `leerClave`. La interfaz muestra «Local», el dominio o «Origen no registrado» desde `textos.copias`.
- **Alternativas descartadas**: (a) metadatos `x-amz-meta-*`: la lista S3 no los devuelve, harían falta hasta 30 `HEAD` por carga; (b) manifiesto dentro del `.tar.gz`: obliga a descargar para listar. Se podrá añadir un manifiesto después si hace falta más información del origen.

### D3. Copia manual (RF-286, RF-287, RF-288)

- `copia-diaria.ts` extrae su núcleo a `ejecutarCopia(dependencias, { tipo, origen, copiaId, actorId })`, que hace instantánea, empaquetado, subida, actualización de estado, aviso de fallo y eventos. `hacerCopiaDiaria` sigue siendo la tarea y llama a `ejecutarCopia` con `tipo: 'diaria'`.
- Nuevo `hacerCopiaManual(ambiente, actor)` en `copias/copia-manual.ts`:
  1. `exigirPermisoCopias`. Sin `s3`, `SIN_S3`.
  2. En **una transacción** busca una fila `en_curso`; si existe, `EN_CURSO` (409). Si no, inserta la fila con `tipo: 'manual'`. Como `better-sqlite3` es síncrono, la comprobación y el alta no se pisan entre peticiones.
  3. Llama a `ejecutarCopia`. Al terminar bien, anota la auditoría `copia.manual` con `actorId` y clave.
  4. Un fallo deja la fila `fallida` con su código y avisa a los administradores igual que la diaria (RF-142).
- **Migración `drizzle/0011_f17-tipo-copia.sql`**: `ALTER TABLE copia_seguridad ADD COLUMN tipo text NOT NULL DEFAULT 'diaria'` con `CHECK (tipo IN ('diaria','manual'))`. Solo avance.
- **Concurrencia con la diaria**: la tarea de las 03:00 no consulta la fila `en_curso`: usa su marca de ejecución diaria y sigue su camino, así que una copia manual en curso no puede impedirle hacer su copia del día. Dos copias distintas a la vez son seguras (cada una usa su carpeta temporal y su instantánea). Esto precisa la frase del apartado «Edge Cases» de la spec; ver «Cambios sobre la spec».
- **Pantalla**: la *action* `?/copiaManual` va en `+page.server.ts`. El botón «Hacer copia ahora» está en la sección de estado; abre una confirmación en la misma pantalla (`<details>` sin JavaScript, con `use:enhance` encima) con el texto del efecto. Sin S3 no se dibuja.
- **Etiqueta «Manual»**: sale de `leerClave(clave).tipo` en la lista del bucket y de `tipo` en la lista de estado.

### D4. Eventos de restauración y de copia (RF-291, RF-292, DEC-141)

- **Identificador de restauración**: `restauracionId = nuevoId()` al empezar `restaurarCopia`. Se añade a `esquemaPendiente` como campo opcional (`restauracionId`) para que `aplicar-restauracion.ts` lo recoja tras el reinicio. Una marca anterior sin el campo sigue siendo válida (XIV).
- **Catálogo** (`plataforma/registro.ts`, sin cambiar el significado de los códigos publicados; los antiguos se quedan y llevan ahora `restauracionId`):

| Código | Nivel | Campos |
| --- | --- | --- |
| `copia.restauracion_iniciada` | info | `restauracionId`, `origenCopia`, `origenSistema` |
| `copia.restauracion_resguardo_hecho` | info | `restauracionId`, `tamano`, `duracionMs` |
| `copia.restauracion_descargada` | info | `restauracionId`, `tamano`, `duracionMs` |
| `copia.restauracion_verificada` | info | `restauracionId`, `integridad`, `migracionesCopia`, `migracionesSistema`, `origenCopia`, `origenSistema` |
| `copia.restauracion_preparada` | info | añade `restauracionId` |
| `copia.restauracion_aplicada` | info | añade `restauracionId` |
| `copia.restauracion_fallida` | error | añade `restauracionId` y `paso` (`permiso`, `resguardo`, `descarga`, `suma`, `verificacion`, `preparacion`, `aplicar`) |
| `copia.manual_iniciada`, `copia.manual_rechazada` | info, info | `copiaId`, `usuarioId`; `codigo` |
| `copia.descarga_iniciada`, `copia.descarga_fallida` | info, error | `usuarioId`; `codigo` |

- `copia.completada` y `copia.fallida` añaden `tipo` y `origen`.
- Los campos nuevos se limitan a identificadores, códigos, recuentos, duraciones y tamaños (XVI). El `registrar` falso de las pruebas ya falla ante un campo no permitido.
- Cada `catch` de `restaurarCopia` pasa a registrar el `paso` donde falla, no solo el código. `verificarCopia` devuelve también `migracionesAplicadas`/`migracionesEsperadas` (ya lo hace), y `restaurarCopia` los emite.
- **Nivel `debug`**: además, cada paso emite a `debug` un evento `copia.restauracion_paso` con `paso` y `duracionMs`, para quien active `LOG_LEVEL=debug`.

### D5. Confirmación de restaurar con orígenes (RF-290)

- El `load` de `restaurar/[...clave]` lee `leerClave(clave).origen` y lo compara con `ambiente.copias.origen`. Devuelve `origenCopia`, `origenSistema` y `distinto`.
- La página los muestra siempre y, si difieren, un `Banner` de advertencia con icono y texto («Esta copia se hizo en Local; este sistema es …»). No bloquea el envío.

### D6. Textos y pantallas

- `textos.copias` gana: `descargar`, `hacerCopiaAhora`, `confirmarCopiaTitulo`, `confirmarCopiaTexto`, `copiaHecha`, `copiaEnCurso`, `etiquetaManual`, `origen(valor)`, `origenLocal`, `origenNoRegistrado`, `avisoOrigenDistinto` y los mensajes de error nuevos (`SIN_S3`, `NO_ENCONTRADA`, `EN_CURSO`).
- «Descargar» es un enlace (destino con `resolve`) con `download`; «Hacer copia ahora» es un botón (acción).

## Cambios sobre la spec

La spec decía, en «Edge Cases», que «la tarea diaria no se repite si ya hay una en curso». El plan la deja así: **la copia diaria no depende de la manual** (D3). Solo la manual se rechaza si hay una `en_curso`. Es una precisión que evita que una copia manual impida la diaria del día. Requiere que apruebes este plan con ese cambio.

## Impacto

- **Documentos**: `ARCHITECTURE.md` (§2 ubicación de la clave y la descarga, §3 `copias`, §9 eventos nuevos), `docs/pruebas.md`, ADR 0007, `historias.md` (CAMBIO-029, con respaldo) y `e2e/acceso/rutas.ts`.
- **Migración**: `0011_f17-tipo-copia.sql`.
- **Código**: `copias/` (clave, descarga, copia manual, eventos), `plataforma/registro.ts`, `plataforma/ambiente.ts`, `arranque.ts`, `usuarios/auditoria.ts` (acciones `copia.descargada` y `copia.manual`), la pantalla `/admin/copias`, `textos.ts` y la nueva ruta de descarga.

## Pruebas

- **Unitarias y propiedades**: `clave-copia` (ida y vuelta con `fast-check`, claves antiguas, *hostname* inválido), `origenDeSistema`.
- **Integración con SQLite y bucket falso**: descarga (íntegra, 404, clave inválida, sin permiso, auditoría), copia manual (sube, aparece como manual, dos a la vez, fallo, sin S3), eventos de restauración con fallo inyectado por paso (EV-117, ampliando EV-113) y marca antigua sin `restauracionId`.
- **Acción**: `page.server.test.ts` de `copias` para `?/copiaManual` y la descarga con evento falso.
- **E2E**: `acceso` para la ruta nueva; `flujos/copias-f17` (botón, confirmación, etiqueta «Manual», enlace «Descargar»); `sin-js` del botón; axe en claro y oscuro.
- **Trazabilidad**: CA-284 a CA-292 y EV-117 en descripciones de prueba.

## Riesgos y lo que no se puede verificar

- Un bucket real (Backblaze, S3) puede devolver cabeceras distintas del bucket falso: se verifica con la primera copia manual en producción.
- Un archivo muy grande en el flujo de descarga no se prueba por encima de unos MB.
- TalkBack y VoiceOver sobre la pantalla nueva quedan para revisión manual (constitución XI).

## Modificación 2026-10-27: listado único y retirada de las pruebas de restauración (CAMBIO-030)

Constitución 1.10.0. Problema concreto (II): tres listados de las mismas copias y una sección sin uso mezclan la pantalla; se resuelve quitando código, sin capas nuevas.

### M1. Listado unificado (RF-253)

- Dominio puro `copias/dominio/listado.ts`: `unificarCopias({ bucket, locales, pagina })` devuelve `{ filas, pagina, paginas, total }`. Une las copias del bucket con las locales de estado `fallida`, ordena por instante descendente, recorta a `LIMITE_COPIAS_PANEL` (30) y pagina de 8 en 8 (`COPIAS_POR_PAGINA`). La página fuera de rango se acota. Sin reloj ni acceso a datos.
- Una copia local `correcta` no sale: ya está en el bucket, que es la lista restaurable. Una `en_curso` tampoco.
- Fila: `{ clave: string | null, instante, tamano: number | null, tipo: 'diaria' | 'manual', resguardo, origen, fallida, codigoError }`. Con `clave === null` no hay botones.
- `leerCopias` sigue siendo la consulta de las copias locales. El `load` llama a `unificarCopias` y devuelve las filas ya paginadas.

### M2. Paginación

`?pagina=N` se valida con `z.strictObject({ pagina: z.coerce.number().int().positive().optional() })`. La navegación es un `<form method="get">` con el componente `Paginacion` existente. Funciona sin JavaScript (XVII).

### M3. Pantalla en dos columnas (RF-275, RF-261)

- `DosColumnas`: en `acciones`, los avisos, «Hacer copia ahora» (`SeccionCopias` tono `estado`) y una nota de qué hace restaurar. En `listado`, las filas.
- `CopiaBucketFila` pasa a `CopiaFila`: fecha, tamaño, etiquetas, origen y los botones «Descargar» y «Restaurar» (enlaces, 44 px). Sin «Origen: Origen no registrado»: se muestra «Origen no registrado» una sola vez.
- La zona de advertencia (`tono="restaurar"`) pasa a la pantalla `restaurar/[...clave]`.
- Se eliminan las secciones «Copias en el bucket», «Restaurar una copia», «Anotar una prueba» y «Pruebas anotadas».

### M4. Retirada de las pruebas de restauración

- Se borran `pruebas-restauracion.ts` y su test, la *action* `anotarPrueba`, `leerPruebas`, `leerEstadoRestauracion`, `esquemaAnotarPrueba`, `DIAS_SIN_PROBAR` y `diasEntre`, el aviso del panel `/admin` (`avisoRestauracion`) y sus textos.
- `exigirPermisoCopias` (la única pieza que se conserva) pasa a `copias/permiso.ts`.
- Migración `0012` de solo avance: `DROP TABLE prueba_restauracion`, generada con `drizzle-kit`. Se retira la tabla de `esquema.ts` y de las exportaciones.

### M5. Documentos y pruebas

- `ARCHITECTURE.md` (módulo `copias`, tabla y pantalla), `docs/pruebas.md`, `docs/operacion.md` y `docs/diseno/screen-layouts.md`.
- Pruebas: unitarias y de propiedades de `unificarCopias` (orden, tope de 30, 8 por página, página acotada, fallidas sin clave); integración sin la tabla (migración aplica); acción `copiaManual` sin cambios; E2E de `admin-copias` (listado único, «Descargar» y «Restaurar» en cada fila, paginación, «Fallida»), `sin-js` de la paginación, axe en claro y oscuro y dos columnas a 1024 px. Se retiran los E2E de anotar prueba y del aviso de 100 días.
- Trazabilidad: CA-143, CA-253 y CA-275 en las descripciones.

### Riesgos

- El orden mezclado entre el instante del bucket (`modificadaEn`) y el de una copia local fallida (`iniciadaEn`) puede diferir en segundos: es aceptable y no cambia el reparto de páginas relevante.
- Una página guardada en un marcador que ya no existe se acota a la última, sin error.
