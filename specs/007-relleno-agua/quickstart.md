# Validación: Relleno de agua y aguador del mes (F8)

Detalles en [plan.md](plan.md), [data-model.md](data-model.md) y [contracts/rutas.md](contracts/rutas.md).

## Requisitos previos

- F3, F5 y F6 terminadas. Intervalo mínimo por defecto (60 min).

## Comprobaciones automáticas

1. `npx vitest run src/lib/server/rellenos src/lib/server/estadisticas`.
2. `npm run verify` (migración nueva).
3. `npm run test:e2e:quick -- e2e/flujos/agua.spec.ts`; proyectos `sin-js`, `acceso` y `a11y`.

## Escenarios manuales

| Paso | Resultado esperado | Criterio |
| --- | --- | --- |
| Ana abre `/` sin rellenos | «Sin rellenos registrados» | CA-170 |
| Ana pulsa «He rellenado el agua» | «Relleno registrado» con «Deshacer» 5 s; «Último: Ana, hace un momento» | CA-171 |
| Luis pulsa 20 min después | «Ana la rellenó hace 20 min»; no se registra | CA-172 |
| Ana anula su relleno; Luis vuelve a pulsar | Se registra el de Luis | CA-172 |
| Modo avión | Botón desactivado y «Necesitas conexión para registrar el relleno» | CA-173 |
| Ana intenta anular un relleno de hace 20 min (plazo de 15) | «Pídeselo a un administrador» | CA-174 |
| Luis abre Estadísticas → Equipo | Ranking con número por persona | CA-175 |
| Reloj simulado al 1 de noviembre (prueba de integración) | Ana y Jorge aguadores de octubre; resumen con su nombre | CA-176 |
