# Tareas: Consumos (F3)

**Entrada**: [plan.md](plan.md) (aprobado el 2026-10-22), [spec.md](spec.md) (Clarifications 1 a 10), [data-model.md](data-model.md), [contracts/api-consumos.md](contracts/api-consumos.md), [contracts/rutas.md](contracts/rutas.md), [quickstart.md](quickstart.md).

**Requisito previo**: F4 terminada (`specs/003-economia/tasks.md`): tabla `consumo`, libro de movimientos, `precioDeConsumo`, `comprobarPermisoAnulacion`, `aviso_economia`, `sesion_cerrada_por_baja` y `azar`.

**Pruebas**: obligatorias (constitución VIII). Cada CA o EV del alcance tiene una prueba que lo nombra. Toca dinero, idempotencia, concurrencia y la cola sin conexión: escribe la prueba antes o justo después del código.

**Reglas para quien implementa**: las mismas de `specs/003-economia/tasks.md` («Reglas para quien implementa»). Además: la cola es la única excepción para `fetch` manual (constitución XVII); en el navegador solo se guarda la cola en IndexedDB (constitución V), sin nombres ni importes; el registro del cliente usa `lib/client/registro.ts`.

## Formato: `[ID] [P?] [Historia] Descripción`

---

## Fase 1: Preparación

- [X] T001 Instalar `idb` 8.x (`npm install idb@8`) y comprobar que `npm run check` pasa.
- [X] T002 [P] Añadir los códigos `TIPO_SIN_COSTE` (409) y `USUARIO_DE_BAJA` (403) a `src/lib/server/plataforma/errores.ts` y `errores-http.ts`, con los mensajes de plan D12 en `src/lib/shared/textos.ts`.
- [X] T003 [P] Añadir los eventos `consumo.registrado` (`via`, `consumoId`, `tipoCapsulaId`), `consumo.duplicado` (`consumoId`), `stock.negativo_registrado` (`tipoCapsulaId`) y el campo `deshecho` en `anulacion.registrada` a `src/lib/server/plataforma/registro.ts`. Comprobar que los eventos de cliente `cliente.cola_idb_error`, `cliente.cola_elemento_invalido` y `cliente.cola_sincronizacion_fallida` existen en `src/lib/client/registro.ts` (añadirlos si faltan).
- [X] T004 [P] Crear `src/lib/shared/contratos/consumos.ts`: `esquemaConsumoV1 = z.strictObject({ version: z.literal(1), clienteId: esquemaUlid, tipoCapsulaId: esquemaUlid, invitado: z.boolean(), horaGesto: esquemaInstanteUtc })`, `esquemaConsumoApi = z.discriminatedUnion('version', [esquemaConsumoV1])`, `esquemaElementoCola` (`{ version: 1, clienteId, usuarioId, tipoCapsulaId, invitado, horaGesto, estado: 'pendiente' | 'rechazado', codigo?: string }`), `esquemaConsumirForm` (`tipoCapsulaId`, `clienteId`, `invitado` en `'0' | '1'`, `horaGesto` opcional) y `esquemaRespuestaConsumo` (`{ id, precio, descuadre }`). Pruebas en `consumos.test.ts` (clave extra → error, versión 2 → error, ejemplo v1 válido guardado como constante para la prueba de compatibilidad).

---

## Fase 2: Fundamentos (bloquea todas las historias)

**Objetivo**: el caso de uso único `registrarConsumo` (lote F3-L1).

