# Tareas: Saldos y estadísticas (F6)

**Entrada**: [plan.md](plan.md) (aprobado el 2026-10-22), [spec.md](spec.md) (Clarifications 1 a 7), [data-model.md](data-model.md), [contracts/rutas.md](contracts/rutas.md), [quickstart.md](quickstart.md).

**Requisito previo**: F4 y F3 terminadas (`movimiento`, registros económicos, `consumo`, `/saldos` y `/historial` mínimos).

**Pruebas**: obligatorias (constitución VIII). Cada CA del alcance tiene una prueba que lo nombra. F6 es de solo lectura: los saldos siempre se calculan desde `movimiento`, sin caché.

**Reglas para quien implementa**: las de `specs/003-economia/tasks.md`. Además: filtros con `<form method="get">` y `z.strictObject` (nunca `goto` ni `requestSubmit()`); ningún `UNION` ni consulta lee tablas de otro módulo; las fechas de calendario usan `Europe/Madrid`.

## Formato: `[ID] [P?] [Historia] Descripción`

---

## Fase 1: Preparación

- [X] T001 Crear `src/lib/shared/fechas/meses.ts` (plan D8): `limitesDeMes(mes: Mes): { desde: InstanteUtc; hasta: InstanteUtc }` (intervalo `[desde, hasta)`), `limitesDeAnio(anio: number)`, `mesDeInstante(instante: InstanteUtc): Mes` y `mesesEntre(desde: Mes, hasta: Mes): Mes[]`, calculados con `Intl.DateTimeFormat` y la zona `Europe/Madrid`. Usar los tipos `Mes` e `InstanteUtc` de `src/lib/shared/fechas/tipos.ts`. Sin `new Date()` para «ahora»: el instante actual llega por parámetro.
- [X] T002 Pruebas en `src/lib/shared/fechas/meses.test.ts`: el último domingo de marzo y de octubre (cambios de horario), las 23:59 del 31 de octubre en Madrid pertenecen a octubre, las 00:00 del 1 de noviembre a noviembre, `mesesEntre` con cambio de año.

---

## Fase 2: Fundamentos

- [X] T003 Crear el módulo `src/lib/server/estadisticas/` con `index.ts` y `dominio/periodos.ts` (puro): `type Periodo = { tipo: 'mes'; mes: Mes } | { tipo: 'anio'; anio: number } | { tipo: 'todo' }`; `limitesDePeriodo(periodo, primerMes: Mes | null, mesActual: Mes)` (con `todo`, del primer mes con consumos al mes actual; sin consumos, vacío); `rellenarMeses(serie: Map<Mes, number>, meses: Mes[]): { mes: Mes; valor: number }[]` (meses sin datos con 0; Clarifications 2). Pruebas en `dominio/periodos.test.ts` (mes, año, todo, ceros, año sin datos).
- [X] T004 Comprobar en `.dependency-cruiser.cjs` que la arista `estadisticas → economia` está permitida y `estadisticas` no importa tablas de otros módulos; ejecutar `npm run arch`.
- [X] T005 [P] Crear `src/lib/shared/contratos/estadisticas.ts` con `esquemaConsultaHistorial` y `esquemaConsultaEstadisticas` exactamente como en `contracts/rutas.md` (`z.strictObject`; `quien` `todo`/`mios` por defecto `todo`; `tipo` `todos`/`consumos`/`aportaciones`/`compras`/`control` por defecto `todos`; `anulados` `'on'` opcional; `pagina` `z.coerce.number().int().min(1).default(1)`; `vista` `mias`/`equipo`; `periodo` `mes`/`anio`/`todo` por defecto `mes`; `mes` opcional; `anio` `z.coerce.number().int().min(2026)` opcional). Pruebas en `estadisticas.test.ts` (clave extra rechazada, valores por defecto).

---

## Fase 3: US1 — Ver los saldos de todos y el historial económico (P1) 🎯 MVP

**Objetivo**: `/saldos` completa y `/historial` con filtros, «Míos» y anulados.

**Prueba independiente**: CA-110 a CA-113.

