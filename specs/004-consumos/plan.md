# Implementation Plan: Registro de consumos, incluido sin conexión (F3)

**Branch**: `main` (AGENTS.md §9) | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md) (aprobada el 2026-10-22)

**Estado**: plan aprobado por la persona usuaria el 2026-10-22, con las decisiones propuestas. Las decisiones están en la sección Clarifications de la spec.

**Artefactos**: decisiones D1 a D14 en este archivo; modelo de datos en [data-model.md](data-model.md); contratos en [contracts/api-consumos.md](contracts/api-consumos.md) y [contracts/rutas.md](contracts/rutas.md); validación en [quickstart.md](quickstart.md).

**Depende de** F4 (`specs/003-economia/plan.md`): tabla `consumo`, `movimiento`, `aviso_economia`, `precioDeConsumo`, el patrón de anulación (D6 de F4) y `auth.cerrarSesionesPorBaja`. F3 se implementa después de F4.

## Summary

F3 entrega la acción central de la aplicación: un toque sobre una cápsula registra un consumo, baja el stock y carga el coste medio al autor, con «Deshacer» durante 5 segundos. Sin conexión, el consumo queda en una cola de IndexedDB y se envía al volver la red, sin duplicarse.

Hay **dos caminos y un solo caso de uso**: la *action* `consumir` de `/` (con red, funciona sin JavaScript) y `POST /api/consumos` (solo la cola sin conexión, excepción cerrada del principio XVII). Los dos llaman a `economia.registrarConsumo`.

## Technical Context

**Language/Version**: TypeScript 6 estricto; Node 24 LTS.

**Primary Dependencies**: SvelteKit 3 (service worker integrado), Svelte 5, Drizzle + `better-sqlite3`, Zod 4, `ulid` (también en el cliente). Nueva: **`idb` 8** (aislada en `lib/client/cola-consumos`, ya en la lista obligatoria).

**Storage**: SQLite sin migración nueva (F4 crea `consumo` y `aviso_economia`). En el navegador: IndexedDB (solo la cola) y la caché del service worker (constitución V).

**Testing**: Vitest (`servidor`) para el caso de uso, la idempotencia y la concurrencia; Vitest Browser Mode para la cola (`idb` real) y `UndoToast`; Playwright con red emulada (`context.setOffline`) para CA-015 y CA-063; `sin-js` para el toque y «Deshacer»; script de carga ligera para RNF-002.

**Target Platform**: Safari iOS ≥ 16.4 y Chrome Android, también instalada como PWA (RNF-013).

**Project Type**: aplicación SvelteKit única.

**Performance Goals**: RNF-002: confirmación en 1 s o menos en el p95 con red y 30 usuarios.

**Constraints**: un solo toque (RF-011); botones de cápsula de 44 × 44 px o más; confirmación anunciada sin mover el foco; la cola sobrevive a despliegues (RNF-011) y a versiones del contrato (constitución XIV).

**Scale/Scope**: unos 10 usuarios activos; decenas de consumos al día.

## Constitution Check

| Principio | Cumplimiento en F3 | Estado |
| --- | --- | --- |
| I. Fuente vigente | Cada comportamiento cita su RF, RN o CA. Los huecos se presentan en D14 | Cumple, con D14 pendiente |
| II. Complejidad justificada | `idb` y el service worker los exige RF-015. Sin Background Sync: Safari no lo admite y el envío desde la página ya cubre el caso (D5) | Cumple |
| III. Separación | Un caso de uso (`registrarConsumo`) para los dos caminos. La cola en `lib/client`, sin reglas de negocio | Cumple |
| IV. Integridad económica | Cargo en céntimos con RN-021; una transacción por consumo; idempotencia por `cliente_id` | Cumple |
| V. Almacenamiento | El navegador guarda solo la cola (sin nombres ni importes) y la caché del service worker | Cumple |
| VI. Seguridad y validación | `z.strictObject` versionado en `/api/consumos`; elementos de la cola validados al leerlos; permisos en el caso de uso | Cumple |
| VII. Tipado estricto | Sin escapes; tipos inferidos de los contratos | Cumple |
| VIII. Pruebas | Matriz de la spec concretada en «Pruebas»; F2 y F4 repetidos con consumos reales | Cumple |
| IX. Verificación | `verify` al cambiar el contrato de la API y `hooks.server.ts`; benchmark al cerrar | Cumple |
| X. Usabilidad | Un toque; «Deshacer» 5 s; «pendiente», «registrado» y «rechazado» distintos | Cumple |
| XI. Accesibilidad | `ToastRegion` con `aria-live`; tamaño de los botones; axe en claro y oscuro | Cumple |
| XIV. Compatibilidad | Contrato v1 con campo `version`; el endpoint aceptará la unión de versiones vivas (D6) | Cumple |
| XVI. Registro técnico | `consumo.registrado` con `via`; eventos de la cola del cliente ya catalogados | Cumple |
| XVII. SvelteKit idiomático | El toque es un `<form method="post">` con *action*; `/api/consumos` solo para la cola (excepción cerrada) | Cumple |