- [X] T005 Pruebas primero en `src/lib/server/economia/consumos.test.ts`: `CA-011` (stock 10, coste 3483 → stock 9, cargo −35, `precio_aplicado` 35, `coste_medio_aplicado` 3483), `CA-012` (hora del toque y de recepción guardadas; RF-018), Clarifications 9 (hora del toque posterior a la recepción → se guarda la recepción), `CA-014` (invitado: cargo a la autora y `invitado = 1`), `CA-017` (stock 0 y coste 4000 → stock −1, cargo −40, `aviso_economia` `stock_negativo`, `descuadre: true`), `CA-016/EV-010/INV-04` (mismo `clienteId` → mismo consumo, `duplicado: true`, evento `consumo.duplicado`), `TIPO_SIN_COSTE` (tipo sin coste medio), tipo retirado con coste → aceptado (Clarifications 3), `USUARIO_DE_BAJA` (persona de baja dentro de la transacción), Clarifications 8 (coste 40 → precio 0 → consumo sin movimiento).
- [X] T006 Prueba de concurrencia en `src/lib/server/economia/consumos-concurrencia.test.ts` (patrón de `concurrencia.test.ts`): dos `worker_threads` registran a la vez el mismo `cliente_id` → un solo consumo y un solo movimiento (`INV-04`).
- [X] T007 Implementar `registrarConsumo(ambiente, actor, { clienteId, tipoCapsulaId, invitado, horaGesto, via })` en `src/lib/server/economia/consumos.ts` según plan D1 y D7: una transacción; duplicado por `cliente_id`; persona activa (`USUARIO_DE_BAJA`); existencia con coste (`TIPO_SIN_COSTE`); `precio = precioDeConsumo(costeMedio)`; `fijarStock(tx, tipo, stock − 1, ahora)`; movimiento `cargo_consumo` de `−precio` solo si `precio > 0`; si el stock previo era `≤ 0`, fila `aviso_economia` (`stock_negativo`, `origen_tipo = 'consumo'`) y evento `stock.negativo_registrado`; `hora_gesto = min(horaGesto, ahora)`. Devuelve `{ id, precio, descuadre, duplicado }`. El autor es siempre `actor.usuarioId`. Exportar desde `index.ts`.
- [X] T008 Implementar `leerTiposRegistrables(db, actor)` (tipos **activos** con coste medio, en el orden del catálogo, con precio por cápsula, stock, días estimados y estado de stock bajo; RN-006, RF-004) y `leerConsumosRecientesPropios(db, actor, ahora)` (consumos vigentes del autor dentro del plazo de autoanulación) en `src/lib/server/economia/consumos.ts`. Prueba `CA-010` y RN-006 en `consumos.test.ts` (tipo sin compras y tipo retirado no aparecen).

**Punto de control**: el caso de uso pasa sus pruebas con SQLite real.

---

## Fase 3: US1 — Registrar un café con un toque (P1) 🎯 MVP

**Objetivo**: un toque en la pantalla principal registra el consumo, con «Deshacer» 5 s.

**Prueba independiente**: Ana toca Ristretto → stock 9, cargo 0,35 €, aviso con «Deshacer».

