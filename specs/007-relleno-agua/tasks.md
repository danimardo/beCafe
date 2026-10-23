# Tareas: Relleno de agua y aguador del mes (F8)

**Entrada**: [plan.md](plan.md) (aprobado el 2026-10-22), [spec.md](spec.md) (Clarifications 1 a 7), [data-model.md](data-model.md), [contracts/rutas.md](contracts/rutas.md), [quickstart.md](quickstart.md).

**Nota**: la carpeta `007-relleno-agua` es la funcionalidad F8 de `historias.md` §15.

**Requisito previo**: F3 (patrón de toque y «Deshacer», estado de conexión), F5 (planificador, `ejecucion_tarea`, resumen mensual) y F6 (periodos, historial, estadísticas) terminadas.

**Pruebas**: obligatorias (constitución VIII). INV-07 y EV-100 con prueba de concurrencia real.

**Reglas para quien implementa**: las de `specs/003-economia/tasks.md`. Además: `rellenos` no importa `economia` y `economia` no conoce los rellenos (RN-080); un relleno nunca entra en la cola sin conexión (RN-081).

## Formato: `[ID] [P?] [Historia] Descripción`

---

## Fase 1: Preparación

- [ ] T001 [P] Añadir el código `RELLENO_RECIENTE` (409) a `src/lib/server/plataforma/errores.ts` y `errores-http.ts`, y a `src/lib/shared/textos.ts` los textos de la tarjeta (diseño `docs/diseno/screen-layouts.md` §8.1): «He rellenado el agua», «Último: {nombre}, {hace}», «Sin rellenos registrados», «Relleno registrado — Gracias por ocuparte del agua», «{nombre} la rellenó {hace}», «Tú la rellenaste {hace}», «Necesitas conexión para registrar el relleno», «Aguador de {mes}: {nombres}», «(¡tú!)», y `formatearHace(desde, ahora)` en `src/lib/shared/fechas/formato.ts` («hace un momento», «hace N min», «hace N h», «hace N días») con pruebas.
- [ ] T002 [P] Añadir a `src/lib/server/plataforma/registro.ts` los eventos `relleno.registrado`, `relleno.anulado`, `relleno.rechazado_intervalo` y `aguador.determinado` (info; campos: ids, mes, número de personas; sin nombres).
- [ ] T003 [P] Crear `src/lib/shared/contratos/rellenos.ts`: `esquemaRellenar` (`z.strictObject({ clienteId: esquemaUlid })`), `esquemaDeshacerRelleno` (`rellenoId`), `esquemaAnulacionRelleno` (`motivo` recortado de 1 a 200). Pruebas.

---

## Fase 2: Fundamentos

- [ ] T004 Crear el módulo `src/lib/server/rellenos/` con `esquema.ts`: `relleno_agua` y `aguador_mes` exactamente como `data-model.md` (`cliente_id` único; `estado` `vigente`/`anulado` con el `CHECK` de campos de anulación; `motivo_anulacion` de 1 a 200; índices `(estado, registrado_en)` y `(usuario_id, registrado_en)`; `aguador_mes` con clave primaria `(mes, usuario_id)` y `rellenos > 0`). Generar la migración `drizzle/NNNN_f8-rellenos.sql` (siguiente número libre), revisar que solo añade tablas e incluir el esquema en `drizzle.config.ts`. Comprobar en `.dependency-cruiser.cjs` las aristas `rellenos → usuarios`, `rellenos → configuracion` y `estadisticas → rellenos`. `npm run verify`.
- [ ] T005 Pruebas primero en `src/lib/server/rellenos/registrar.test.ts` con reloj simulado: `CA-172` (relleno de Ana hace 20 min con intervalo 60 → `RELLENO_RECIENTE` con autor e instante; si se anula el de Ana, se acepta), límite exacto (a los 60 min se acepta; a los 59:59, no; Clarifications 7), intervalo 0 → siempre se acepta (Clarifications 4), cambio de intervalo → se aplica al siguiente (INV-07), duplicado por `clienteId`, autor siempre el actor (RN-080), `RN-080` (saldos, stock y hucha iguales antes y después), persona de baja → no puede registrar.
- [ ] T006 Implementar `registrarRelleno(ambiente, actor, { clienteId })` en `src/lib/server/rellenos/registrar.ts` (plan D1): una transacción; duplicado por `cliente_id`; persona activa; intervalo con `leerConfiguracion` (si es 0, sin comprobación); último relleno vigente; `ahora − último < intervalo` → `ErrorDeNegocio('RELLENO_RECIENTE', { autorId, registradoEn })` y evento `relleno.rechazado_intervalo`; inserta a nombre de `actor.usuarioId`. Exportar desde `rellenos/index.ts`.
- [ ] T007 Prueba de concurrencia `EV-100/INV-07` en `src/lib/server/rellenos/concurrencia.test.ts` (patrón de `src/lib/server/economia/concurrencia.test.ts`): dos `worker_threads` registran a la vez → un relleno vigente y la otra transacción rechazada. Propiedad con `fast-check` en `registrar.test.ts`: tras una secuencia aleatoria de registros y anulaciones con reloj creciente, entre dos rellenos vigentes consecutivos nunca hay menos que el intervalo.