**Resultado:** la puerta se supera. D14 recoge decisiones que necesitan aprobación.

## Architecture Check (`ARCHITECTURE.md` §15)

1. **Constitución:** sí.
2. **Ubicaciones:** `economia/consumos.ts` (registro, «Deshacer», anulación, consultas); `lib/client/cola-consumos/` (cola y envío); `src/service-worker.ts` (caché); `src/routes/(app)/+page.server.ts` (*actions*), `src/routes/api/consumos/+server.ts`, `src/routes/(app)/consumos/[consumoId=ulid]`, `src/routes/(app)/historial` (mínimo); contrato en `lib/shared/contratos/consumos.ts`.
3. **Grafo:** sin aristas nuevas (`economia → auth`, `economia → configuracion`, `economia → catalogo`). `lib/client → lib/shared` ya permitido.
4. **Reutilización:** `CapsuleRow`, `UndoToast`, `ToastRegion`, `Banner` (`offline`, `negative`), `MovementRow` (`pending`), `VoidDialog`, `AlertsPanel`, `StockBadge`, `EmptyState`.
5. **Piezas nuevas:** `idb`, service worker, endpoint de la cola (Complexity Tracking).
6. **Reglas e invariantes:** RN-001, RN-002, RN-005, RN-006, RN-013, RN-021, RN-030 a RN-035 y RN-054 tienen dueño (`economia`) y prueba. INV-04 (UNIQUE + búsqueda en la transacción), INV-05 (actualización condicionada), INV-06 (estado de la persona comprobado en la transacción).
7. **Repetición, retraso y fallo:**
   - Respuesta perdida: el cliente reenvía el mismo `clienteId` y recibe el original (EV-010).
   - Consumo que llega tarde: precio del coste medio vigente al recibirlo (RN-002); la hora del toque se guarda aparte (RF-018).
   - Consumo que llega tras una baja: `USUARIO_DE_BAJA` (D9).
   - Consumo de un tipo sin coste: `TIPO_SIN_COSTE`; el móvil lo marca «rechazado» (Clarifications 3).
   - Fallo a mitad: una transacción; el cliente conserva el elemento hasta recibir 200 o 201.
   - Avisos: `aviso_economia` (`stock_negativo`) y `entrada_stock_bajo` en la transacción; F5 los entrega.
8. **Fuentes y contratos:** contrato v1 nuevo de `/api/consumos` ([contracts/api-consumos.md](contracts/api-consumos.md)). Ningún cliente tiene todavía consumos en cola: no hay versión anterior.
9. **Autorización:** en el caso de uso. Entran en EV-050: `/consumos/[consumoId]`, `/historial`, `POST /api/consumos` (401 sin sesión) y las *actions* nuevas de `/`.
10. **Afectados:** F2 (CA-020, CA-023, CA-006 con consumos reales), F4 (CA-045 con consumos registrados), F5 (avisos de stock), F6 (`/historial`, estadísticas por invitado y por hora del toque).
11. **Migraciones:** ninguna.
12. **Datos y formularios:** `load` en `+page.server.ts`; el toque y la anulación son *actions*. Excepciones del principio XVII usadas: cola sin conexión, cuenta atrás de «Deshacer», service worker.
13. **Eventos:** D12.
14. **Pantallas:** `/` (estados en [contracts/rutas.md](contracts/rutas.md), con «sin conexión» y «pendientes»), `/consumos/[id]`, `/historial`; todas en `a11y`.

