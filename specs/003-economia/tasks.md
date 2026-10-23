# Tareas: Economía: aportaciones, compras, arqueos, recuentos y bajas (F4)

**Entrada**: [plan.md](plan.md) (aprobado el 2026-10-22), [spec.md](spec.md) (Clarifications 1 a 14), [data-model.md](data-model.md), [contracts/rutas.md](contracts/rutas.md), [quickstart.md](quickstart.md).

**Pruebas**: obligatorias (constitución VIII, AGENTS.md §7). Cada CA o EV del alcance tiene al menos una prueba que lo nombra en su descripción (`it('CA-041: …')`). Escribe la prueba antes o justo después del código: todo F4 toca dinero.

**Reglas para quien implementa** (leer antes de empezar):

- Lee `AGENTS.md` §5 a §8 y `ARCHITECTURE.md` §3, §4, §6 y §9. Importa los módulos solo desde su `index.ts` con `#lib/server/<modulo>`.
- Importes en céntimos (`INTEGER`); coste medio en diezmilésimas. Nunca `number` con decimales.
- Nada de `as` (salvo `as const`), `any`, `!`, `@ts-ignore`, `eslint-disable`, `console.*`, `$lib`, `new Date()` ni `Math.random()` en `dominio/`.
- Toda escritura económica va en una sola llamada a `enTransaccion` (`BEGIN IMMEDIATE`), sin `await` dentro.
- Los registros económicos y los movimientos no se borran ni cambian de importe: se anulan.
- Al cerrar cada lote: `npm run test:changed`, `npm run lint:changed` y `npm run check` (nunca a la vez lint y pruebas). `npm run verify` si cambias esquema, migración, contrato o `plataforma/`. Anota cada ejecución en `.local/verification/runs.jsonl` (`docs/pruebas.md` §17).
- Cada página nueva implementa los cuatro estados de «Estados comunes» de `contracts/rutas.md`: vacío, cargando (`Skeleton`), error («No se ha podido cargar. Vuelve a intentarlo.») y sin conexión. Sin conexión, los formularios de aportación, compra y administración se desactivan con el texto de EXC-007 (constitución X; spec, Edge Cases).
- Cada acción que registra o anula algo (aportación, compra, anulación, arqueo, recuento, baja) confirma su resultado con un mensaje en una región viva (`aria-live`), sin mover el foco y con el texto en `textos.ts` (constitución X y XI). Si la acción redirige, el mensaje se muestra en la página de destino.
- Marca cada tarea con `[X]` al terminarla.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes).
- **[USn]**: historia de usuario de la spec.

---

## Fase 1: Preparación

**Objetivo**: azar inyectable y herramienta de mutación (lote F4-L0).

- [X] T001 Crear `src/lib/server/plataforma/azar.ts` con `export type Azar = { entero(maximoExclusivo: number): number }`, `azarReal` (usa `crypto.randomInt` de `node:crypto`) y `crearAzarFijo(valores: number[])` (devuelve los valores en orden y lanza un error si se agotan). Exportar los tres desde `src/lib/server/plataforma/index.ts`. Prueba en `src/lib/server/plataforma/azar.test.ts` (rango, azar fijo en orden, error al agotarse).
- [X] T002 Añadir `azar: Azar` al tipo `Ambiente` en `src/lib/server/plataforma/ambiente.ts`; pasar `azarReal` en la composición (`src/lib/server/arranque.ts` o `src/hooks.server.ts`, donde se construye `Ambiente`) y `crearAzarFijo([])` por defecto en `src/lib/server/plataforma/pruebas/entorno-prueba.ts` (con opción para pasar otro azar).
- [X] T003 Instalar StrykerJS 10 como dependencia de desarrollo (`npm install -D @stryker-mutator/core@10 @stryker-mutator/vitest-runner@10`), crear `stryker.config.mjs` que mute solo `src/lib/server/**/dominio/**/*.ts` (sin `*.test.ts`) con el proyecto Vitest `servidor`, sin umbral (`thresholds.break: null`), informes en `reports/mutation/` (añadir `reports/` a `.gitignore` si no está). Añadir el script `"test:mutacion": "stryker run"` en `package.json`. No añadirlo a `verify` (plan, Riesgos).
- [X] T004 Añadir `azar.ts` a la tabla de §11 de `ARCHITECTURE.md` («`crypto.randomInt` solo en `plataforma/azar.ts`») y ejecutar `npm run verify` (cambia `plataforma/`).

---

## Fase 2: Fundamentos (bloquea todas las historias)

**Objetivo**: dominio puro, esquema, migración, libro de movimientos, contratos y errores (lotes F4-L1 y F4-L2).

### Dominio puro

