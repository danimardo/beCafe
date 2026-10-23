# Implementation Plan: Saldos y estadísticas (F6)

**Branch**: `main` (AGENTS.md §9) | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md) (aprobada el 2026-10-22)

**Estado**: plan aprobado por la persona usuaria el 2026-10-22, con las decisiones propuestas. Las decisiones están en la sección Clarifications de la spec.

**Artefactos**: decisiones D1 a D10 en este archivo; consultas y datos en [data-model.md](data-model.md); rutas en [contracts/rutas.md](contracts/rutas.md); validación en [quickstart.md](quickstart.md).

**Depende de** F4 (`movimiento`, registros económicos, `/saldos`) y F3 (`consumo`, `/historial` mínimo). F8 añade después los rellenos al historial y a las estadísticas.

## Summary

F6 completa `/saldos` (saldos de todos y últimos movimientos) y `/historial` (todos los registros económicos con filtros, «Míos» con el detalle de movimientos y «Mostrar anulados»), y crea `/estadisticas` (personales y del equipo, por tipo y por mes, con los invitados aparte).

Todo es de solo lectura. Los saldos se calculan siempre desde `movimiento`, sin caché (orden de prioridad 1 sobre 4). Las consultas de los registros están en `economia` (dueño de las tablas); el módulo `estadisticas` compone periodos, meses de Madrid, ceros y permisos.

## Technical Context

**Language/Version**: TypeScript 6 estricto; Node 24 LTS.

**Primary Dependencies**: las existentes. Sin dependencias nuevas: las gráficas usan `BarChart` y `SplitBar` de `lib/ui`.

**Storage**: SQLite. Sin tablas nuevas. Una migración de índices solo si la medición de D9 lo exige (constitución IX: medir antes de optimizar).

**Testing**: Vitest (`servidor`): unidad para periodos y meses de Madrid; integración para las consultas; ruta con evento falso para los filtros. Playwright: flujos, `sin-js` (filtros con GET), `acceso` (EV-050), `a11y`.

**Target Platform**: la de la aplicación.

**Performance Goals**: RNF-003 (30 usuarios y varios años sin cambios de diseño); primera pantalla de lectura dentro del objetivo de RNF-002 (spec, «Carga»).

**Constraints**: filtros como `<form method="get">` (constitución XVII); periodos en hora de Madrid (constitución V); gráficas con alternativa en texto o tabla (RNF-001).

**Scale/Scope**: 30 usuarios, unos 10 000 consumos al año.

## Constitution Check

| Principio | Cumplimiento en F6 | Estado |
| --- | --- | --- |
| I. Fuente vigente | Comportamiento de la spec. Los huecos están en D10 | Cumple, con D10 pendiente |
| II. Complejidad | Sin tablas, sin caché, sin dependencias. Índices solo si la medición los pide | Cumple |
| III. Separación | Consultas de registros en `economia`; composición y permisos de estadísticas en `estadisticas`; rutas finas | Cumple |
| IV. Integridad | Saldos derivados del libro en cada petición | Cumple |
| V. Fechas | Meses y años en `Europe/Madrid` con funciones de `lib/shared/fechas` | Cumple |
| VI. Validación | Consulta de cada página con `z.strictObject` | Cumple |
| X. Usabilidad | Estados vacío, cargando, error y sin conexión en cada pantalla | Cumple |
| XI. Accesibilidad | Importes con signo y texto («a favor», «debe»); gráficas con tabla alternativa | Cumple |
| XVII. SvelteKit | `load` en `+page.server.ts`; filtros GET; sin *actions* nuevas salvo la anulación ya existente | Cumple |

**Resultado:** la puerta se supera.

## Architecture Check (`ARCHITECTURE.md` §15)