## Decisiones

### D1. Un caso de uso, dos caminos

`economia.registrarConsumo(ambiente, actor, { clienteId, tipoCapsulaId, invitado, horaGesto, via })` en una transacción `BEGIN IMMEDIATE`:

1. Si existe un consumo con ese `cliente_id`, lo devuelve con `duplicado: true` (RF-016, INV-04).
2. Comprueba que el autor sigue activo (RN-054, INV-06); si no, `USUARIO_DE_BAJA`.
3. Lee `existencia`; sin coste medio, `TIPO_SIN_COSTE` (RN-006, Clarifications 3). Un tipo retirado con coste se acepta (Clarifications 3).
4. `precio = precioDeConsumo(costeMedio)` (F4 D2, RN-021); `stock -= 1` con `fijarStock` (RN-072); movimiento `cargo_consumo` por `−precio` (D14-2 para precio 0).
5. Si el stock previo era `≤ 0`: `aviso_economia` (`stock_negativo`) y `descuadre: true` en la respuesta (RF-017, RN-005).
6. Guarda `hora_gesto`, `hora_registro`, `precio_aplicado` y `coste_medio_aplicado` (RF-018, RN-002).

El autor es siempre `actor.usuarioId` (RN-034); el contrato no tiene campo de usuario.

### D2. El toque con red: *action* `consumir`

- Cada `CapsuleRow` es un `<form method="post" action="?/consumir">` con `tipoCapsulaId`, `clienteId` y dos botones de envío: la fila (`invitado=0`) y el botón de persona (`invitado=1`, RF-014). Funciona sin JavaScript.
- Sin JavaScript, el `load` genera un `clienteId` por fila; tras el envío, la página se recarga con identificadores nuevos. Reenviar el mismo POST reutiliza el identificador (idempotente).
- Con JavaScript, `use:enhance` sustituye `clienteId` por un ULID nuevo en cada toque y añade `horaGesto`. Sin JavaScript, `horaGesto` es la hora del servidor.
- Si `navigator.onLine` es falso, o el envío falla por red, el toque va a la cola (D5) con el mismo `clienteId`. Si la petición sí llegó, el reenvío desde la cola devuelve el original.

### D3. «Deshacer» (RF-013, RN-031)

- Con JavaScript: `UndoToast` de 5 s (9 s con descuadre, según el diseño) con «Deshacer», en `ToastRegion` (`aria-live`, sin mover el foco). Pulsarlo envía la *action* `deshacer` con el `consumoId`.
- Sin JavaScript: la página devuelta muestra un `Banner` con el botón «Deshacer», sin cuenta atrás (constitución X).
- **Servidor:** `deshacerConsumo` es una anulación del autor con motivo «Deshecho por el autor», válida mientras no venza el plazo de autoanulación (Clarifications 5). Fuera de plazo: `FUERA_DE_PLAZO`.
- **Consumo en la cola:** «Deshacer» lo borra de IndexedDB y nunca se envía (RF-063, CA-063).

### D4. Anulación de consumos (RF-060 a RF-062)

- Mismo patrón que F4 D6: permiso del autor en plazo o del administrador; `UPDATE … WHERE estado = 'vigente'`; movimientos del consumo a `vigente = 0`; `stock += 1` con `fijarStock`, sin recalcular el coste medio ni otros cargos (RN-013). Un consumo de una persona dada de baja no se anula (F4 D16-3).
- **Dónde** (Clarifications 6): en `/`, una sección «Tus últimos consumos» (registros del autor dentro del plazo) enlaza a `/consumos/[consumoId]`, que tiene el formulario de anulación con motivo (`VoidDialog` con JavaScript). Los administradores anulan desde `/historial`.
- **`/historial` mínimo:** lista paginada de consumos. Un miembro ve los suyos; un administrador, los de todos. F6 añade aportaciones, compras, filtros y «Mostrar anulados» (spec, Assumptions).

**Anulación concurrente con el registro.**

Una anulación y un consumo del mismo tipo se serializan con `BEGIN IMMEDIATE`. El stock y el coste guardados siguen coincidiendo con `reconstruir` (EV-030 de F4 con los consumos reales; F4 D16-2).

### D5. Cola sin conexión (`lib/client/cola-consumos`)