- [X] T005 [P] Crear `src/lib/server/economia/dominio/redondeo.ts` con `dividirRedondeando(numerador: number, denominador: number): number` (división entera con mitad hacia arriba para valores positivos y simétrica para negativos; Clarifications 8). Pruebas con ejemplos en `redondeo.test.ts` (0,5 sube; 0,49 baja; negativos).
- [X] T006 [P] Crear `src/lib/server/economia/dominio/coste-medio.ts` con:
  - `costeTrasCompra(stock, costeMedio: number | null, cantidad, importeCentimos): number`: con `stock > 0` y `costeMedio !== null`, `(stock × coste + importe × 100) ÷ (stock + cantidad)` (RN-003); con `stock ≤ 0` o sin coste, `importe × 100 ÷ cantidad` (RN-004). Resultado en diezmilésimas con `dividirRedondeando`.
  - `precioDeConsumo(costeMedio: number): number`: céntimos, `dividirRedondeando(costeMedio, 100)` (RN-021).
  - `valorFaltante(faltante: number, costeMedio: number | null): number`: 0 si `costeMedio === null` (Clarifications 6); si no, `dividirRedondeando(faltante × costeMedio, 100)`.
  - `reconstruir(historia: HechoTipo[]): { stock: number; costeMedio: number | null; costePorConsumo: Map<string, number | null> }` con `HechoTipo` = unión discriminada `compra` (`id`, `instante`, `cantidad`, `importe`), `consumo` (`id`, `instante`), `anulacionConsumo` (`consumoId`, `instante`), `recuento` (`lineaId`, `instante`, `diferencia`), `anulacionRecuento` (`lineaId`, `instante`, `diferencia`). Ordena por instante y reproduce: compra → `costeTrasCompra` y `stock += cantidad`; consumo → anota el coste vigente en `costePorConsumo` y `stock -= 1`; anulación de consumo → `stock += 1`; recuento → `stock += diferencia`; anulación de recuento → `stock -= diferencia`. Las compras anuladas no se pasan a la función (Clarifications 9). Sin reloj ni azar.
- [X] T007 [P] Pruebas de ejemplo en `src/lib/server/economia/dominio/coste-medio.test.ts`: `CA-041` (stock 10 a 4000 + 50 por 1700 → 60 a 3500; stock −2 → 48 a 3400), RN-004 sin coste, `precioDeConsumo` con 3500 → 35 y 3550 → 36 (RN-021), `valorFaltante` (6 × 4000 → 240; sin coste → 0). Con `reconstruir`: `RN-005` (un consumo con stock 0 deja el stock en −1 y anota el coste vigente), `RN-002` (el coste anotado para un consumo es el vigente en su instante; una compra posterior no lo cambia) y `RN-013` (una `anulacionConsumo` solo devuelve una unidad de stock y no cambia el coste medio).
- [X] T008 [P] Pruebas de propiedades con `fast-check` en el mismo archivo: `EV-030/INV-02` (para una secuencia aleatoria de compras, consumos, recuentos y anulaciones, el estado incremental aplicado paso a paso con `costeTrasCompra` y las variaciones de stock coincide con `reconstruir`), y `EV-031` (anular una compra y reconstruir sin ella da el coste que debió aplicarse a cada consumo posterior, también con stock negativo intermedio). La parte concurrente de EV-030 (anular una compra mientras se registra un consumo del mismo tipo) necesita el registro de consumos y se prueba en F3 (`specs/004-consumos/tasks.md`, T018); indícalo en el informe de cierre de F4.
- [X] T009 [P] Crear `src/lib/server/economia/dominio/repartos.ts` con `repartir(importe: number, miembros: string[], azar: Azar): { usuarioId: string; importe: number }[]`: `base = trunc(|importe| ÷ n)`, `resto = |importe| mod n`; elige `resto` miembros distintos con `azar.entero` (selección sin reemplazo) que reciben un céntimo más; aplica el signo de `importe` a todos; con importe 0 devuelve `[]`; con `miembros` vacío lanza error. `Azar` se importa como tipo de `#lib/server/plataforma`.
- [X] T010 [P] Pruebas en `src/lib/server/economia/dominio/repartos.test.ts`: ejemplo `CA-081` (−700 entre 6 → cuatro de −117 y dos de −116), y propiedades `EV-020/INV-01` (suma exacta, diferencia máxima de 1 céntimo, un miembro recibe todo, mismo resultado con el mismo azar fijo).
- [X] T011 Ejecutar `npm run test:mutacion` y anotar la línea base (puntuación por archivo) en `docs/pruebas.md` (sección de mutación) sin fijar umbral. Pendiente: Stryker no elimina mutantes (ver `docs/pruebas.md` §15).
  - Hecho (23-10-2026): 130 mutantes, 1 eliminado, 124 sobrevivientes, 5 sin cobertura, puntuación 0,77 %. Anotado en `docs/pruebas.md` §15 sin umbral; el runner sigue siendo el problema.

### Esquema y migración

