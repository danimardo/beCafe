# Implementation Plan: Relleno de agua y aguador del mes (F8)

**Branch**: `main` (AGENTS.md §9) | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md) (aprobada el 2026-10-22)

**Estado**: plan aprobado por la persona usuaria el 2026-10-22, con las decisiones propuestas. Las decisiones están en la sección Clarifications de la spec.

**Artefactos**: decisiones D1 a D11 en este archivo; tablas en [data-model.md](data-model.md); rutas en [contracts/rutas.md](contracts/rutas.md); validación en [quickstart.md](quickstart.md).

**Nota de numeración**: la carpeta `007-relleno-agua` contiene la funcionalidad F8 de `historias.md` §15. F7 (operación) está en `008-operacion`.

**Depende de** F3 (patrón de «Deshacer» y de anulación, estado de conexión del cliente), F5 (planificador, `ejecucion_tarea`, resumen mensual) y F6 (periodos, historial, estadísticas).

## Summary

F8 crea el módulo `rellenos`: el botón «He rellenado el agua» en la página de inicio, el intervalo mínimo entre rellenos con garantía ante pulsaciones simultáneas (INV-07), «Deshacer» y anulación con el mismo patrón que los consumos, el ranking en las estadísticas y el aguador del mes, que una tarea fija el día 1 y no se recalcula.

Un relleno no toca dinero (RN-080): el módulo no depende de `economia` y `economia` no lo conoce.

## Technical Context

**Language/Version**: TypeScript 6 estricto; Node 24 LTS.

**Primary Dependencies**: las existentes. Sin dependencias nuevas.

**Storage**: SQLite. Migración `NNNN_f8-rellenos.sql` (siguiente número libre): `relleno_agua` y `aguador_mes`.

**Testing**: Vitest: unidad (antigüedad «hace N», selección del aguador), integración con SQLite real (intervalo, anulación, aguador, recuperación), concurrencia con `worker_threads` (EV-100), ruta con evento falso. Vitest Browser Mode: estados de `WaterRefillCard`. Playwright: flujos, `sin-js`, red desactivada (CA-173), `a11y`, `acceso`.

**Target Platform**: la de la aplicación.

**Performance Goals**: el registro del relleno, como un consumo: 1 s o menos en el p95 (RNF-002).

**Constraints**: requiere conexión; no entra en la cola (RN-081). Sin movimientos (RN-080).

**Scale/Scope**: unos pocos rellenos al día.

## Constitution Check

| Principio | Cumplimiento en F8 | Estado |
| --- | --- | --- |
| I. Fuente vigente | RN-063, RN-080 a RN-085 y la spec. Huecos en D11 | Cumple, con D11 pendiente |
| II. Complejidad | Un módulo ya previsto en §3, dos tablas y una tarea | Cumple |
| III. Separación | `rellenos` solo depende de `usuarios` y `configuracion`; la composición del historial y las estadísticas va en `estadisticas` | Cumple |
| IV. Integridad | Sin dinero. Registro idempotente por `cliente_id`; anulación en lugar de borrado | Cumple |
| V. Fechas | Meses de Madrid con `lib/shared/fechas/meses.ts` (F6) | Cumple |
| VI. Validación | *Actions* con `z.strictObject` | Cumple |
| X. Usabilidad | Un toque; «Deshacer» 5 s; rechazo con autor y antigüedad; botón no primario (diseño §8.1) | Cumple |
| XI. Accesibilidad | Confirmación y rechazo anunciados; ranking con número y texto, no solo barra | Cumple |
| XVII. SvelteKit | `<form method="post">` con *actions*; funciona sin JavaScript (salvo la cuenta atrás) | Cumple |

**Resultado:** la puerta se supera.

## Architecture Check (`ARCHITECTURE.md` §15)