1. **Constitución:** sí.
2. **Ubicaciones:** `economia/historial.ts` y `economia/saldos.ts` (consultas); módulo nuevo `src/lib/server/estadisticas/` (`index.ts`, `consultas.ts`, `dominio/periodos.ts`); `lib/shared/fechas/meses.ts` (límites de un mes o un año de Madrid en UTC); rutas `(app)/saldos`, `(app)/historial`, `(app)/estadisticas`, `(app)/estadisticas/[usuarioId=ulid]`.
3. **Grafo:** usa la arista `estadisticas → economia` ya prevista en §4. Sin aristas nuevas. `estadisticas → rellenos` llega con F8.
4. **Reutilización:** `MovementList`, `MovementRow`, `MovementDetailSheet`, `Pagination`, `SegmentedControl`, `SelectField`, `Switch`, `KpiTile`, `BarChart`, `SplitBar`, `ListRow`, `Avatar`, `Money`, `EmptyState`, `Skeleton`, `ErrorPage`.
5. **Piezas nuevas:** el módulo `estadisticas` (ya previsto en §3) y `lib/shared/fechas/meses.ts`.
6. **Reglas:** RN-060, RN-061 y RN-062 con dueño y prueba; RN-010 (saldo) ya probado en F4.
7. **Repetición y fallos:** solo lectura; no hay efectos pendientes.
8. **Fuentes:** la spec fija los periodos (mes, año, «desde el principio»). `docs/diseno/screen-layouts.md` §2.4 dice «Semana · Mes · Año»: manda la spec y el diseño se actualiza en el lote de cierre.
9. **Autorización:** `estadisticas.leerPersonales(actor, usuarioId)` exige `actor.usuarioId === usuarioId` o rol administrador, comprobado en cada petición (un cambio de rol se nota en la siguiente). Entran en EV-050: `/estadisticas/[usuarioId]` con rol miembro y persona ajena, además de `/saldos`, `/historial` y `/estadisticas`.
10. **Afectados:** F8 (rellenos en historial y estadísticas, mismos periodos), F5 (resumen mensual reutiliza las consultas de consumo del mes).
11. **Migraciones:** como mucho, una de índices (D9).
12. **Datos y formularios:** solo `load`; filtros GET sin JavaScript.
13. **Eventos:** ninguno nuevo; los rechazos de permiso usan `auth.permiso_denegado`.
14. **Pantallas:** estados en [contracts/rutas.md](contracts/rutas.md); todas en `a11y`.

## Decisiones

### D1. Saldos (`/saldos`, CA-110, CA-111)

- `economia.leerSaldos(actor)`: una consulta agrupada sobre `movimiento` vigente, unida a los usuarios activos (`usuarios.listarUsuarios`). Una persona sin movimientos aparece con 0,00 €. Las personas dadas de baja no aparecen (RF-110).
- Orden: la persona con sesión primero («(tú)»), después por nombre.
- Solo la fila propia es un enlace, a `/historial?quien=mios` (CA-111).
- «Últimos movimientos»: los 5 registros más recientes del historial que esa persona puede ver con «Todo» (D10-2), con enlace a `/historial`.
- Mantiene lo de F4: tarjeta de la hucha con el último arqueo, «Aportar» y anulación de aportaciones propias.

### D2. Historial (`/historial`, RF-111 a RF-113)

- `economia.leerHistorial(actor, filtros)`: una consulta `UNION ALL` sobre `aportacion`, `compra`, `arqueo`, `linea_recuento`, `reparto` (de arqueo, recuento y baja), `regularizacion` y `consumo`, con columnas comunes (tipo, id, fecha, autor, importe, estado, anulación). Orden por fecha descendente y `id`.
- **Filtros** (`<form method="get">`): `quien` (`todo` | `mios`), `tipo` (`todos`, `consumos` solo con `mios`, `aportaciones`, `compras`, `control`), `anulados` (casilla), `pagina`. Cambiar un filtro vuelve a la página 1. Con `quien=todo` y `tipo=consumos`, el tipo vuelve a `todos` (diseño §8.2).
- **«Todo»:** aportaciones, compras, arqueos, recuentos, repartos y regularizaciones de todos (RN-060). Los consumos ajenos no aparecen para un miembro (D10-1); un administrador sí los ve, como en el `/historial` de F3.
- **«Míos»:** los registros propios y el detalle de los movimientos del saldo propio con su origen (RF-112, CA-112), con `economia.leerMovimientosPropios(actor, filtros)`.
- **Anulados** (RN-062): ocultos por defecto; con la casilla, marcados con autor, fecha y motivo (CA-113).
- **Paginación:** 20 por página, con desplazamiento (`LIMIT`/`OFFSET`). Con la escala de RNF-003 no hace falta paginación por clave.
- **Detalle:** `MovementDetailSheet` con JavaScript; sin JavaScript, cada fila enlaza a la página del registro (`/compras/[id]`, `/saldos/aportaciones/[id]`, `/consumos/[id]`). Arqueos, recuentos y repartos enlazan a `/historial/control/[id]` (nuevo, solo lectura).

### D3. Estadísticas (`/estadisticas`, RF-120 a RF-123)