- **Almacén:** IndexedDB `becafe`, almacén `consumos-pendientes`, clave `clienteId`. Elemento: `{ version: 1, clienteId, usuarioId, tipoCapsulaId, invitado, horaGesto, estado: 'pendiente' | 'rechazado', codigo? }`. Sin nombres ni importes (constitución V).
- **Lectura:** cada elemento se valida con el esquema de `lib/shared/contratos/consumos.ts`. Uno inválido se descarta y se registra `cliente.cola_elemento_invalido` (`ARCHITECTURE.md` §6.1).
- **Envío desde la página**, no desde el service worker: al cargar la aplicación, con el evento `online`, tras cada alta en la cola y cada 30 s mientras haya pendientes y la página esté visible. Los envíos son de uno en uno, en orden de `horaGesto`.
- **Solo los de la persona con sesión** (Clarifications 4): el cliente envía los elementos cuyo `usuarioId` coincide con el de la sesión. Los de otra persona se quedan en la cola sin mostrarse (D14-4).
- **Respuestas:** 201 o 200: se borra el elemento. 401: se conserva y se muestra «Inicia sesión para enviar tus consumos pendientes». 403 `USUARIO_DE_BAJA`, 409 `TIPO_SIN_COSTE` o 400: el elemento pasa a `rechazado` con su código; un `Banner negative` lo explica y «Entendido» los borra. 403 `PRIVACIDAD_PENDIENTE`, 5xx o error de red: se conserva y se reintenta con espera creciente (30 s, 1 min, 2 min… hasta 10 min).
- **Pantalla:** `Banner offline` con el número de pendientes y el aviso de RF-019; cada pendiente como `MovementRow` con estado `pending`. «Pendiente de enviar», «registrado» y «rechazado» se distinguen con texto e icono, no solo con color.
- **Por qué no Background Sync:** Safari no lo admite (RNF-013). El envío desde la página funciona en los dos navegadores; una segunda vía sería otra forma de resolver lo mismo (constitución II).

### D6. Contrato `POST /api/consumos` (v1)

- Cuerpo: `z.strictObject({ version: z.literal(1), clienteId: ulid, tipoCapsulaId: ulid, invitado: z.boolean(), horaGesto: InstanteUtc })`. El endpoint valida con `z.discriminatedUnion('version', [v1])`; una versión nueva se añade a la unión y la anterior se mantiene mientras pueda haber consumos en cola (principio XIV).
- Respuestas: 201 nuevo / 200 duplicado `{ id, precio, descuadre }`; errores `{ codigo, mensaje }` (401, 403, 409, 400, 413). Detalle en [contracts/api-consumos.md](contracts/api-consumos.md).
- Límite de tamaño del cuerpo: 2 KB.

### D7. Hora del toque (RF-018)

`horaGesto` se guarda tal como llega si no es posterior a la hora de recepción. Si el reloj del móvil está adelantado, se guarda la hora de recepción. La hora del toque es informativa (estadísticas de F6) y no cambia el precio (RN-002).

### D8. Service worker (`src/service-worker.ts`)

- Precarga los archivos de la build y de `static/` (`$service-worker`), con caché por versión; al activarse borra las cachés anteriores.
- Navegación: primero la red; sin red, la última respuesta guardada de `/` (con su `__data.json`) para poder tocar cápsulas sin conexión. Otras rutas sin red muestran la página «Sin conexión».
- Fotos de cápsulas (`/fotos/*`): caché con revalidación.
- No envía la cola ni guarda datos fuera de su caché (constitución V).

### D9. Consumos en cola tras una baja (RN-054, EV-041)

- F4 guarda los hashes de las sesiones que cierra una baja (`auth.sesion_cerrada_por_baja`, F4 D11).
- `POST /api/consumos` sin sesión válida llama a `auth.motivoSesionInvalida(db, token)`: si el hash está en esa tabla, responde 403 `USUARIO_DE_BAJA`; si no, 401. Solo quien tiene esa cookie (la persona en su móvil) recibe la respuesta. El inicio de sesión sigue sin revelar nada (RN-055).
- Dentro de la transacción, `registrarConsumo` vuelve a comprobar que la persona está activa (carrera entre la baja y un envío).

### D10. Pantalla principal (`/`)