1. **Constitución:** sí.
2. **Ubicaciones:** módulo `src/lib/server/rellenos/` (`index.ts`, `esquema.ts`, `registrar.ts`, `anular.ts`, `consultas.ts`, `aguador.ts`, `dominio/aguador.ts`); `estadisticas/historial.ts` (composición, D6); contrato `lib/shared/contratos/rellenos.ts`; *actions* en `(app)/+page.server.ts`; `(app)/rellenos/[rellenoId=ulid]` (detalle y anulación sin JavaScript).
3. **Grafo:** aristas ya previstas: `rellenos → usuarios`, `rellenos → configuracion`, `estadisticas → rellenos`. Sin aristas nuevas.
4. **Reutilización:** `WaterRefillCard`, `UndoToast`, `ToastRegion`, `VoidDialog`, `MovementRow`, `MovementDetailSheet`, `KpiTile`, `SegmentedControl`.
5. **Piezas nuevas:** el módulo y sus dos tablas, previstos en §3.
6. **Reglas:** RN-080 a RN-085 con dueño `rellenos` y prueba; INV-07 con prueba de concurrencia.
7. **Repetición y fallos:** reenvío con el mismo `cliente_id` devuelve el relleno original; dos pulsaciones simultáneas se serializan con `BEGIN IMMEDIATE`; la tarea del aguador no se duplica (`ejecucion_tarea`).
8. **Fuentes:** la spec. Diseño §8.1, §8.3 y §8.4 adoptados, salvo los periodos «Semana» (manda la spec, como en F6).
9. **Autorización:** registrar: cualquier miembro activo y solo a su nombre (RN-080). Anular: autor en plazo o administrador (RN-083), comprobado en el caso de uso. Ver: todos (RN-063). Rutas nuevas en EV-050: `/rellenos/[rellenoId]`.
10. **Afectados:** F5 (resumen con aguador), F6 (historial y estadísticas), F7 (pantalla del intervalo).
11. **Migraciones:** una, solo de avance.
12. **Datos y formularios:** *actions* `rellenar`, `deshacerRelleno`, `anular`; sin `+server.ts`.
13. **Eventos:** `relleno.registrado`, `relleno.anulado` (info), `relleno.rechazado_intervalo` (info), `aguador.determinado` (info, con el número de personas y el mes, sin nombres).
14. **Pantallas:** estados en [contracts/rutas.md](contracts/rutas.md).

## Decisiones

### D1. Registro (RF-171, RN-080, RN-082, INV-07)

`rellenos.registrarRelleno(ambiente, actor, { clienteId })` en una transacción `BEGIN IMMEDIATE`:

1. Si existe un relleno con ese `cliente_id`, lo devuelve con `duplicado: true`.
2. Lee el intervalo vigente (`configuracion`) y el último relleno vigente. Si `ahora − último.registrado_en < intervalo`, rechaza con `RELLENO_RECIENTE` y devuelve el autor y el instante del último. **Exactamente** al cumplirse el intervalo se acepta (spec, Edge Cases).
3. Inserta el relleno a nombre de `actor.usuarioId`. Nunca acepta otro autor (RN-080).

`BEGIN IMMEDIATE` serializa a los escritores: la segunda transacción ve el relleno de la primera y se rechaza (EV-100). Con el intervalo en 0 no hay comprobación (spec de F7, Clarifications 2).

### D2. Acción en la página de inicio (RF-170, RF-171, RF-173)

- `WaterRefillCard` encima de las cápsulas: «Último: Jorge, hace 3 h» o «Sin rellenos registrados», el botón «He rellenado el agua» (`soft`, no primario) y la franja del aguador.
- El botón es un `<form method="post" action="?/rellenar">` con `clienteId`, igual que el toque de consumo de F3 (D2 de F3): sin JavaScript, el `load` genera el identificador; con JavaScript, `use:enhance` pone uno nuevo en cada pulsación.
- Sin conexión (`navigator.onLine` o el estado de conexión de F3): botón desactivado y «Necesitas conexión para registrar el relleno» (CA-173). Un fallo de red al enviar muestra el mismo texto; nunca va a la cola.
- La antigüedad se calcula en el servidor con el reloj (`hace un momento`, `hace N min`, `hace N h`, `hace N días`) en `lib/shared/textos.ts`; sin temporizador en el cliente.

### D3. Rechazo por intervalo (RF-172)

`fail(409, { codigo: 'RELLENO_RECIENTE', autor, hace })`: la tarjeta muestra con `role="alert"` «Ana la rellenó hace 20 min» o «Tú la rellenaste hace 20 min». Código nuevo `RELLENO_RECIENTE` en el conjunto cerrado de errores.

### D4. «Deshacer» y anulación (RF-174, RN-083)

- **Deshacer:** `UndoToast` de 5 s «Relleno registrado — Gracias por ocuparte del agua», que envía `?/deshacerRelleno`. Sin JavaScript, un `Banner` con «Deshacer» sin cuenta atrás. En el servidor es la anulación del autor en plazo con motivo «Deshecho por el autor» (mismo criterio que F3, D3).
- **Anulación con motivo:** autor dentro del plazo de autoanulación; administrador siempre. `UPDATE … WHERE estado = 'vigente'`; un relleno anulado nunca vuelve a estar vigente. Fuera de plazo: `FUERA_DE_PLAZO` con «Pídeselo a un administrador».
- **Dónde:** `MovementDetailSheet` del historial (diseño §8.3); sin JavaScript, `/rellenos/[rellenoId]` con el formulario de anulación. Un miembro no ve el botón en rellenos ajenos.
- Los rellenos de una persona dada de baja se pueden anular por un administrador (no tienen efectos económicos; D11-3).

