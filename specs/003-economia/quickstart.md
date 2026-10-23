# Validación: Economía (F4)

Guía para comprobar que F4 funciona de extremo a extremo. Los detalles están en [plan.md](plan.md), [data-model.md](data-model.md) y [contracts/rutas.md](contracts/rutas.md).

## Requisitos previos

- F1 y F2 terminadas; `npm run verify` pasa.
- Migración `0002` aplicada (se aplica al arrancar).
- Siembra E2E con un administrador (Ana), dos miembros (Luis, Marta) y al menos dos tipos de cápsula activos.

## Comprobaciones automáticas

1. `npm run check` y `npm run arch` pasan sin advertencias.
2. `npx vitest run src/lib/server/economia` pasa, con cobertura de `economia` y `dominio/` al 90 % o más.
3. `npm run test:mutacion` (piloto) termina y deja la puntuación de mutación de `economia/dominio/` en `.local/verification/`.
4. `npm run test:e2e:quick -- e2e/flujos/economia.spec.ts` y los proyectos `sin-js`, `acceso` y `a11y` pasan.

## Escenarios manuales

| Paso | Resultado esperado | Criterio |
| --- | --- | --- |
| Luis aporta 5,00 € en `/saldos` con saldo −4,00 € y hucha 10,00 € | Saldo +1,00 €; hucha 15,00 € | CA-030 |
| Luis intenta aportar 0 €, −3 € y 500,01 € | Tres rechazos en el campo importe | CA-031 |
| Marta registra en `/compras` 50 Ristretto por 17,00 € y 20 Decaf por 7,00 € | Total 24,00 €; stock y coste medio actualizados; el saldo de Marta no cambia | CA-040 a CA-042 |
| Marta registra una compra de 20,00 € con hucha 12,00 € | «La hucha debería tener 12,00 €»; tras confirmar, hucha −8,00 € y aviso registrado | CA-043 |
| Ana anula una compra con consumos preparados posteriores | Resumen de regularizaciones por persona; coste medio reconstruido | CA-045 |
| Ana registra en `/admin/control` un arqueo con 35,00 € y hucha 42,00 € | Vista previa: −7,00 € entre los activos; tras confirmar, cargos que suman 7,00 € y hucha 35,00 € | CA-080, CA-081 |
| Ana cuenta 24 Ristretto con stock 30 a 0,4000 € | Stock 24; reparto de 2,40 € | CA-090, CA-091 |
| Ana intenta anular un arqueo que no es el último | `NO_ES_EL_ULTIMO` | CA-064 |
| Ana da de baja a Luis (−6,00 €) con deuda incobrable | Luis con saldo 0 y de baja; 6,00 € repartidos entre los demás; sesiones de Luis cerradas | CA-135 |
| Con 16 minutos desde la última contraseña, Ana intenta un arqueo | La pantalla pide la contraseña | CA-138 |
| Luis abre `/admin/control` y `/admin/usuarios/…/baja` | «Sin permiso» | EV-050 |

## Comprobación de integridad

Tras los escenarios, el recálculo de `existencia` desde los registros vigentes coincide con lo guardado (INV-02). La prueba de propiedades EV-030 lo comprueba en cada ejecución de `npm run test`.