- Orden (diseño): panel de avisos (F2 y F4), lista «¿Qué cápsula te pones?» con un `CapsuleRow` por tipo activo con coste medio (RN-006, CA-010), «Tus últimos consumos».
- `CapsuleRow`: nombre en texto, foto o color, marca, intensidad, precio por cápsula, stock, días estimados y `StockBadge`. La fila mide 76 px o más; el botón de invitado, 44 × 44 px.
- Estados: vacío («Todavía no hay cápsulas para registrar. Un administrador debe registrar la primera compra.»), sin conexión, pendientes, rechazado, error.

### D11. RNF-002 (rendimiento)

- `scripts/perf/consumos.mjs` (Node, sin dependencias nuevas): siembra 30 usuarios en una base temporal, arranca `node build` y envía 300 consumos a la *action* con 5 en paralelo. Escribe el p95 en `.local/verification/`.
- Se ejecuta al cerrar F3 y en el benchmark, no en `verify`. Falla si el p95 supera 1 s. Implementa el «`perf:load`» que `ARCHITECTURE.md` §14 dejaba pendiente.

### D12. Errores y eventos

- Errores nuevos: `TIPO_SIN_COSTE` (409, «Esta cápsula todavía no tiene precio. Pide a un administrador que registre una compra.») y `USUARIO_DE_BAJA` (403, «Tu cuenta está dada de baja. Este consumo no se ha registrado.»).
- Eventos: `consumo.registrado` (`via`: `directo` | `cola`, `consumoId`, `tipoCapsulaId`), `consumo.duplicado` (`consumoId`), `anulacion.registrada` (`origenTipo: 'consumo'`, `deshecho`), `stock.negativo_registrado` (`tipoCapsulaId`). Sin importes ni nombres.

### D13. Repeticiones de F2 y F4 con consumos reales

- T-F2-14: CA-006 «con un consumo» (`hayRegistrosDeTipo` ya consulta `consumo` desde F4).
- T-F2-15: CA-020 (stock 11 → consumo → stock bajo) y CA-023 (tres consumos más: una sola entrada).
- CA-045 de F4 con consumos registrados por `registrarConsumo`.

### D14. Decisiones de la persona usuaria

1. **Indicar la baja al móvil (D9).** Quien envía consumos con la sesión cerrada por su baja recibe «Tu cuenta está dada de baja». Se considera compatible con RN-055 porque solo lo ve el dispositivo que tenía esa sesión. *Alternativa:* responder 401 como a cualquier sesión caducada; entonces el móvil no puede cumplir «el móvil se lo indica» (EV-041).
2. **Consumo con precio 0.** Si el coste medio es menor de 0,005 €, el cargo redondeado es 0: se registra el consumo sin movimiento (un movimiento de 0 € no existe). *Alternativa:* cargo mínimo de 0,01 €.
3. **Hora del toque adelantada (D7).** Se sustituye por la hora de recepción.
4. **Consumos en cola de otra persona.** Se conservan en el dispositivo sin mostrarse a quien tiene la sesión, hasta que la persona dueña vuelva a entrar. *Alternativa:* mostrar solo cuántos hay.

## Pruebas

| Regla o escenario | Nivel | Archivo previsto |
| --- | --- | --- |
| RN-021 (0,3483 → 0,35; 0,345 → 0,35) | Unidad + propiedades (ya en F4 `coste-medio.test.ts`) | — |
| CA-010, RN-006, RF-004 | Integración (`leerTiposRegistrables`) + E2E | `economia/consumos.test.ts`, `e2e/flujos/consumos.spec.ts` |
| CA-011, CA-012, CA-014, CA-017, RF-018 | Integración | `economia/consumos.test.ts` |
| CA-016, EV-010, INV-04 | Integración + concurrencia (`worker_threads`, mismo `cliente_id`) | `economia/consumos.test.ts` |
| CA-013, RN-031, Clarifications 5 | Integración + componente (`UndoToast`) + E2E + `sin-js` | `economia/consumos.test.ts`, `e2e/flujos/consumos.spec.ts`, `e2e/sin-js/consumos.spec.ts` |
| CA-060 a CA-062, EV-011 | Integración + concurrencia | `economia/consumos.test.ts` |
| CA-015, CA-063, RF-019 | Componente (cola con `idb` real) + E2E con red emulada | `lib/client/cola-consumos/cola.test.ts`, `e2e/flujos/consumos-sin-conexion.spec.ts` |
| EV-041, RN-054, INV-06, D9 | Integración + `api` | `economia/consumos.test.ts`, `src/routes/api/consumos/server.test.ts` |
| Contrato v1 (401, 400 clave extra, 413, idempotencia) | Ruta con evento falso + proyecto `api` | `src/routes/api/consumos/server.test.ts`, `e2e/api/consumos.spec.ts` |
| Repeticiones (D13) | Integración | `economia/capsulas.test.ts`, `economia/compras.test.ts` |
| RNF-002 | Carga ligera | `scripts/perf/consumos.mjs` |
| RNF-001, EV-060 | `a11y` en claro y oscuro, con toast visible | `e2e/a11y/consumos.spec.ts` |

