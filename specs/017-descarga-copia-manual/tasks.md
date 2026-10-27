# Tareas: F17 — Descargar copias, copia manual, origen y registro de restauración

**Fuente:** [spec.md](spec.md) y [plan.md](plan.md), aprobados el 2026-10-27. Constitución 1.9.0. Sin benchmark completo al cerrar, salvo que se pida.

## Fase 1: Documentos y clave de copia

- [x] T001 Aplicar CAMBIO-029 en `historias.md` v0.29.0, con respaldo `.respaldos/historias-v0.28.0-20261027.md`. ADR `docs/adr/0007-descarga-de-copias.md`. Commit.
- [x] T002 [US3] Dominio puro `src/lib/server/copias/dominio/clave-copia.ts`: `construirClave`, `leerClave` (acepta claves antiguas) y `origenDeSistema`. Pruebas unitarias y de propiedades (CA-289).
- [x] T003 [US3] `claveDeCopia` y `claveDeResguardo` usan `construirClave`; `analizarListado` y `CopiaBucket` incluyen `origen` y `tipo`. `ambiente.copias.origen` desde `arranque.ts`. Pruebas de listado con claves nuevas y antiguas.

## Fase 2: Copia manual y descarga en el servidor

- [x] T004 [US2] Columna `tipo` en `copia_seguridad` y migración `drizzle/0011_f17-tipo-copia.sql` (`DEFAULT 'diaria'`, `CHECK`). `ejecutarCopia` extraído de `copia-diaria.ts`; la diaria no cambia de comportamiento.
- [x] T005 [US2] `hacerCopiaManual(ambiente, actor)` en `copias/copia-manual.ts`: permiso, sin S3, una `en_curso` rechaza (`EN_CURSO`), auditoría `copia.manual`. Códigos `SIN_S3`, `NO_ENCONTRADA` y `EN_CURSO` en `errores.ts`. Integración: sube, aparece como manual, dos a la vez, fallo, sin permiso, la diaria no se bloquea (CA-286, CA-287, CA-288).
- [x] T006 [US1] `ClienteS3.abrir(clave)` en flujo y `descargarCopia` en `copias/descarga.ts`; auditoría `copia.descargada` en `usuarios/auditoria.ts`. Integración: íntegra, 404, clave inválida, sin permiso (CA-284, CA-285).

## Fase 3: Eventos de copia y restauración

- [x] T007 [US4] Catálogo de eventos de D4 en `plataforma/registro.ts`. `restauracionId` opcional en `esquemaPendiente` y en `aplicar-restauracion.ts`. `restaurarCopia` emite un evento por paso y registra el `paso` del fallo; `verificarCopia` aporta las versiones de esquema. `copia.completada` y `copia.fallida` añaden `tipo` y `origen`.
- [x] T008 [US4] Pruebas con fallo inyectado por paso (EV-117, CA-291, CA-292) y marca antigua sin `restauracionId`.

## Fase 4: Pantallas

- [ ] T009 [US1] [US2] [US3] `/admin/copias`: «Descargar», «Hacer copia ahora» con confirmación, etiquetas «Manual» y origen. Ruta `descargar/[...clave]/+server.ts`. *Action* `?/copiaManual`. Textos en `textos.ts`. Pruebas de la *action* y de la ruta con evento falso.
- [ ] T010 [US3] Confirmación de `restaurar/[...clave]` con ambos orígenes y `Banner` si difieren (CA-290).
- [ ] T011 Ruta de descarga en `e2e/acceso/rutas.ts` (EV-050). E2E `flujos/copias-f17`, `sin-js` del botón y axe en claro y oscuro.

## Fase 5: Cierre

- [ ] T012 `ARCHITECTURE.md` y `docs/pruebas.md`. `npm run verify` completo y E2E afectados; anotar en `.local/verification/runs.jsonl`; revisar `git status`; informe final.

## Dependencias

- T002 y T003 van antes de T005, T006 y T009. T004 va antes de T005. T007 va después de T003.
- T012 va después de todas.
