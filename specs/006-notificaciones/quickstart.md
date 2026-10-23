# Validación: Notificaciones (F5)

Detalles en [plan.md](plan.md), [data-model.md](data-model.md) y [contracts/](contracts/).

## Requisitos previos

- F2, F3, F4 y F6 terminadas.
- Claves VAPID de desarrollo generadas con el comando de `scripts/` y puestas en `.env` (nunca en el repositorio).

## Comprobaciones automáticas

1. `npx vitest run src/lib/server/notificaciones src/lib/server/plataforma/planificador.test.ts src/lib/server/economia/recordatorio-deuda.test.ts src/lib/server/estadisticas/resumen-mensual.test.ts`.
2. `npm run verify` (migración, entorno y `plataforma/` cambian).
3. `npm run test:e2e:quick -- e2e/flujos/perfil-notificaciones.spec.ts e2e/flujos/avisos.spec.ts e2e/flujos/ayuda.spec.ts`; proyectos `sin-js`, `acceso` y `a11y`.

## Revisión manual en dispositivos

| Paso | Resultado esperado | Criterio |
| --- | --- | --- |
| Android, Chrome: «Activar notificaciones» en `/ayuda` | Pide permiso; tras aceptarlo, «Activado en este dispositivo» | RF-100 |
| Un tipo entra en stock bajo | Un push en menos de 1 minuto; tres consumos más no envían otro | CA-023 |
| iPhone con Safari, sin instalar | El botón explica que hay que añadirla a la pantalla de inicio | CA-106 |
| iPhone con la PWA instalada (iOS ≥ 16.4) | El push llega; al pulsarlo se abre la ruta del aviso | RF-100 |
| Permiso denegado en el navegador | `/perfil` lo explica y enlaza a `/ayuda`; los avisos solo aparecen en la campana | CA-100 |
| Desactivar «Stock bajo» en `/perfil` | No llega el push; el aviso aparece en la campana | CA-102, D14-2 |
| Abrir la campana | Los nuevos pasan a «Anteriores» en la siguiente apertura | RF-107 |