---

## Fase 3: US1 — Registrar que he rellenado el agua (P1) 🎯 MVP

**Objetivo**: tarjeta de agua en la página de inicio con toque, «Deshacer», rechazo y estado sin conexión.

**Prueba independiente**: Ana pulsa → «Último: Ana, hace un momento»; Luis 20 min después → «Ana la rellenó hace 20 min».

- [ ] T008 [US1] Implementar `leerEstadoAgua(db, actor, ahora)` en `src/lib/server/rellenos/consultas.ts`: último relleno vigente (autor, instante, `esPropio`) y aguadores del mes anterior de `aguador_mes` (con `esPropio`). Pruebas `CA-170` en `consultas.test.ts` (último de Jorge, sin rellenos, último anulado → el anterior vigente).
- [ ] T009 [US1] Pruebas primero de «Deshacer» en `src/lib/server/rellenos/anular.test.ts`: `CA-171` (deshacer a los 4 s → anulado con «Deshecho por el autor», deja de contar), fuera de plazo → `FUERA_DE_PLAZO`, ajeno → `SIN_PERMISO`.
- [ ] T010 [US1] Implementar en `src/lib/server/rellenos/anular.ts`: `anularRelleno(ambiente, actor, id, motivo)` (autor dentro del plazo de autoanulación o administrador siempre, también rellenos de personas de baja (Clarifications 6); `UPDATE … WHERE id = ? AND estado = 'vigente'`, 0 filas → `YA_ANULADO`; evento `relleno.anulado`) y `deshacerRelleno(ambiente, actor, id)` (motivo fijo «Deshecho por el autor»).
- [ ] T011 [US1] Ampliar `src/routes/(app)/+page.server.ts`: `load` con `agua` (`leerEstadoAgua`, antigüedad con `formatearHace`) y un `clienteId` para el relleno; *actions* `rellenar` (`esquemaRellenar`; `RELLENO_RECIENTE` → `fail(409, { codigo, autor, esPropio, hace })`) y `deshacerRelleno`. Pruebas con evento falso en `src/routes/(app)/page.server.test.ts`.
- [ ] T012 [US1] Ajustar `src/lib/ui/WaterRefillCard.svelte` para recibir el estado por props y el formulario: `<form method="post" action="?/rellenar">` con `clienteId` oculto y botón `soft` a ancho completo (no primario); línea de rechazo con `role="alert"`; con `enConexion = false`, botón desactivado y «Necesitas conexión para registrar el relleno» (CA-173); franja del aguador con trofeo y texto, solo si hay título. Integrar en `src/routes/(app)/+page.svelte` encima de las cápsulas, con `use:enhance` (ULID nuevo en cada pulsación), `UndoToast` de 5 s y, sin JavaScript, `Banner` con «Deshacer». Un fallo de red al enviar muestra el texto de sin conexión y nunca usa la cola.
- [ ] T013 [US1] Prueba de componente `src/lib/ui/WaterRefillCard.test.ts` (Vitest Browser Mode): estados normal, rechazado, sin conexión, sin rellenos, con y sin aguador, «(¡tú!)».

---

## Fase 4: US2 — Corregir un relleno (P2)

**Objetivo**: anulación con motivo desde el historial y desde `/rellenos/[id]`.

**Prueba independiente**: CA-174.

- [ ] T014 [US2] Pruebas `CA-174` en `src/lib/server/rellenos/anular.test.ts` (Ana a los 10 min con plazo 15 → anulado; a los 20 min → `FUERA_DE_PLAZO` con «Pídeselo a un administrador»; administrador a los 3 días → anulado), RN-083 (anulado no cuenta en el intervalo ni en el ranking).
- [ ] T015 [US2] Ruta `src/routes/(app)/rellenos/[rellenoId=ulid]/+page.server.ts` y `+page.svelte`: detalle (autor, fecha, estado, anulación, «No mueve dinero: solo cuenta para el ranking de rellenos y el aguador del mes») y *action* `anular` (`esquemaAnulacionRelleno`; sin permiso → `error(403)`; `YA_ANULADO` y `FUERA_DE_PLAZO` → `fail(409)`); `puedeAnular` calculado por el caso de uso (`leerRelleno(db, actor, id)`). `VoidDialog` con JavaScript. Prueba con evento falso en `page.server.test.ts`.
- [ ] T016 [US2] Historial mezclado (plan D6): implementar `leerRellenos(db, actor, { quien, anulados, limite })` en `src/lib/server/rellenos/consultas.ts` y `leerHistorial(db, actor, filtros)` en `src/lib/server/estadisticas/historial.ts`, que pide a `economia.leerHistorial` y a `rellenos.leerRellenos` los primeros `pagina × 20` de cada uno, los mezcla por fecha descendente e `id`, corta la página y suma los totales; con `tipo=rellenos`, solo rellenos; con `tipo` económico, solo `economia`. Pruebas en `estadisticas/historial.test.ts` (orden, página 2 correcta, totales, filtros).
- [ ] T017 [US2] Cambiar `src/routes/(app)/historial/+page.server.ts` para llamar a `estadisticas.leerHistorial`, añadir el tipo «Rellenos de agua» al `SelectField` (y `rellenos` al enum de `esquemaConsultaHistorial`), fila con icono de gotas y sin importe, `MovementDetailSheet` con el texto «No mueve dinero…» y enlace a `/rellenos/[id]` sin JavaScript. Enlace «Ver rellenos recientes» de la tarjeta → `/historial?tipo=rellenos`.