- **Periodos** (Clarifications 1): `mes` (con `mes=AAAA-MM`), `anio` (con `anio=AAAA`) y `todo`. Valor inicial: el mes en curso.
- `estadisticas/dominio/periodos.ts` (puro): convierte un periodo en límites UTC con `lib/shared/fechas/meses.ts`, y genera la lista de meses del periodo para rellenar con 0 los meses sin consumos (Clarifications 2). «Desde el principio» va del mes del primer consumo al mes actual.
- **Hora que cuenta:** la hora del toque (`hora_gesto`), en hora de Madrid (D10-3). Un consumo del 31 a las 23:59 de Madrid cuenta en ese mes.
- **Personales** (`/estadisticas` con «Mías», o `/estadisticas/[usuarioId]`): cafés propios (sin invitados), invitados aparte, gastado (suma de `precio_aplicado` de los consumos vigentes del periodo, invitados incluidos), consumos por mes y por tipo. Solo consumos vigentes (RN-035).
- **Equipo** (RF-120): cafés de miembros por mes y por tipo; invitados en una sección aparte, sin sumarse (diseño). Incluye a las personas dadas de baja (RN-046, spec Assumptions).
- **Administradores** (RF-123): `SelectField` «Persona» en «Mías», que envía a `/estadisticas/[usuarioId]`.
- `economia.contarConsumos(db, { desde, hasta, usuarioId? })` devuelve filas agregadas por tipo, mes de Madrid e invitado. Para agrupar por mes de Madrid, la consulta trae los consumos del intervalo y agrupa en `estadisticas` con `meses.ts` (unos miles de filas; sin funciones de zona horaria en SQLite).

### D4. Permisos (RN-060, RN-061)

| Dato | Quién lo ve |
| --- | --- |
| Saldos de activos, hucha, historial «Todo» | Cualquier miembro |
| «Míos» y detalle de movimientos | La propia persona |
| Consumos ajenos en el historial | Administradores |
| Estadísticas del equipo | Cualquier miembro |
| Estadísticas personales de una persona | Esa persona y los administradores; si no, 403 «sin permiso» sin datos (CA-122) |

### D5. Gráficas accesibles

`BarChart` y `SplitBar` llevan nombre accesible y, debajo, una tabla con los mismos valores (RNF-001). El color no es la única señal: cada barra tiene su número.

### D6. Estados de pantalla

Vacío (`EmptyState`: «Todavía no hay movimientos», «Sin consumos en este periodo»), cargando (`Skeleton` durante la navegación), error («No se ha podido cargar…»), sin conexión (`Banner offline`: «Necesitas conexión para ver los datos actualizados»).

### D7. Detalle de arqueos, recuentos y repartos

`/historial/control/[id=ulid]`: página de solo lectura con el arqueo o la línea de recuento, su reparto (personas e importes) y su anulación. Visible para todos (RN-060: los repartos son parte del historial).

### D8. Fechas de Madrid (`lib/shared/fechas/meses.ts`)

`limitesDeMes(mes: Mes)` y `limitesDeAnio(anio)` devuelven `[inicio, fin)` como `InstanteUtc`, calculados con `Intl.DateTimeFormat` y la zona `Europe/Madrid` (también en los cambios de horario de marzo y octubre). `mesDeInstante(instante)` da el `Mes` de Madrid. Pruebas con los dos cambios de horario y con las 23:59 del último día.

### D9. Rendimiento (RNF-003, «Carga» de la spec)

- `scripts/perf/lectura.mjs` (extiende el script de F3): siembra 30 usuarios y tres años de registros (unos 30 000 consumos), y mide el p95 de `/saldos`, `/historial` y `/estadisticas?periodo=todo`.
- Objetivo: p95 de 1 s o menos (RNF-002). Si no se alcanza, se mide la consulta y se añaden índices con la migración `0003` (por ejemplo, `consumo (hora_gesto)` y `consumo (usuario_id, hora_gesto)`).

### D10. Decisiones de la persona usuaria

1. **Consumos ajenos en el historial.** Un miembro no ve los consumos de los demás en el historial, porque son datos de consumo personal (RN-061); RN-060 cubre aportaciones y compras. Un administrador sí los ve. (El diseño §8.2 ya lo plantea así.)
2. **«Últimos 5 movimientos» de `/saldos`.** Son los 5 registros más recientes del historial «Todo», no los movimientos del saldo propio.
3. **Hora de las estadísticas.** Cuenta la hora del toque, no la de recepción: un consumo hecho sin conexión el 31 a las 23:50 y enviado el día 1 cuenta en el mes del toque.
4. **Periodos.** Se aplica la spec (mes, año, «desde el principio») y no el diseño (semana, mes, año). Se actualiza `docs/diseno/screen-layouts.md` §2.4.
5. **Tamaño de página del historial.** 20 registros (diseño §8.2, pendiente de confirmar).