- [X] T012 Añadir a `src/lib/server/economia/esquema.ts` las tablas de `data-model.md` con sus columnas, `CHECK`, `UNIQUE` e índices exactamente como allí: `aportacion` (`importe > 0 AND (importe <= 50000 OR origen = 'baja')`, `origen` en `directa`/`baja`), `compra`, `linea_compra` (`cantidad > 0`, `importe > 0`, `UNIQUE (compra_id, tipo_capsula_id)`), `consumo` (`precio_aplicado >= 0`, índice `(tipo_capsula_id, hora_registro)`), `movimiento` (`cuenta` en `persona`/`hucha`, `CHECK ((cuenta = 'persona') = (usuario_id IS NOT NULL))`, `importe <> 0`, `tipo` en los 12 tipos de plan D1, índices `(usuario_id, vigente)`, `(cuenta, vigente)`, `(origen_tipo, origen_id)`), `reparto` (`importe <> 0`, `miembros > 0`), `regularizacion` (`importe <> 0`, `UNIQUE (compra_id, consumo_id)`), `arqueo` (`contado >= 0`, `CHECK (diferencia = contado - saldo_teorico)`), `recuento`, `linea_recuento` (`contado >= 0`, `CHECK (diferencia = contado - registrado)`, `UNIQUE (recuento_id, tipo_capsula_id)`, índice `(tipo_capsula_id, estado)`), `aviso_economia` (`tipo` en `hucha_negativa`/`stock_negativo`). Los cinco registros con anulación llevan el `CHECK` de campos de anulación de `data-model.md`. Claves externas de usuario a `usuario.id` (importada de `#lib/server/usuarios`).
- [X] T013 Añadir `sesion_cerrada_por_baja` (`id_hash` clave primaria, `usuario_id` con índice, `cerrada_en`) en `src/lib/server/auth/esquema.ts`.
- [X] T014 Generar la migración con `npm run db:generate`, renombrarla a `drizzle/0002_f4-economia.sql` (y su entrada en `drizzle/meta/_journal.json`), y revisar que solo contiene `CREATE TABLE` y `CREATE INDEX` (constitución XIV). Comprobar que `drizzle.config.ts` incluye los esquemas nuevos.
- [X] T015 Crear constructores de pruebas en `src/lib/server/economia/pruebas/constructores.ts`: `prepararMiembros(db, n, opciones)`, `prepararTipo(db, { stock, costeMedio })`, `prepararConsumo(db, { usuarioId, tipoCapsulaId, precioAplicado, costeMedioAplicado, horaRegistro })` (inserta `consumo` y su movimiento `cargo_consumo`), `prepararAportacion`, `prepararCompra`. Sin `as`.
- [X] T016 Ampliar `hayRegistrosDeTipo` (usado por el borrado de tipos de F2, plan F2 D8) para que consulte `consumo`, `linea_compra` y `linea_recuento`. Prueba `CA-006 con registro` en `src/lib/server/economia/capsulas.test.ts` (T-F2-14): un tipo con un consumo preparado no se puede borrar. Marcar T-F2-14 como hecha en `specs/002-catalogo-stock/tasks.md` si pasa.
- [X] T017 Ejecutar `npm run verify` (esquema y migración nuevos).

### Libro de movimientos, contratos y errores

- [X] T018 Crear `src/lib/server/economia/libro.ts` (interno, no se exporta desde `index.ts`): `anotarMovimientos(tx, movimientos[])` (inserta con `vigente = 1`, rechaza importe 0), `anularMovimientosDe(tx, origenTipo, origenId)` (`UPDATE … SET vigente = 0 WHERE … AND vigente = 1`), `saldoPersona(db, usuarioId)` y `saldoHucha(db)` (`SUM(importe)` de movimientos vigentes; 0 si no hay). Pruebas en `libro.test.ts` (`RN-010`, `RN-011`, `INV-05`: un movimiento anulado no vuelve a 1).
- [X] T019 [P] Añadir a `src/lib/server/plataforma/errores.ts` los códigos `CONFIRMACION_REQUERIDA`, `NO_ES_EL_ULTIMO`, `CAMBIO_CONCURRENTE` (409) y `TIPO_NO_DISPONIBLE` (400) con su estado HTTP en `errores-http.ts`, y sus mensajes en `src/lib/shared/textos.ts` (plan D13). Ajustar las pruebas de catálogo de errores existentes.
- [X] T020 [P] Añadir a `src/lib/server/plataforma/registro.ts` los eventos `registro.duplicado` (info: `tipo`, `id`), `regularizacion.aplicada` (info: `compraId`, `consumos`), `hucha.negativa_registrada` (info: `origenTipo`, `origenId`) y el campo `modo` en `usuario.baja` (plan D14). Ningún campo con importes, nombres ni motivos.
- [X] T021 [P] Crear `src/lib/shared/contratos/economia.ts` con los esquemas de `contracts/rutas.md` §Esquemas: `esquemaImporte` (texto → céntimos con `parseMoney` de `#lib/shared/dinero`; rechaza más de dos decimales y no numéricos), `esquemaAportacion` (`clienteId` ULID, `importe` de 1 a 50 000), `esquemaLineaCompra`, `esquemaCompra` (`lineas` normalizadas desde `tipo[]`, `cantidad[]`, `importe[]` con 1 o más líneas; `foto` opcional; `confirmoHuchaNegativa` opcional), `esquemaAnulacion` (`motivo` recortado, 1 a 200), `esquemaArqueo`, `esquemaRecuento`, `esquemaBaja` (`modo` en `ninguna`, `pago`, `devolucion`, `incobrable`). Todos con `z.strictObject`; `contrasenaActual` y `foto` marcados como secretos para `fallo()`. Pruebas en `economia.test.ts` (`CA-031`: 0, −3 y 500,01 € rechazados; 500,00 € aceptado; tres decimales rechazados).