- [X] T009 [US1] Pruebas primero de «Deshacer» en `src/lib/server/economia/consumos.test.ts`: `CA-013` (deshacer a los 4 s → anulado con motivo «Deshecho por el autor», stock repuesto, movimiento con `vigente = 0`), Clarifications 5 (deshacer a los 10 min con plazo 15 → aceptado; a los 16 min → `FUERA_DE_PLAZO`), deshacer un consumo ajeno → `SIN_PERMISO`.
- [X] T010 [US1] Implementar `deshacerConsumo(ambiente, actor, consumoId)` en `src/lib/server/economia/consumos.ts`: anulación del autor con motivo fijo «Deshecho por el autor» (texto en `textos.ts`), con la misma lógica que T018. Evento `anulacion.registrada` con `deshecho: true`.
- [X] T011 [US1] Ampliar `src/routes/(app)/+page.server.ts`: `load` con `leerTiposRegistrables`, `leerConsumosRecientesPropios` y un `clienteId` por tipo (`nuevoId()`); *action* `consumir` (valida `esquemaConsumirForm`; `horaGesto` ausente → hora del servidor; llama a `registrarConsumo` con `via: 'directo'`; devuelve `{ consumo: { id, precio, descuadre } }`); *action* `deshacer` (`consumoId`). Errores con `fallo()`.
- [X] T012 [US1] Ajustar `src/lib/ui/CapsuleRow.svelte` si hace falta para que cada fila sea un `<form method="post" action="?/consumir">` con `tipoCapsulaId` y `clienteId` ocultos y dos botones de envío: la fila (`name="invitado" value="0"`, nombre accesible «Registrar un <tipo>») y el botón de persona (`value="1"`, «Registrar un <tipo> para un invitado», 44 × 44 px). Fila de 76 px o más. El componente recibe el `enhance` por prop (no llama al servidor; constitución III).
- [X] T013 [US1] En `src/routes/(app)/+page.svelte`: `use:enhance` que, antes de enviar, pone un ULID nuevo en `clienteId` (con `ulid` en el cliente) y `horaGesto = new Date().toISOString()`; tras el éxito, `UndoToast` de 5 s (9 s con descuadre, texto «Stock negativo: avisa a un administrador») en `ToastRegion` (`aria-live="polite"`, sin mover el foco) que envía `?/deshacer`; sin JavaScript, `Banner` con el botón «Deshacer» (formulario `?/deshacer`) sin cuenta atrás. Sección «Tus últimos consumos» con enlace a `/consumos/[consumoId]`. Estado vacío de plan D10. Textos en `textos.ts`.
- [X] T014 [US1] Prueba de componente de `UndoToast` en `src/lib/ui/UndoToast.test.ts` (Vitest Browser Mode, reloj simulado): visible 5 s, «Deshacer» llama a la función recibida, desaparece al vencer, anunciado en la región viva.
- [X] T015 [US1] Pruebas de *actions* con evento falso en `src/routes/(app)/page.server.test.ts` (`consumir` éxito, duplicado, `TIPO_SIN_COSTE`; `deshacer` éxito y `FUERA_DE_PLAZO`).
- [X] T016 [US1] Repeticiones de F2 con consumos reales (plan D13) en `src/lib/server/economia/capsulas.test.ts` y `src/lib/server/economia/existencias.test.ts` (o el archivo de pruebas de stock de F2): `CA-006` con un consumo registrado por `registrarConsumo` (T-F2-14), `CA-020` (stock 11, umbral 10 → un consumo → stock bajo) y `CA-023` (tres consumos más → una sola `entrada_stock_bajo`) (T-F2-15). Marcar T-F2-14 y T-F2-15 en `specs/002-catalogo-stock/tasks.md`.
- [X] T017 [US1] `CA-045` de F4 con consumos registrados por `registrarConsumo` en `src/lib/server/economia/compras-anulacion.test.ts`.

**Punto de control**: el toque funciona con y sin JavaScript.

---

## Fase 4: US3 — Anular un consumo (P2)

(Se hace antes que US2 porque la cola reutiliza los estados de anulación y la página `/consumos/[id]`.)

**Objetivo**: anulación con motivo por el autor en plazo o por un administrador; `/historial` mínimo.

**Prueba independiente**: CA-060 a CA-062 y EV-011 sobre consumos.

- [X] T018 [US3] Pruebas primero en `src/lib/server/economia/consumos.test.ts`: `CA-060` (autor a los 10 min con motivo), `CA-061` (administrador a los 3 días), `CA-062` (autor a los 20 min → `FUERA_DE_PLAZO`; otro miembro → `SIN_PERMISO`), `EV-011/INV-05` (doble anulación → `YA_ANULADO`), RN-013 (anular no cambia el coste medio ni otros cargos), consumo de una persona de baja → `ESTADO_INCORRECTO` (Clarifications 10 de F4), y `EV-030` con consumos reales (stock y coste guardados coinciden con `reconstruir` tras registrar, anular y comprar).
- [X] T019 [US3] Implementar `anularConsumo(ambiente, actor, consumoId, motivo)` en `src/lib/server/economia/consumos.ts`: `comprobarPermisoAnulacion` de F4; `UPDATE … WHERE id = ? AND estado = 'vigente'` (0 filas → `YA_ANULADO`); `anularMovimientosDe('consumo', id)`; `fijarStock(tx, tipo, stock + 1, ahora)`. Sin recalcular coste. `deshacerConsumo` (T010) la reutiliza.
- [X] T020 [US3] Implementar `leerConsumo(db, actor, id)` (el autor o un administrador; otro → `SIN_PERMISO`) y `leerHistorialConsumos(db, actor, { pagina })` (20 por página; un miembro ve los suyos, un administrador los de todos).
- [X] T021 [US3] Ruta `src/routes/(app)/consumos/[consumoId=ulid]/+page.server.ts` y `+page.svelte`: detalle (tipo, hora del toque y de registro, precio, invitado, estado) y *action* `anular` con `esquemaAnulacion` de F4; `VoidDialog` con JavaScript y formulario en la página sin él.
- [X] T022 [US3] Ruta `src/routes/(app)/historial/+page.server.ts` y `+page.svelte` mínima: lista paginada de consumos con `MovementList` y `Pagination` (`?pagina=` validado con `z.strictObject({ pagina: z.coerce.number().int().min(1).default(1) })`), con enlace al detalle. F6 la amplía.
- [X] T023 [US3] Pruebas de *actions* con evento falso en `src/routes/(app)/consumos/[consumoId=ulid]/page.server.test.ts`.