- [X] T006 [US1] Pruebas primero en `src/lib/server/economia/saldos.test.ts`: `CA-110` (saldos de las personas activas; la persona de baja no aparece; una persona sin movimientos con 0), orden (la propia primero, después por nombre), `esPropia`, hucha con último arqueo, `CA-111` (solo la fila propia lleva enlace: el dato `esPropia` lo permite).
- [X] T007 [US1] Implementar `leerSaldos(db, actor)` en `src/lib/server/economia/saldos.ts` (plan D1): una consulta agrupada sobre `movimiento` vigente de `cuenta = 'persona'` unida en memoria con `usuarios.listarUsuarios` (solo activos). Exportar.
- [X] T008 [US1] Pruebas primero en `src/lib/server/economia/historial.test.ts`: `CA-112` (con `quien=mios`, todos los orígenes de movimientos propios: consumo, aportación, reparto de arqueo, reparto de recuento, regularización, devolución), `CA-113/RN-062` (anulados ocultos por defecto; con `anulados` aparecen con autor, fecha y motivo), Clarifications 3 (un miembro no ve consumos ajenos en «Todo»; un administrador sí), `tipo=consumos` con `quien=todo` → se trata como `todos`, paginación de 20 (Clarifications 7) con total, orden por fecha descendente e `id`.
- [X] T009 [US1] Implementar en `src/lib/server/economia/historial.ts` (plan D2): `leerHistorial(db, actor, filtros)` con una consulta `UNION ALL` sobre `aportacion`, `compra`, `arqueo`, `linea_recuento`, `reparto`, `regularizacion` y `consumo` con columnas comunes (`tipo`, `id`, `fecha`, `autorId`, `importe` según la tabla «Entrada del historial» de `data-model.md`, `estado`, `anuladoPor`, `anuladoEn`, `motivo`), `LIMIT 20 OFFSET (pagina − 1) × 20` y un `COUNT` para el total; `leerMovimientosPropios(db, actor, filtros)`; `leerRegistroDeControl(db, actor, id)` (arqueo o línea de recuento con su reparto por persona y su anulación; `RecursoNoEncontrado` si no existe). Nombres de autor con `usuarios`. Exportar.
- [X] T010 [US1] Completar `src/routes/(app)/saldos/+page.server.ts` y `+page.svelte`: lista de saldos (`ListRow` con `Avatar` y `Money` con signo y texto «a favor»/«debe»; «(tú)» en la propia, que enlaza a `resolve('/historial') + '?quien=mios'`), hucha y últimos 5 registros de `leerHistorial(actor, { quien: 'todo' })` con enlace a `/historial` (Clarifications 4). Mantener la aportación de F4.
- [X] T011 [US1] Ampliar `src/routes/(app)/historial/+page.server.ts` y `+page.svelte`: valida la consulta con `esquemaConsultaHistorial` (si no es válida, usa los valores por defecto y muestra un aviso; no `error`); filtros en un `<form method="get">` con `SegmentedControl` Todo/Míos, `SelectField` de tipo (Consumos solo con «Míos»), `Switch` «Mostrar anulados» y botón «Aplicar» (sin JavaScript); con JavaScript, el formulario GET se envía con `data-sveltekit-keepfocus`. `MovementList`, `Pagination` (cambiar un filtro vuelve a la página 1), `MovementDetailSheet` con JavaScript; sin él, enlaces a `/compras/[id]`, `/saldos/aportaciones/[id]`, `/consumos/[id]` o `/historial/control/[id]`. Estados de plan D6.
- [X] T012 [P] [US1] Ruta `src/routes/(app)/historial/control/[id=ulid]/+page.server.ts` y `+page.svelte` (plan D7): detalle de solo lectura del arqueo o la línea de recuento, su reparto por persona y su anulación; 404 si no existe.
- [X] T013 [US1] Prueba del `load` de filtros: como no se prueba el `load` exportado (AGENTS.md §7), probar la función de normalización de la consulta (extraerla a `src/routes/(app)/historial/consulta.ts`) en `consulta.test.ts` (consulta inválida → valores por defecto y aviso).

---

## Fase 4: US2 — Ver las estadísticas de consumo (P2)

**Objetivo**: estadísticas personales y del equipo por periodo, con invitados aparte.

**Prueba independiente**: CA-120 a CA-122.