**Punto de control**: dominio con propiedades en verde, migración aplicada, `verify` en verde.

---

## Fase 3: US1 — Aportar dinero a la hucha (P1) 🎯 MVP

**Objetivo**: una persona aporta dinero a su nombre y ve su saldo y la hucha teórica.

**Prueba independiente**: Luis con −4,00 € aporta 5,00 € → saldo +1,00 €, hucha +5,00 €.

- [X] T022 [US1] Pruebas primero en `src/lib/server/economia/aportaciones.test.ts`: `CA-030` (−4,00 + 5,00 → +1,00; hucha 10,00 → 15,00), `RF-046` (mismo `clienteId` dos veces → una aportación y evento `registro.duplicado`), `RN-034` (la entrada no admite otro `usuarioId`), `RNF-010` (fallo provocado tras el primer movimiento → nada guardado).
- [X] T023 [US1] Implementar `registrarAportacion(ambiente, actor, { clienteId, importe })` en `src/lib/server/economia/aportaciones.ts`: exige sesión; en una transacción busca por `cliente_id` y devuelve el original con `duplicado: true`; si no, inserta `aportacion` (`origen = 'directa'`, `usuario_id = registrada_por = actor.usuarioId`) y dos movimientos: `abono_aportacion` (persona, `+importe`) y `hucha_aportacion` (hucha, `+importe`). Evento `aportacion.registrada`.
- [X] T024 [US1] Implementar consultas en `src/lib/server/economia/saldos.ts`: `leerSaldoPropio(db, actor)`, `leerSaldoHucha(db, actor)` (con el último arqueo vigente: fecha y contado), `leerAportacionesPropias(db, actor, limite)`, `leerAportacion(db, actor, id)` (404 con `RecursoNoEncontrado`). Exportar desde `index.ts`.
- [X] T025 [US1] Ruta `src/routes/(app)/saldos/+page.server.ts`: `load` con las consultas de T024 y un `clienteId` nuevo (`nuevoId()`); *action* `aportar` que valida con `esquemaAportacion`, llama a `registrarAportacion` y traduce errores con `fallo()`. Tipos de `./$types`.
- [X] T026 [US1] Página `src/routes/(app)/saldos/+page.svelte`: saldo propio (`Money` con signo y texto «a favor»/«debes»), tarjeta de la hucha con el último arqueo, formulario `<form method="post" action="?/aportar" use:enhance>` con `MoneyField` y `clienteId` oculto, mensaje «Aportación registrada» en región viva, lista de aportaciones propias con enlace a su detalle, estado vacío «Todavía no has registrado aportaciones». Textos en `textos.ts`.
- [X] T027 [US1] Prueba de la *action* con evento falso en `src/routes/(app)/saldos/page.server.test.ts` (éxito, `CA-031` importe no válido con `errores.importe`, duplicado).

**Punto de control**: aportaciones y saldos funcionan sin JavaScript.

---

## Fase 4: US2 — Registrar una compra de cápsulas (P1)

**Objetivo**: compra con varias líneas, coste medio, foto y confirmación de hucha negativa.

**Prueba independiente**: CA-040 a CA-043 en integración y en E2E.

