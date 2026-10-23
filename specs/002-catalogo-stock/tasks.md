# Tareas: Catálogo de tipos de cápsula y stock (F2)

**Plan**: [plan.md](plan.md) (aprobado el 2026-10-22). **Modelo**: [data-model.md](data-model.md).

Estado a 2026-10-22: implementación y verificación automática hechas; quedan las pruebas de extremo a extremo de las pantallas nuevas y la autorización del CAMBIO de `historias.md` §10.4 (ver «Pendiente»).

## Hechas

- [X] T-F2-01 Dependencia `sharp` 0.35.5 y comprobación de binarios en Linux (plan D5).
- [X] T-F2-02 Migración `0001_f2-catalogo-stock`: `tipo_capsula`, `existencia`, `entrada_stock_bajo` (solo añade tablas).
- [X] T-F2-03 Módulo `catalogo`: datos descriptivos (alta, edición, estado, borrado) y lectura de la foto con sesión (RF-001, RF-003, RF-004, RF-006).
- [X] T-F2-04 Módulo `economia`: reglas puras de stock bajo y estimación (`dominio/stock.ts`, RN-071, RN-073).
- [X] T-F2-05 Módulo `economia`: existencias, transiciones y entradas de stock bajo (RF-023, RN-072, INV-02).
- [X] T-F2-06 Casos de uso de alta, edición, retirada, reactivación y borrado con permiso de administrador (RF-001 a RF-006, RNF-007).
- [X] T-F2-07 Procesamiento de fotos con `sharp`: tipo real, redimensión y metadatos quitados (RF-005) en `plataforma/imagenes.ts`.
- [X] T-F2-08 Panel de avisos de stock bajo (solo activos) y estimación en la pantalla principal (RF-021, RF-022).
- [X] T-F2-09 Rutas `/admin/capsulas`, `/admin/capsulas/nueva`, `/admin/capsulas/[capsulaId]` con *actions* sin JavaScript, y `/fotos/[capsulaId]` con sesión.
- [X] T-F2-10 Pruebas: CA-001 a CA-006, CA-020 a CA-023 (parciales según la spec), INV-02, EV-050 (caso de uso y suite `acceso`).
- [X] T-F2-11 `npm run verify` en verde: formato, lint, tipos, arquitectura, 193 pruebas de servidor con cobertura, 3 de componentes y build.

## Pendiente

- [x] T-F2-12 Pruebas E2E de las pantallas nuevas (`chromium-movil`), `sin-js` del alta y de la edición, axe en claro y oscuro (constitución XI, RNF-001).
- [x] T-F2-13 Prueba de concurrencia de dos altas con el mismo nombre con `worker_threads` (constitución VIII). La unicidad ya la garantiza el índice único y la prueba de la rama `NOMBRE_DUPLICADO`.
- [X] T-F2-14 CA-006 con registro: se repite en F3 cuando exista `consumo` (plan D8). Hecha en F4 (T016, `capsulas.test.ts`).
- [X] T-F2-15 CA-020 y CA-023 con consumos reales: se repiten en F3 (T016, `src/lib/server/economia/capsulas.test.ts`, bloque «stock bajo con consumos reales»).
- [X] T-F2-16 CAMBIO-015 de `historias.md` §10.4 (plan D1), autorizado el 22-10-2026, con respaldo en `.respaldos/`.
- [X] T-F2-17 Decisión del 22-10-2026: un tipo dado de alta con stock 0 queda en stock bajo, sin registrar entrada.