---

## Fase 5: US2 — Registrar sin conexión (P1)

**Objetivo**: cola en IndexedDB, envío al volver la red, `POST /api/consumos` y service worker.

**Prueba independiente**: modo avión → toque → «pendiente de enviar» → red → registrado una vez.

- [X] T024 [US2] Implementar `auth.motivoSesionInvalida(db, token)` en `src/lib/server/auth/sesiones.ts` (devuelve `'baja'` si el hash del token está en `sesion_cerrada_por_baja`, si no `'sin_sesion'`) y exportarla. Prueba en `sesiones.test.ts` (`EV-041`).
- [X] T025 [US2] Pruebas primero del endpoint en `src/routes/api/consumos/server.test.ts` con evento falso: 201 nuevo, 200 duplicado (`EV-010`), 400 con clave extra y con versión 2, 401 sin sesión, 403 `USUARIO_DE_BAJA` con sesión cerrada por la baja (`EV-041`), 409 `TIPO_SIN_COSTE`, 413 con cuerpo de más de 2 KB, compatibilidad con el ejemplo v1 de T004. El mensaje no contiene el valor recibido.
- [X] T026 [US2] Implementar `src/routes/api/consumos/+server.ts` (`POST`): comprueba el tamaño (`content-length` y lectura acotada a 2 KB); sin sesión → `motivoSesionInvalida` → 403 o 401; valida con `esquemaConsumoApi`; llama a `registrarConsumo` con `via: 'cola'`; responde con `Response.json` (201 o 200) o el error `{ codigo, mensaje }` con `respuestaError`. Sin reglas de negocio en la ruta.
- [X] T027 [US2] Pruebas primero de la cola en `src/lib/client/cola-consumos/cola.test.ts` (Vitest Browser Mode con `idb` real): añadir, listar por `usuarioId` (Clarifications 10: los de otra persona no se listan), borrar (`CA-063`), elemento inválido descartado con `cliente.cola_elemento_invalido`, envío de uno en uno en orden de `horaGesto` con un `fetch` falso inyectado, y cada respuesta de la tabla «Comportamiento del cliente por respuesta» de `contracts/api-consumos.md` (201/200 borra; 401 conserva; 403 `USUARIO_DE_BAJA`, 409 y 400 → `rechazado` con código; 403 `PRIVACIDAD_PENDIENTE`, 5xx y red → conserva con espera creciente 30 s, 1 min, 2 min… hasta 10 min).
- [X] T028 [US2] Implementar `src/lib/client/cola-consumos/` (`almacen.ts` con `idb`: base `becafe`, almacén `consumos-pendientes`, clave `clienteId`; `envio.ts`: envío con `fetch` a `resolve('/api/consumos')`; `index.ts`: API `anadir`, `listar`, `borrar`, `marcarRechazado`, `limpiarRechazados`, `enviarPendientes`). Cada lectura se valida con `esquemaElementoCola`. Disparadores: carga de la página, evento `online`, tras cada alta y cada 30 s mientras haya pendientes y `document.visibilityState === 'visible'`. Sin Background Sync (plan D5).
- [X] T029 [US2] Integrar la cola en `src/routes/(app)/+page.svelte`: si `navigator.onLine` es falso o el envío falla por red, el toque va a la cola con el mismo `clienteId` (plan D2); «Deshacer» de un pendiente lo borra de la cola (`CA-063`); `Banner offline` con el número de pendientes y el aviso de RF-019; cada pendiente como `MovementRow` con estado `pending`; rechazados en `Banner negative` con «Entendido»; 401 → «Inicia sesión para enviar tus consumos pendientes». «Pendiente de enviar», «registrado» y «rechazado» con texto e icono. Estado de conexión en un contexto de `lib/client` (sin `$state` exportado desde un módulo).
- [X] T030 [US2] Crear `src/service-worker.ts` según plan D8: precarga de `build` y `files` de `$service-worker` con caché por `version`; borra cachés antiguas en `activate`; navegación con red primero y, sin red, la última respuesta guardada de `/` y su `__data.json`; otras rutas sin red → página «Sin conexión»; `/fotos/*` con revalidación. No envía la cola. Comprobar que la CSP de `vite.config.ts` lo permite (`worker-src 'self'`).
- [X] T031 [US2] E2E con red emulada en `e2e/flujos/consumos-sin-conexion.spec.ts` (`chromium-movil`, `context.setOffline`): `CA-015` (toque sin red → «pendiente de enviar» → red → un solo consumo en el servidor), `CA-063` (deshacer un pendiente → el servidor nunca lo recibe), `EV-041` (persona dada de baja con pendientes → «rechazado» con su mensaje y saldo sin cambios), recarga sin red de `/` servida por el service worker.
- [X] T032 [P] [US2] Prueba de compatibilidad del contrato en `e2e/api/consumos.spec.ts` (proyecto `api`): el ejemplo v1 sigue respondiendo 201 o 200.