- [X] T028 [US2] Pruebas primero en `src/lib/server/economia/compras.test.ts`: `CA-040` (dos líneas → total 2400), `CA-041` (coste y stock por línea, también con stock −2), `CA-042` (autor Marta, su saldo no cambia, `RN-009`), `RN-002` y `RN-001` con consumos preparados (una compra posterior no cambia el `precio_aplicado` ni el cargo de los consumos anteriores, que siguen a cargo de quien consumió), `CA-043` (hucha 1200 y compra 2000 sin confirmar → `CONFIRMACION_REQUERIDA` con `saldoTeorico`; confirmada → hucha −800 y una fila `aviso_economia` `hucha_negativa`), `RF-046` (reenvío), `TIPO_NO_DISPONIBLE` (tipo retirado o inexistente), `RNF-010` (fallo a mitad → ni compra, ni stock, ni foto).
- [X] T029 [US2] Implementar `registrarCompra(ambiente, actor, { clienteId, lineas, foto?, confirmoHuchaNegativa })` en `src/lib/server/economia/compras.ts`: procesa la foto (5 MB como máximo y las validaciones de RF-005) con `procesarFoto` y la guarda con `guardarFoto` **antes** de la transacción (borrarla con `borrarFoto` si la transacción falla, patrón de F2); en la transacción: duplicado por `cliente_id`; comprueba tipos activos (`TIPO_NO_DISPONIBLE`); total = suma de líneas; si `saldoHucha − total < 0` y no hay confirmación → `CONFIRMACION_REQUERIDA` con el saldo; inserta `compra` y `linea_compra`; por línea, `costeTrasCompra` con la existencia actual, nuevo stock con `fijarStock` (transición de stock bajo de F2) y nuevo `coste_medio`; movimiento `hucha_compra` (−total); si la hucha queda negativa, fila `aviso_economia` y evento `hucha.negativa_registrada`. Evento `compra.registrada`.
- [X] T030 [US2] Consultas `leerComprasRecientes(db, actor, limite)`, `leerTiposComprables(db, actor)` y `leerCompra(db, actor, id)` (con líneas, autor, foto, estado y regularizaciones si está anulada) en `src/lib/server/economia/compras.ts`; `leerFotoTicket(ambiente, actor, id)`. Exportar desde `index.ts`.
- [X] T031 [US2] Ruta `src/routes/(app)/compras/+page.server.ts`: `load` (compras, tipos, hucha, `clienteId`); *actions* `registrar` (multipart, `esquemaCompra`; éxito → `redirect(303, resolve('/compras/[compraId]', …))`; `CONFIRMACION_REQUERIDA` → `fail(409, { codigo, saldoTeorico, valores })`), `anadirLinea` y `quitarLinea` (devuelven `valores` con una línea más o menos, sin escribir nada).
- [X] T032 [US2] Componente `src/routes/(app)/compras/FormularioCompra.svelte` y página `+page.svelte`: líneas con `SelectField` de tipo, cantidad y `MoneyField`; con una línea un solo importe, con varias el total calculado (`$derived`, CA-040); «Añadir línea» como botón de envío a `?/anadirLinea` (con JavaScript, añade la línea en el cliente sin enviar); `PhotoField` opcional; con JavaScript, `ConfirmDialog` «La hucha debería tener X €» si el total supera el saldo teórico del `load`; sin JavaScript, la respuesta 409 muestra la confirmación con «Registrar igualmente» y el aviso de volver a adjuntar la foto. Lista de compras recientes con autor; vacío «Todavía no hay compras». Desviación aprobada: formulario en la página, sin `FormularioCompra.svelte` ni `ConfirmDialog`.
- [X] T033 [P] [US2] Ruta `src/routes/fotos/compras/[compraId=ulid]/+server.ts` (GET): `leerFotoTicket`; 404 sin foto; `image/webp`; `cache-control: private, max-age=3600`.
- [X] T034 [US2] Prueba de componente `src/routes/(app)/compras/FormularioCompra.test.ts` (Vitest Browser Mode): una línea muestra un importe; dos líneas muestran el total; quitar línea recalcula. **No aplica** (decisión aprobada): el formulario de compra se queda en la página; no hay `FormularioCompra.svelte`.
- [X] T035 [US2] Pruebas de *actions* con evento falso en `src/routes/(app)/compras/page.server.test.ts` (éxito con redirección, error por línea `lineas.1.cantidad`, 409 con `saldoTeorico`, `anadirLinea`).

---

## Fase 5: US3 — Corregir aportaciones y compras con anulaciones (P1)

**Objetivo**: anulación con permisos y plazo; regularización al anular compras.

**Prueba independiente**: CA-045 y EV-090 con consumos preparados.

- [X] T036 [US3] Pruebas primero en `src/lib/server/economia/anulaciones.test.ts`: `CA-060` (aportación propia a los 10 min con plazo 15 → anulada; saldo y hucha la descuentan), `CA-061` (administrador a los 3 días), `CA-062` (compra propia a los 20 min → `FUERA_DE_PLAZO`; ajena por un miembro → `SIN_PERMISO`), `EV-011/INV-05` (segunda anulación → `YA_ANULADO`), aportación de una persona dada de baja → `ESTADO_INCORRECTO` (Clarifications 10).
- [X] T037 [US3] Prueba de concurrencia `EV-011` en `src/lib/server/economia/anulaciones-concurrencia.test.ts` siguiendo el patrón de `src/lib/server/economia/concurrencia.test.ts` (dos `worker_threads`, `busy_timeout` 5000, `Atomics`): dos anulaciones a la vez de la misma aportación → una cambia la fila, la otra no; el registro queda anulado una vez y sus movimientos con `vigente = 0`.
- [X] T038 [US3] Implementar `src/lib/server/economia/anulaciones.ts`: `comprobarPermisoAnulacion(actor, autorId, registradaEn, plazoMin, ahora)` (autor si `registradaEn + plazo ≥ ahora`; administrador siempre; si no, `FUERA_DE_PLAZO` o `SIN_PERMISO`); `anularAportacion(ambiente, actor, id, motivo)` con `UPDATE … WHERE id = ? AND estado = 'vigente'` (0 filas → `YA_ANULADO`) y `anularMovimientosDe`. Evento `anulacion.registrada`. Sin reautenticación (Clarifications 13).
- [X] T039 [US3] Pruebas primero de la regularización en `src/lib/server/economia/compras-anulacion.test.ts`: `CA-045` (compra errónea a 36 000, tres consumos a 360 céntimos, anulación → coste 4000 y tres regularizaciones de +320; cargos originales intactos), `EV-090/RN-037` (dos líneas, cada tipo regularizado por separado), Clarifications 5 (sin compra vigente anterior → precio de la siguiente compra; sin ninguna → sin regularización y `coste_medio` nulo), Clarifications 10 (consumo de una persona de baja → sin regularización), `invariante.violada` (stock reconstruido distinto del guardado → la transacción se deshace).
- [X] T040 [US3] Implementar `anularCompra(ambiente, actor, id, motivo)` en `src/lib/server/economia/compras.ts`: permiso (T038); en la transacción: `UPDATE` condicionado; `anularMovimientosDe('compra', id)`; por cada línea: `stock -= cantidad` con `fijarStock`; historia del tipo sin la compra anulada → `reconstruir`; si `reconstruir().stock` ≠ stock guardado → evento `invariante.violada` y error (deshace); nuevo `coste_medio` (nulo sin compras vigentes); por cada consumo vigente posterior con `precio debido ≠ precio_aplicado` y persona activa: fila `regularizacion` y movimiento `regularizacion` (`importe = precio_aplicado − precio debido`). Devuelve el resumen agrupado por persona. Evento `regularizacion.aplicada`.
- [X] T041 [US3] Rutas de detalle: `src/routes/(app)/saldos/aportaciones/[aportacionId=ulid]/+page.server.ts` y `+page.svelte` (detalle y *action* `anular` con `esquemaAnulacion`); `src/routes/(app)/compras/[compraId=ulid]/+page.server.ts` y `+page.svelte` (líneas, autor, foto, estado, *action* `anular`; tras anular, `RegularizationSummary` agrupado por persona). `VoidDialog` con JavaScript; sin JavaScript, formulario con motivo en la página. Mensajes «Pídelo a un administrador» para `FUERA_DE_PLAZO` y `SIN_PERMISO`.
- [X] T042 [US3] Pruebas de *actions* con evento falso en los dos `page.server.test.ts` de T041 (éxito, `FUERA_DE_PLAZO`, `YA_ANULADO`, motivo vacío).