---

## Fase 5: US3 — Ranking de rellenos y aguador del mes (P2)

**Objetivo**: ranking en estadísticas y título del mes fijado el día 1.

**Prueba independiente**: CA-175 y CA-176.

- [ ] T018 [US3] Implementar `contarRellenos(db, { desde, hasta, usuarioId? })` en `src/lib/server/rellenos/consultas.ts` (rellenos vigentes, incluidos los de personas de baja; RN-085).
- [ ] T019 [US3] Pruebas primero en `src/lib/server/estadisticas/consultas.test.ts`: `CA-175` (ranking del periodo con número por persona, anulados fuera, persona de baja con marca, relleno a las 23:59 del último día de Madrid en ese mes; KPI de rellenos propios).
- [ ] T020 [US3] Ampliar `leerEquipo` y `leerPersonales` en `src/lib/server/estadisticas/consultas.ts` con el ranking y el KPI, y las páginas `src/routes/(app)/estadisticas/+page.svelte` y `[usuarioId=ulid]/+page.svelte`: tarjeta «Rellenos de agua» con «1. Jorge Gil · 7», barra proporcional con número y texto, «· baja» (diseño §8.4 con los periodos de la spec); cuarto `KpiTile` «rellenos de agua».
- [ ] T021 [US3] Pruebas primero en `src/lib/server/rellenos/dominio/aguador.test.ts` y `src/lib/server/rellenos/aguador.test.ts`: `elegirAguadores` (máximo; empate de dos y de tres → todos; ningún relleno → vacío; persona de baja cuenta en el conteo pero no opta; persona reactivada después del día 1 no opta); `CA-176` (octubre: Ana 6, Jorge 6, Luis 4 → Ana y Jorge en `aguador_mes`; mes sin rellenos → sin filas; anulación posterior al día 1 → sin cambios (Clarifications 1); servidor parado el día 1 → `recuperar()` lo determina una vez; dos arranques → una vez).
- [ ] T022 [US3] Implementar `src/lib/server/rellenos/dominio/aguador.ts` (`elegirAguadores(conteos, activos)`, puro) y `determinarAguador({ db, reloj })` en `src/lib/server/rellenos/aguador.ts`: en una transacción, `marcarEjecucion('aguador_mes', mesAnterior)` (si devuelve `false`, termina), cuenta los vigentes del mes anterior con `limitesDeMes`, elige con los activos de `usuarios` e inserta las filas; evento `aguador.determinado`. Registrar la tarea el día 1 a las 00:05 de Madrid con periodo `AAAA-MM` en `src/lib/server/arranque.ts`, **antes** del resumen mensual (Clarifications 5). `leerAguador(db, mes)` pública.
- [ ] T023 [US3] Añadir el aguador al resumen mensual de F5 en `src/lib/server/estadisticas/resumen-mensual.ts` (`aguadores` con los ids de `leerAguador`) y al mensaje del catálogo de `notificaciones` («Aguador del mes: Ana y Jorge.»). Prueba en `resumen-mensual.test.ts`: recuperación conjunta tras una caída (aguador antes que resumen; el resumen lo incluye).

---

## Fase 6: Pulido y cierre

- [ ] T024 [P] E2E en `e2e/flujos/agua.spec.ts`: CA-170, CA-171, CA-172, CA-173 (con `context.setOffline`), anulación desde el historial, ranking.
- [ ] T025 [P] E2E sin JavaScript en `e2e/sin-js/agua.spec.ts`: rellenar, «Deshacer» con `Banner`, anular con motivo.
- [ ] T026 [P] Añadir `/rellenos/[rellenoId]` a `e2e/acceso/rutas.ts` y axe en claro y oscuro en `e2e/a11y/agua.spec.ts` (tarjeta en todos sus estados, ranking).
- [ ] T027 Sembrar rellenos en `scripts/perf/lectura.mjs` y volver a medir `/historial` (plan, Riesgos).
- [ ] T028 Actualizar `ARCHITECTURE.md` (§3 módulo `rellenos` creado y composición del historial en `estadisticas`; §6 `RELLENO_RECIENTE`; §9 eventos) y `docs/diseno/screen-layouts.md` §8.4 (periodos de la spec).
- [ ] T029 `npm run verify`, benchmark completo y `git status`. Revisión manual con VoiceOver y TalkBack de la tarjeta y del aviso: hacerla o anotarla como pendiente.

---

## Dependencias

- Fase 1 → Fase 2 → US1 → US2 → US3 → Fase 6.

## Estrategia

1. MVP: fases 1 y 2 y US1 (registrar el relleno con intervalo).
2. US2 (anulación e historial), US3 (ranking y aguador) y cierre.
