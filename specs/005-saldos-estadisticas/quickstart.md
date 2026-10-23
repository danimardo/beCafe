# Validación: Saldos y estadísticas (F6)

Detalles en [plan.md](plan.md), [data-model.md](data-model.md) y [contracts/rutas.md](contracts/rutas.md).

## Requisitos previos

- F3 y F4 terminadas. Siembra E2E con aportaciones, compras, un arqueo, consumos (algunos de invitado y alguno anulado) y una persona dada de baja.

## Comprobaciones automáticas

1. `npx vitest run src/lib/shared/fechas src/lib/server/estadisticas src/lib/server/economia/historial.test.ts src/lib/server/economia/saldos.test.ts`.
2. `npm run test:e2e:quick -- e2e/flujos/saldos.spec.ts e2e/flujos/historial.spec.ts`; proyectos `sin-js`, `acceso` y `a11y`.
3. `node scripts/perf/lectura.mjs`: p95 de 1 s o menos en `/saldos`, `/historial` y `/estadisticas?periodo=todo`.

## Escenarios manuales

| Paso | Resultado esperado | Criterio |
| --- | --- | --- |
| Luis abre `/saldos` | Saldos de los activos (no la persona de baja), hucha y 5 últimos registros; solo su fila es un enlace | CA-110, CA-111 |
| Luis pulsa su fila | `/historial?quien=mios` con sus movimientos y su origen | CA-112 |
| Luis activa «Mostrar anulados» | Aparecen los anulados con autor, fecha y motivo | CA-113 |
| Luis abre `/estadisticas`, vista Equipo, año | Consumos por mes (con 0 en los meses vacíos) y por tipo; invitados aparte | CA-120 |
| Ana abre sus estadísticas del mes; un administrador abre las de Ana | Las mismas cifras | CA-121 |
| Luis abre `/estadisticas/<id de Ana>` | «Sin permiso», sin datos | CA-122 |
| Sin JavaScript, Luis cambia los filtros del historial | La página se recarga con los filtros aplicados | Constitución XVII |