---

## Fase 6: US4 — Arqueo de la hucha y recuento de stock (P1)

**Objetivo**: pantalla de control con vista previa, reparto exacto y anulación del último.

**Prueba independiente**: CA-080, CA-081, CA-090 a CA-093 y CA-064.

- [X] T043 [US4] Pruebas primero en `src/lib/server/economia/control.test.ts`: `CA-080` (teórico 4200, contado 3500 → diferencia −700), `CA-081` (6 miembros, azar fijo → cuatro −117 y dos −116, hucha 3500 tras confirmar), `CA-090/CA-091` (stock 30, coste 4000, contado 24 → stock 24, reparto de −240), `CA-092` (20 → 23 sin movimientos, coste igual), Clarifications 6 (faltante sin coste → 0 € sin reparto), `CA-093` (arqueo y recuento independientes), `CA-064/EV-080` (A1 tras A2 → `NO_ES_EL_ULTIMO`; anular A2 revierte su ajuste y sus cargos; tras anular A2, A1 se puede anular, Clarifications 11; R1 de Ristretto tras R2 → `NO_ES_EL_ULTIMO`), `CAMBIO_CONCURRENTE` (teórico distinto del previsto en el arqueo; stock registrado distinto del previsto en el recuento), reautenticación también al anular un arqueo o una línea de recuento, `CA-138` (reautenticación hace 16 min → `REAUTENTICACION_REQUERIDA`; hace 15 → pasa), miembros activos de cualquier rol.
- [X] T044 [US4] Implementar `src/lib/server/economia/control.ts`: `leerControl(db, actor)`; `previsualizarArqueo(db, actor, contado)` y `previsualizarRecuento(db, actor, lineas)` (sin escribir: diferencia, número de miembros, parte mínima y máxima); `confirmarArqueo(ambiente, actor, { contado, saldoTeoricoPrevisto })` (exige administrador y `auth.exigirReautenticacion` antes de la transacción; en la transacción: teórico actual ≠ previsto → `CAMBIO_CONCURRENTE`; inserta `arqueo`; si diferencia ≠ 0, movimiento `hucha_ajuste_arqueo` y reparto con `repartir` → fila `reparto` y movimientos `reparto_arqueo` con `origen_tipo = 'reparto'`); `confirmarRecuento(ambiente, actor, { lineas, registradoPrevisto })` (reautenticación antes de la transacción; en la transacción, si el stock de algún tipo ≠ su `registradoPrevisto` → `CAMBIO_CONCURRENTE`; una `linea_recuento` por tipo; faltante → `stock -= F` y reparto de `-valorFaltante` con `reparto_recuento`; sobrante → `stock += S`; un reparto por línea); `anularArqueo` y `anularLineaRecuento` (exigen administrador y `auth.exigirReautenticacion` antes de la transacción, plan D8; solo el último vigente; revierten movimientos del ajuste y del reparto; el recuento devuelve el stock con `stock -= diferencia` sin tocar el coste). Eventos `arqueo.registrado`, `recuento.registrado`, `reparto.aplicado`, `anulacion.registrada`.
- [X] T045 [US4] Ruta `src/routes/(app)/admin/control/+page.server.ts` con las *actions* de `contracts/rutas.md` (`previsualizarArqueo`, `confirmarArqueo`, `previsualizarRecuento`, `confirmarRecuento`, `anularArqueo`, `anularRecuento`); `REAUTENTICACION_REQUERIDA` devuelve `fail` que muestra el campo de contraseña; `contrasenaActual` nunca vuelve en `valores`.
- [X] T046 [US4] Página `src/routes/(app)/admin/control/+page.svelte`: `SegmentedControl` Arqueo / Recuento (enlaces con `?vista=`, funciona sin JavaScript); paso de vista previa con el efecto (diferencia, personas, importes mínimo y máximo) y botón de confirmación; `ReauthDialog` con JavaScript; últimos registros con su botón de anulación solo en el último vigente; vacíos «Todavía no hay arqueos» / «Todavía no hay recuentos». Enlace desde `/admin`. Desviación aprobada: secciones sin `SegmentedControl`; enlace desde `/admin`.
- [X] T047 [US4] Prueba de *actions* con evento falso en `src/routes/(app)/admin/control/page.server.test.ts` (vista previa sin escritura, 409 `CAMBIO_CONCURRENTE`, reautenticación, miembro → 403).