## Pruebas

| Regla o escenario | Nivel | Archivo previsto |
| --- | --- | --- |
| D8 (meses de Madrid, cambios de horario) | Unidad | `lib/shared/fechas/meses.test.ts` |
| Periodos, ceros, «desde el principio» (Clarifications 1 y 2) | Unidad | `estadisticas/dominio/periodos.test.ts` |
| CA-110, CA-111 (baja oculta, persona sin movimientos) | Integración + E2E | `economia/saldos.test.ts`, `e2e/flujos/saldos.spec.ts` |
| CA-112 (todos los orígenes) | Integración | `economia/historial.test.ts` |
| CA-113, RN-062 | Integración + E2E | `economia/historial.test.ts`, `e2e/flujos/historial.spec.ts` |
| CA-120, CA-121, RF-123 (invitados, anulados, fin de mes) | Integración | `estadisticas/consultas.test.ts` |
| CA-122, EV-050, cambio de rol | Integración + `acceso` | `estadisticas/consultas.test.ts`, `e2e/acceso/rutas.ts` |
| Filtros sin JavaScript | `sin-js` | `e2e/sin-js/historial.spec.ts` |
| RNF-001 | `a11y` claro y oscuro | `e2e/a11y/saldos-estadisticas.spec.ts` |
| D9 | Carga | `scripts/perf/lectura.mjs` |

## Lotes de implementación (orientativo)

| Lote | Contenido | CA/EV | Cierre |
| --- | --- | --- | --- |
| F6-L1 Fechas y periodos | `meses.ts`, `periodos.ts` | Clarifications 1 y 2 | `test:changed` |
| F6-L2 Saldos | `leerSaldos`, `/saldos` completo | CA-110, CA-111 | `test:changed` + E2E |
| F6-L3 Historial | `leerHistorial`, `leerMovimientosPropios`, filtros, detalle de control | CA-112, CA-113 | `test:changed`, `sin-js` |
| F6-L4 Estadísticas | Módulo `estadisticas`, `/estadisticas`, `/estadisticas/[usuarioId]` | CA-120 a CA-122 | `test:changed`, `acceso` |
| F6-L5 Rendimiento | `scripts/perf/lectura.mjs`; índices si hacen falta | RNF-003 | Carga (+ `verify` si hay migración) |
| F6-L6 Cierre | `ARCHITECTURE.md`, `docs/diseno`, benchmark | Todos | `verify` + benchmark |

## Cambios en otros documentos

| Documento | Cambio | Lote |
| --- | --- | --- |
| `ARCHITECTURE.md` | §3: módulo `estadisticas` creado. §2: `lib/shared/fechas/meses.ts`. §14: `perf:seed` y `perf:load` hechos | F6-L6 |
| `docs/diseno/screen-layouts.md` | §2.4: periodos de la spec (D10-4) | F6-L6 |
| `specs/005-saldos-estadisticas/spec.md` | Clarifications con las decisiones de D10 aprobadas | Antes de `tasks.md` |

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La consulta `UNION ALL` del historial se vuelve lenta con años de datos | Medición de D9; índices por fecha en cada tabla si hace falta |
| Un mes de Madrid mal calculado en el cambio de horario | Pruebas de D8 con las fechas de marzo y octubre |
| Un administrador degradado sigue viendo estadísticas ajenas | El permiso se calcula en cada petición desde la sesión |

## Complexity Tracking

| Pieza | Problema concreto | Alternativa más simple descartada porque… |
| --- | --- | --- |
| Módulo `estadisticas` | `ARCHITECTURE.md` §3 lo prevé para las consultas de solo lectura de consumo y rellenos | Ponerlas en `economia` mezclaría F8 (rellenos) con el núcleo económico |
| `lib/shared/fechas/meses.ts` | Meses y años de Madrid en UTC, también en el cambio de horario | Agrupar en SQL por la fecha UTC cuenta mal los consumos de la última hora del mes |
| Página `/historial/control/[id]` | Ver el reparto de un arqueo o recuento sin JavaScript | Solo la hoja de detalle exige JavaScript |