- [X] T014 [US2] Implementar `contarConsumos(db, { desde, hasta, usuarioId? })` en `src/lib/server/economia/consultas-estadisticas.ts`: filas `{ usuarioId, tipoCapsulaId, horaGesto, invitado, precioAplicado }` de consumos **vigentes** con `hora_gesto` en `[desde, hasta)` (Clarifications 5); `primerConsumo(db)`. Exportar desde `economia/index.ts` (solo los usa `estadisticas`).
- [X] T015 [US2] Pruebas primero en `src/lib/server/estadisticas/consultas.test.ts`: `CA-120` (equipo por mes con ceros y por tipo; invitados aparte, sin sumarse), `CA-121` (Ana y un administrador ven las mismas cifras de Ana; los anulados no cuentan; un consumo a las 23:59 del 31 en Madrid cuenta en ese mes), `CA-122` (un miembro pide las de Ana → `SIN_PERMISO`, sin datos), cambio de rol (un administrador degradado deja de ver las de otros en la siguiente llamada), personas de baja incluidas en el equipo, gastado = suma de `precio_aplicado` de los vigentes con invitados.
- [X] T016 [US2] Implementar en `src/lib/server/estadisticas/consultas.ts` (plan D3 y D4): `leerPersonales(db, actor, usuarioId, periodo, ahora)` (permiso: `actor.usuarioId === usuarioId` o administrador; si no, `ErrorDeNegocio('SIN_PERMISO')`; KPI cafés propios sin invitados, invitados, gastado; serie por mes con `rellenarMeses`; reparto por tipo con nombres de `catalogo` vía `economia` si hace falta) y `leerEquipo(db, actor, periodo, ahora)`. Agrupar por mes con `mesDeInstante`. Exportar desde `estadisticas/index.ts`.
- [X] T017 [US2] Rutas `src/routes/(app)/estadisticas/+page.server.ts` y `+page.svelte`, y `src/routes/(app)/estadisticas/[usuarioId=ulid]/+page.server.ts` y `+page.svelte` (`contracts/rutas.md`): consulta con `esquemaConsultaEstadisticas`; filtros GET (vista, periodo, mes o año) con «Aplicar»; `KpiTile`, `BarChart` y `SplitBar` con nombre accesible y una tabla con los mismos valores debajo (plan D5); invitados en una sección aparte; para administradores, `SelectField` «Persona» en un formulario GET que lleva a `/estadisticas/[usuarioId]`. `SIN_PERMISO` → `error(403, 'No tienes permiso para ver estas estadísticas.')`; persona inexistente → 404. Estados de plan D6.

---

## Fase 5: Rendimiento

- [X] T018 Crear `scripts/perf/lectura.mjs` (plan D9; reutiliza la siembra de `scripts/perf/consumos.mjs`): 30 usuarios, tres años de registros (unos 30 000 consumos, aportaciones, compras, un arqueo al mes), p95 de `/saldos`, `/historial` y `/estadisticas?periodo=todo` con sesión, resultado en `.local/verification/`; falla si algún p95 supera 1 s. Script `"perf:lectura"` en `package.json`.
- [X] T019 Ejecutar `npm run perf:lectura`. Solo si falla: medir con `EXPLAIN QUERY PLAN`, añadir los índices candidatos de `data-model.md` en una migración `drizzle/0003_f6-indices.sql` (solo `CREATE INDEX`), volver a medir y ejecutar `npm run verify`. Anotar el resultado en el informe.

---

## Fase 6: Pulido y cierre

- [X] T020 [P] E2E en `e2e/flujos/saldos.spec.ts` y `e2e/flujos/historial.spec.ts` con una siembra con aportaciones, compras, un arqueo, consumos con invitado y uno anulado, y una persona de baja: CA-110, CA-111, CA-112, CA-113, CA-120, CA-121. Desviación (23-10-2026): el spec está en `e2e/flujos/saldos-historial.spec.ts` (no en `saldos.spec.ts`/`historial.spec.ts`) y cubre CA-110, CA-111 y CA-112. CA-113, CA-120 y CA-121 tienen prueba de integración o unitaria con su CA en el nombre, pero no E2E: un flujo E2E de anulación compartiría estado con otras pruebas del mismo worker.
- [X] T021 [P] E2E sin JavaScript en `e2e/sin-js/historial.spec.ts`: filtros del historial y de estadísticas con «Aplicar».
- [X] T022 [P] Añadir a `e2e/acceso/rutas.ts` `/historial/control/[id]`, `/estadisticas` y `/estadisticas/[usuarioId]` (miembro y persona ajena → 403; CA-122).
- [X] T023 [P] axe en claro y oscuro en `e2e/a11y/saldos-estadisticas.spec.ts` para `/saldos`, `/historial` y `/estadisticas` (RNF-001).
- [X] T024 Actualizar `ARCHITECTURE.md` (§3 módulo `estadisticas` creado; §2 `lib/shared/fechas/meses.ts`; §14 `perf:seed` y `perf:load`) y `docs/diseno/screen-layouts.md` §2.4 (periodos mes, año y «desde el principio»; Clarifications 6).
- [X] T025 Comprobar cobertura (80 % en `lib/server` y `lib/shared`, 90 % en `dominio/`), `npm run verify`, benchmark completo y `git status`.

---

## Dependencias

- Fase 1 → Fase 2 → US1 y US2 (independientes entre sí) → Fase 5 → Fase 6.

## Estrategia

1. MVP: fases 1 y 2 y US1 (saldos e historial).
2. US2 (estadísticas), medición y cierre.