---

## Fase 6: Pulido y cierre

- [X] T033 [P] E2E de flujos en `e2e/flujos/consumos.spec.ts`: `CA-010` (solo tipos con coste y activos), toque con «Deshacer», invitado, anulación desde `/consumos/[id]`.
- [X] T034 [P] E2E sin JavaScript en `e2e/sin-js/consumos.spec.ts`: toque, «Deshacer» con `Banner`, anulación con motivo.
- [X] T035 [P] Añadir a `e2e/acceso/rutas.ts` (EV-050) `/consumos/[id]`, `/historial` y `POST /api/consumos`.
- [X] T036 [P] axe en claro y oscuro en `e2e/a11y/consumos.spec.ts`, con el toast visible y con pendientes (RNF-001, EV-060).
- [X] T037 Crear `scripts/perf/consumos.mjs` según plan D11 (base temporal, 30 usuarios, `node build`, 300 consumos a la *action* con 5 en paralelo, p95 en `.local/verification/`, falla si supera 1 s) y el script `"perf:load": "node scripts/perf/consumos.mjs"` en `package.json`. Ejecutarlo y anotar el resultado (RNF-002).
  - Resultado (2026-10-23): `npm run perf:load`, 30 personas, 300 consumos, 5 en paralelo: p50 18 ms, p95 37 ms (límite 1000 ms), 0 errores, 300 consumos registrados (`.local/verification/perf-consumos-*.json`). Requiere `npm run build:verificacion` antes; el puerto 4300 coincide con el ORIGIN de la build.
- [X] T038 Actualizar `ARCHITECTURE.md`: §1 y §5 (la página envía la cola, no el service worker), §6 (`TIPO_SIN_COSTE`, `USUARIO_DE_BAJA`), §9 (eventos de D12), §14 (`perf:load` hecho).
- [ ] T039 `npm run verify`, benchmark completo en serie y revisión de `git status`. Revisión manual con VoiceOver y TalkBack del toque y del toast (constitución XI): si no se puede hacer, anotarlo como pendiente.
  - Estado: `npm run verify`, benchmark completo en serie (`.local/benchmark-f3.log`, código 0) y revisión de `git status`, hechos. Pendiente: revisión manual con VoiceOver y TalkBack del toque y del toast (constitución XI), a cargo de la persona usuaria.

---

## Dependencias

- F4 completa → Fase 1 → Fase 2 → US1 → US3 → US2 → Fase 6.
- US2 necesita la *action* `consumir` de US1 (mismo `clienteId`) y el endpoint (T026).

## Paralelismo

- Fase 1: T002, T003 y T004 en paralelo.
- Fase 6: T033 a T036 en archivos distintos; ejecútalos de uno en uno.

## Estrategia

1. MVP: fases 1 y 2 y US1 (toque con red y «Deshacer»).
2. US3 (anulación y `/historial` mínimo).
3. US2 (cola, API y service worker) y cierre con la medición de RNF-002.