---

## Fase 7: US5 — Dar de baja a una persona con liquidación (P2)

**Objetivo**: asistente de baja con los cuatro modos, sesiones cerradas y auditoría.

**Prueba independiente**: CA-135 en sus variantes y EV-040.

- [X] T048 [US5] Pruebas primero en `src/lib/server/usuarios/baja.test.ts` y `src/lib/server/economia/baja.test.ts`: `CA-135` incobrable (−600 → saldo 0, reparto de −600 entre los demás activos, sesiones borradas y guardadas en `sesion_cerrada_por_baja`), devolución (+1000 → hucha −1000), devolución con hucha 600 sin confirmar → `CONFIRMACION_REQUERIDA`, confirmada → hucha −400 y `aviso_economia`, pago (−600 → aportación `origen = 'baja'` registrada por el administrador → saldo 0; Clarifications 14: no se combina con incobrable), saldo 0 sin movimientos, `INV-06` (saldo 0 al final), `EV-040/INV-03` (último administrador → `ULTIMO_ADMIN`; baja y cambio de rol simultáneos con `worker_threads` nunca dejan 0 administradores), `RF-139c` (auditoría con autor y fecha), `CA-136` con movimientos (reactivada → saldo 0 y `sesion_cerrada_por_baja` vacía), `CA-138`. Ubicación: `economia/baja.test.ts` y `usuarios/ultimo-admin-concurrencia.test.ts`.
- [X] T049 [US5] Implementar `usuarios.marcarBaja(tx, { usuarioId, instante })` en `src/lib/server/usuarios/baja.ts` (comprueba INV-03 con `contarAdministradoresActivos` dentro de la transacción; `ULTIMO_ADMIN`) y exportarla.
- [X] T050 [US5] Implementar `auth.cerrarSesionesPorBaja(tx, usuarioId, instante)` en `src/lib/server/auth/sesiones.ts` (copia `id_hash` a `sesion_cerrada_por_baja` y borra las sesiones) y hacer que `reactivarPersona` (`src/lib/server/auth/invitar.ts`) borre las filas de esa persona. Exportar desde `auth/index.ts`.
- [X] T051 [US5] Implementar `economia.leerLiquidacion(db, actor, usuarioId)`, `previsualizarBaja` y `darDeBaja(ambiente, actor, { usuarioId, modo, saldoPrevisto, confirmoHuchaNegativa })` en `src/lib/server/economia/baja.ts` según plan D11: reautenticación antes de la transacción; saldo actual ≠ previsto → `CAMBIO_CONCURRENTE`; modo incompatible con el signo → `VALIDACION`; aplica el modo (`pago`: aportación `origen = 'baja'` a nombre de la persona con `registrada_por = actor` y los mismos movimientos que una aportación, `abono_aportacion` a la persona y `hucha_aportacion` a la hucha; `incobrable`: movimiento `abono_incobrable` a la persona y reparto `reparto_incobrable` entre los demás activos; `devolucion`: `devolucion_baja` a la persona y `hucha_devolucion_baja`, con la confirmación de hucha negativa); `marcarBaja`, `cerrarSesionesPorBaja`, `anotarAuditoria`; comprueba saldo 0 (si no, `invariante.violada` y error). Evento `usuario.baja` con `modo`.
- [X] T052 [US5] Ruta `src/routes/(app)/admin/usuarios/[usuarioId=ulid]/baja/+page.server.ts` y `+page.svelte`: asistente con `Stepper` (saldo → modo → efecto → confirmación), *actions* `previsualizar` y `confirmar`, reautenticación y confirmación de hucha negativa; éxito → `redirect(303)` a `/admin/usuarios/[usuarioId]` con «Baja registrada». Enlace «Dar de baja» en la ficha de la persona (F1). Prueba con evento falso en `page.server.test.ts`. Desviación aprobada: dos pasos de texto sin `Stepper`.

---

## Fase 8: US6 — Estado de la hucha y deudas en el panel de avisos (P2)

**Objetivo**: el panel de inicio muestra hucha y personas bajo el límite.

**Prueba independiente**: CA-021 en integración y E2E.