### D5. Aguador del mes (RF-176, RN-084, RN-085)

- **Puro** (`rellenos/dominio/aguador.ts`): `elegirAguadores(conteos, activos)` devuelve las personas activas con el máximo de rellenos vigentes; empate → todas; ningún relleno → lista vacía. Las personas de baja cuentan en el ranking pero no optan al título.
- **Tarea** `rellenos.determinarAguador` el día 1 a las 00:05 de Madrid (D11-2), registrada en el planificador de F5 **antes** del resumen mensual (09:00), para que el resumen lo incluya.
- En una transacción: inserta `ejecucion_tarea ('aguador_mes', 'AAAA-MM')` (si ya existe, termina) e inserta en `aguador_mes` una fila por persona con el título y su número de rellenos. Un mes sin rellenos no tiene filas.
- **Fijo** (Clarifications 1): una anulación posterior no cambia `aguador_mes`.
- **Recuperación** (Clarifications 2): al arrancar, el planificador ejecuta primero el aguador y después el resumen, en el orden de registro.
- **Inicio:** la franja muestra el aguador del mes anterior durante todo el mes en curso, con «(¡tú!)» si la persona es una de ellas.
- **Resumen:** `estadisticas.enviarResumenMensual` (F5) lee `rellenos.leerAguador(mes)` y añade `aguadores` (ids) a los datos del aviso; los nombres se ponen al mostrar.

### D6. Historial (RF-175, diseño §8.2 y §8.3)

- Tipo nuevo «Rellenos de agua» en el filtro de `/historial`, visible con «Todo» y con «Míos», sin importe y con el texto «No mueve dinero».
- `economia` no conoce los rellenos. La composición pasa a `estadisticas.leerHistorial(actor, filtros)`: pide a `economia.leerHistorial` y a `rellenos.leerRellenos` los primeros `pagina × 20` registros de cada uno, los mezcla por fecha y corta la página. El total es la suma de los dos totales. Con la escala de RNF-003 (unos miles de registros al año) es suficiente; `scripts/perf/lectura.mjs` lo mide.
- La ruta `/historial` pasa a llamar a `estadisticas.leerHistorial` en lugar de `economia.leerHistorial`.

### D7. Estadísticas (RF-175, CA-175)

- **Equipo:** tarjeta «Rellenos de agua» con el ranking del periodo (mes, año, todo; mismos periodos que F6): «1. Jorge Gil · 7», barra proporcional con número y texto; las personas de baja con «· baja» (RN-085).
- **Mías:** cuarto `KpiTile` «rellenos de agua» con el número del periodo. Con el selector de persona (administradores), los de esa persona.
- `rellenos.contarRellenos(db, { desde, hasta, usuarioId? })`; la agrupación por mes de Madrid usa `meses.ts`, como los consumos.
- El ranking no otorga título (diseño §8.4).

### D8. Permisos (RN-063, RN-080, RN-083)

| Operación | Quién |
| --- | --- |
| Registrar | Cualquier miembro activo, a su nombre |
| Deshacer / anular con motivo | Autor en plazo; administrador siempre |
| Ver último relleno, historial de rellenos, ranking y aguador | Cualquier miembro |

### D9. Estados de la tarjeta

Normal, registrado (`UndoToast`), rechazado por intervalo, sin conexión, sin rellenos, sin aguador (sin franja). Los demás estados de la página de inicio no cambian.

### D10. Concurrencia (EV-100, INV-07)

`rellenos/concurrencia.test.ts`: dos `worker_threads` con su conexión (patrón de T-F2-13, `busy_timeout` 5000, sincronizados con `Atomics`) registran a la vez; queda un relleno vigente y la otra llamada falla con `RELLENO_RECIENTE`. Una segunda prueba comprueba INV-07 sobre todos los rellenos vigentes tras una secuencia aleatoria de registros y anulaciones (`fast-check`).

### D11. Decisiones de la persona usuaria

