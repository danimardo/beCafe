# Validación: Consumos (F3)

Detalles en [plan.md](plan.md) y en los contratos de [contracts/](contracts/).

## Requisitos previos

- F4 terminada (tablas `consumo`, `movimiento`, `aviso_economia`; compras con coste medio).
- Siembra E2E con al menos un tipo comprado (con coste medio) y uno nunca comprado.

## Comprobaciones automáticas

1. `npx vitest run src/lib/server/economia/consumos.test.ts` y `src/routes/api/consumos` pasan.
2. `npm run test:componentes` incluye la cola (`idb` real) y `UndoToast`.
3. `npm run test:e2e:quick -- e2e/flujos/consumos.spec.ts e2e/flujos/consumos-sin-conexion.spec.ts` en `chromium-movil`; `sin-js`, `api`, `acceso` y `a11y` pasan.
4. `node scripts/perf/consumos.mjs` deja un p95 de 1 s o menos.

## Escenarios manuales

| Paso | Resultado esperado | Criterio |
| --- | --- | --- |
| Ana toca Ristretto (stock 10, 0,3483 €) | Stock 9; cargo de 0,35 €; toast de 5 s con «Deshacer» anunciado | CA-011 a CA-013 |
| Ana pulsa «Deshacer» | Consumo anulado «Deshecho por el autor»; stock 10 | CA-013 |
| Ana toca el botón de invitado | Cargo a Ana; marcado como invitado | CA-014 |
| Sin red, Ana toca un tipo | «Pendiente de enviar» y aviso de RF-019; al volver la red, se envía una vez con la hora del toque | CA-015, CA-016 |
| Sin red, Ana toca y pulsa «Deshacer» | El consumo sale de la cola y no llega al servidor | CA-063 |
| Luis toca un tipo con stock 0 | Stock −1; cargo del último coste; aviso de descuadre; aviso registrado | CA-017 |
| Ana anula un consumo de hace 10 min, y lo intenta con uno de hace 20 min | Anulado; el segundo se rechaza con «Pídelo a un administrador» | CA-060, CA-062 |
| Luis, dado de baja con consumos en cola, abre la aplicación | Los consumos aparecen «rechazados»; su saldo sigue en 0 | EV-041 |
| En un iPhone con la PWA instalada y sin red, Ana abre la aplicación | La pantalla principal abre y el toque va a la cola | RF-015, RNF-013 |