- [X] T053 [US6] Pruebas primero en `src/lib/server/economia/panel.test.ts`: `CA-021` (stock bajo de F2, hucha negativa con su texto, persona con saldo −600 bajo un límite de −500 aparece; con −500 no aparece).
- [X] T054 [US6] Implementar `leerPersonasBajoLimite(db, actor)` (usa `leerConfiguracion` y el libro) en `src/lib/server/economia/panel.ts` y exportarla.
- [X] T055 [US6] Ampliar `src/routes/(app)/+page.server.ts` y `+page.svelte` para pasar a `AlertsPanel` la hucha («Hucha (teórica)», signo y texto «La hucha está en negativo») y «Tu saldo»; filas de aviso solo si hay algo que avisar (diseño `docs/diseno/screen-layouts.md` §2.1).

---

## Fase 9: Pulido y cierre

- [X] T056 [P] E2E de flujos en `e2e/flujos/economia.spec.ts` (`chromium-movil` y escritorio): aportar, comprar con dos líneas y confirmación de hucha negativa, anular una compra con resumen de regularizaciones, arqueo con vista previa y reautenticación, baja incobrable. Usar fixtures nuevas en `e2e/fixtures/economia.ts` (sin `waitForTimeout`, sin selectores CSS). Cerrado (23-10-2026): devolución e incobrable en `e2e/flujos/economia.spec.ts`, pasan en `chromium-movil` y `chromium-escritorio` (4 pruebas, `.local/e2e-f4-devolucion.log`).
  - Hecho (23-10-2026): baja con devolución y baja incobrable en `e2e/flujos/economia.spec.ts` (chromium-movil y chromium-escritorio, 4 pasan).
- [X] T057 [P] E2E sin JavaScript en `e2e/sin-js/economia.spec.ts`: aportación, compra con «Añadir línea» y confirmación 409, anulación, arqueo con vista previa y confirmación. Cubre aportación, «Añadir línea», 409 de hucha, anulación y arqueo sin JavaScript.
- [X] T058 [P] Añadir a `e2e/acceso/rutas.ts` (EV-050) `/saldos`, `/saldos/aportaciones/[id]`, `/compras`, `/compras/[id]`, `/admin/control`, `/admin/usuarios/[id]/baja` y `/fotos/compras/[id]` con el rol que exige cada una.
- [X] T059 [P] axe en claro y oscuro en `e2e/a11y/economia.spec.ts` para cada pantalla nueva (RNF-001). Cubre claro y oscuro: saldos, detalle de aportación, compras, detalle de compra, control y asistente de baja.
- [X] T060 Actualizar `ARCHITECTURE.md`: §3 (tablas nuevas de `economia`, `consumo` creada en F4, `sesion_cerrada_por_baja` en `auth`), §6 (códigos de D13), §9 (eventos de D14), §11 (`plataforma/azar.ts`), §14 (mutación piloto con su línea base).
  - Hecho (23-10-2026): §3, §6, §9, §11 ya estaban; §14 con la línea base de T011 (3 min 23 s, EXIT=0, sin umbral).
- [X] T061 Comprobar cobertura: 90 % en `economia` y `dominio/` (constitución VIII) con `npm run test`. Añadir pruebas si no llega; nunca excluir archivos.
- [X] T062 Pedir a la persona usuaria autorización para el CAMBIO de `historias.md` §10.4 (tablas `reparto`, `regularizacion`, `aviso_economia`, estado por línea de recuento) con respaldo previo en `.respaldos/`. Sin autorización, dejarlo anotado como pendiente. CAMBIO-016 aplicado en §10.4 de `historias.md` con respaldo previo en `.respaldos/`.
- [X] T063 `npm run verify` y benchmark completo en serie (`scripts/benchmark.sh`). Revisar `git status` (sin `.env`, `*.db`, informes ni `.local/`). Informar de lo ejecutado según AGENTS.md §8. Benchmark completo en serie pasado (22-10-2026); informe en `.local/benchmark/`.
- [ ] T064 Revisión manual con VoiceOver (iOS) y TalkBack (Android) de `/saldos`, `/compras`, `/compras/[id]`, `/admin/control` y el asistente de baja: lectura de importes con signo, mensajes de confirmación anunciados, diálogos de confirmación y de contraseña, foco (constitución XI). La hace la persona usuaria o se deja anotada como pendiente, con su motivo, en el informe de cierre; F4 no se cierra sin ella.

---

## Dependencias

- Fase 1 → Fase 2 → historias.
- US1 (aportaciones) es la base de US3 (anulación de aportaciones) y de US6 (saldos).
- US2 (compras) es la base de la regularización de US3 y de los recuentos con coste de US4.
- US4 y US5 dependen de la fase 2 y de los repartos; US5 usa también la confirmación de hucha negativa de US2.
- La fase 9 va al final.

## Paralelismo

- Fase 2: T005 a T010 (dominio) en paralelo; T019, T020 y T021 en paralelo tras T018.
- En cada historia, las pruebas de *actions* y las páginas van tras el caso de uso.
- Fase 9: T056 a T059 en paralelo (archivos distintos), pero ejecútalos de uno en uno para no competir por CPU.

## Estrategia

1. MVP: fases 1, 2 y US1 (aportaciones y saldo).
2. Después US2, US3 y US4 (núcleo de compras, regularización y control).
3. US5 y US6, y el cierre.