1. **Intervalo 0.** Ya decidido en la spec de F7 (Clarifications 2: de 0 a 1440 minutos). F7 cambia el esquema de `configuracion` (hoy exige un entero positivo); F8 trata 0 como «sin comprobación». No necesita aprobación aparte.
2. **Hora del aguador.** El día 1 a las 00:05 de Madrid, para que el inicio lo muestre desde primera hora y el resumen de las 09:00 lo incluya.
3. **Anular rellenos de personas de baja.** Un administrador puede (no hay efectos económicos que regularizar, a diferencia de F4 D16-3).
4. **Periodos del ranking.** Mes, año y «desde el principio» (spec, Clarifications 3), no «Semana» del diseño §8.4.

## Pruebas

| Regla o escenario | Nivel | Archivo previsto |
| --- | --- | --- |
| CA-170 (último vigente, sin rellenos, último anulado) | Integración + E2E | `rellenos/consultas.test.ts`, `e2e/flujos/agua.spec.ts` |
| CA-171 («Deshacer» a los 4 s; sin JavaScript) | Componente + E2E + `sin-js` | `WaterRefillCard.test.ts`, `e2e/flujos/agua.spec.ts`, `e2e/sin-js/agua.spec.ts` |
| CA-172 (20 min; anulación del anterior; límite exacto) | Integración con reloj simulado | `rellenos/registrar.test.ts` |
| EV-100, INV-07 | Concurrencia + propiedades | `rellenos/concurrencia.test.ts` |
| CA-173 | E2E con `context.setOffline` | `e2e/flujos/agua.spec.ts` |
| CA-174 (10 y 20 min; administrador a los 3 días) | Integración | `rellenos/anular.test.ts` |
| CA-175 (ranking, anulados, 23:59 de Madrid) | Unidad + integración | `rellenos/consultas.test.ts`, `estadisticas/consultas.test.ts` |
| CA-176 (empate, mes vacío, baja, reactivación, anulación posterior, caída) | Unidad + integración con reloj | `rellenos/dominio/aguador.test.ts`, `rellenos/aguador.test.ts` |
| RN-080 (sin movimientos) | Integración | `rellenos/registrar.test.ts` (saldos, stock y hucha iguales antes y después) |
| Historial mezclado (orden y paginación) | Integración | `estadisticas/historial.test.ts` |
| RNF-001 | `a11y` claro y oscuro | `e2e/a11y/agua.spec.ts` |

## Lotes de implementación (orientativo)

| Lote | Contenido | CA/EV | Cierre |
| --- | --- | --- | --- |
| F8-L1 Módulo y registro | Migración, `registrarRelleno`, intervalo, concurrencia | CA-172, EV-100, INV-07 | `test:changed` + `verify` (migración) |
| F8-L2 Inicio | Tarjeta, *actions*, «Deshacer», sin conexión | CA-170, CA-171, CA-173 | E2E, `sin-js`, `a11y` |
| F8-L3 Anulación | Anulación con motivo, `/rellenos/[id]`, historial mezclado | CA-174 | `test:changed`, `acceso` |
| F8-L4 Ranking y aguador | Estadísticas, tarea del aguador, resumen | CA-175, CA-176 | `test:changed` |
| F8-L5 Cierre | `ARCHITECTURE.md`, `docs/diseno`, benchmark | Todos | `verify` + benchmark |

## Cambios en otros documentos

| Documento | Cambio | Lote |
| --- | --- | --- |
| `ARCHITECTURE.md` | §3: módulo `rellenos` creado; `estadisticas` compone el historial. §6: `RELLENO_RECIENTE`. §9: eventos de rellenos | F8-L5 |
| `docs/diseno/screen-layouts.md` | §8.4: periodos de la spec (D11-4) | F8-L5 |
| `specs/007-relleno-agua/spec.md` | Clarifications con las decisiones de D11 aprobadas | Antes de `tasks.md` |

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Dos rellenos a la vez quedan vigentes | `BEGIN IMMEDIATE` y prueba con `worker_threads` |
| El resumen sale antes que el aguador | Orden de registro y de recuperación; prueba de la recuperación conjunta |
| La mezcla del historial se vuelve lenta | Medición de F6 (`scripts/perf/lectura.mjs`) con rellenos sembrados |

## Complexity Tracking

| Pieza | Problema concreto | Alternativa más simple descartada porque… |
| --- | --- | --- |
| Tabla `aguador_mes` | El título queda fijado el día 1 y no cambia con anulaciones posteriores (Clarifications 1) | Calcularlo al leer cambiaría tras una anulación |
| Composición del historial en `estadisticas` | Mostrar rellenos y registros económicos en una lista sin que `economia` dependa de `rellenos` | Una consulta `UNION` en `economia` leería tablas de otro módulo (AGENTS.md §5) |