## Lotes de implementación (orientativo)

| Lote | Contenido | CA/EV | Cierre |
| --- | --- | --- | --- |
| F3-L1 Caso de uso | `registrarConsumo`, `deshacerConsumo`, `anularConsumo`, consultas | CA-011 a CA-014, CA-016, CA-017, CA-060 a CA-062, EV-010, EV-011, EV-041 | `test:changed` |
| F3-L2 Pantalla principal | *Actions* `consumir` y `deshacer`, `CapsuleRow`, toast, «Tus últimos consumos» | CA-010, CA-013 | `test:e2e:quick`, `sin-js` |
| F3-L3 API y cola | Contrato v1, `/api/consumos`, `idb`, envío y estados | CA-015, CA-063, EV-041 | `verify` (contrato) + E2E con red emulada |
| F3-L4 Service worker | Precarga, navegación sin red | CA-015 | E2E en `chromium-movil` |
| F3-L5 Anulación y `/historial` mínimo | `/consumos/[id]`, `/historial` | CA-060 a CA-062 | `test:changed`, `acceso` |
| F3-L6 Repeticiones y rendimiento | D13, `scripts/perf/consumos.mjs` | CA-006, CA-020, CA-023, CA-045, RNF-002 | `test:changed` + carga |
| F3-L7 Cierre | `ARCHITECTURE.md`, textos, benchmark | Todos | `verify` + benchmark |

## Cambios en otros documentos

| Documento | Cambio | Lote |
| --- | --- | --- |
| `ARCHITECTURE.md` | §1 y §5: la página envía la cola (no el service worker). §6: `TIPO_SIN_COSTE`, `USUARIO_DE_BAJA`. §9: eventos de D12. §14: `perf:load` hecho | F3-L7 |
| `specs/004-consumos/spec.md` | Clarifications con las decisiones de D14 aprobadas | Antes de `tasks.md` |
| `specs/002-catalogo-stock/tasks.md` | T-F2-14 y T-F2-15 marcadas al pasar | F3-L6 |

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| iOS borra IndexedDB de una web no instalada tras días sin uso | Aviso de RF-019; la guía de instalación (F5, RF-106) recomienda instalar la PWA |
| El service worker sirve una versión antigua tras un despliegue | Caché por versión; al detectar una versión nueva se recarga en la siguiente navegación |
| Doble envío por la *action* y la cola a la vez | Mismo `clienteId`; la base de datos decide (INV-04) |
| p95 por encima de 1 s en el servidor de Coolify | Medición en F3; si falla, se mide antes de optimizar (constitución IX) |

## Complexity Tracking

| Pieza | Problema concreto | Alternativa más simple descartada porque… |
| --- | --- | --- |
| `POST /api/consumos` | La cola envía sin formulario, en segundo plano | Una *action* necesita un formulario y una navegación; la constitución XVII lo permite solo para la cola |
| `idb` | RF-015: cola persistente en el navegador | `localStorage` no está permitido para esto (constitución V) y no es transaccional |
| Service worker | RF-015: abrir la aplicación sin red | Sin él, la pantalla no carga sin conexión |
| `auth.motivoSesionInvalida` | EV-041: indicar el rechazo por baja | Responder 401 no permite distinguir la baja de una sesión caducada |
| `scripts/perf/consumos.mjs` | Medir RNF-002 | Medir a mano no es repetible |
