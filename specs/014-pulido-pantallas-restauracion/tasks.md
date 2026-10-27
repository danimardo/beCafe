# Tareas: F14 — Pulido de pantallas, restauración de copias y Capsulito más vivo

**Fuente:** [spec.md](spec.md) y [plan.md](plan.md), aprobados en la sesión del 2026-10-26. Sin benchmark completo al cerrar (decisión de la persona usuaria).

## Fase 1: Restauración de copias (US1, US2) — P1

- [x] T001 [US1] Cliente S3 con `listar` y `descargar` en `src/lib/server/copias/subida-s3.ts`; códigos nuevos en `esquema.ts`/`errores.ts`; prueba del análisis del listado en `subida-s3.test.ts`.
- [x] T002 [US1] `mantenimiento` y `reiniciar` en `Ambiente` (`src/lib/server/plataforma/ambiente.ts`, `reinicio.ts`); 503 en `src/hooks.server.ts` para peticiones que no son `GET`/`HEAD` durante la restauración.
- [x] T003 [US1] Caso de uso `restaurarCopia` en `src/lib/server/copias/restauracion.ts` (resguardo, descarga, suma, integridad, versión, `pendiente.json`, reinicio) con pruebas de integración EV-113 en `restauracion.test.ts`.
- [x] T004 [US1] `aplicarRestauracionPendiente` en `src/lib/server/copias/aplicar-restauracion.ts`, llamada desde `src/lib/server/arranque.ts` antes de abrir la base; auditoría `copia.restaurada`; prueba EV-112 en `restauracion.test.ts`.
- [x] T005 [US1] Ruta `src/routes/(app)/admin/copias/restaurar/[...clave]/` (`+page.server.ts`, `+page.svelte`, prueba de la *action*) y lista de copias en `src/routes/(app)/admin/copias/`.
- [x] T006 [US2] Textos de «Anotar una prueba de restauración», aviso de la última restauración y «Volver a Administración» en `src/lib/shared/textos.ts` y `admin/copias/+page.svelte`.
- [x] T007 [US1] E2E en `e2e/flujos/admin-copias.spec.ts` (CA-253 sin S3, CA-257) y ruta nueva en la suite `acceso`.

## Fase 2: Inicio estable (US3) — P1

- [x] T008 [US3] `ordenarSegunVisita` en `src/lib/shared/capsulas/orden-visita.ts` con prueba de propiedades; uso en `src/routes/(app)/+page.svelte`; E2E CA-258.

## Fase 3: Capsulito (US4, US5) — P2

- [x] T009 [US4] Cinco gestos e instantes en `src/lib/shared/mascota/reposo.ts` (+ prueba CA-259) y contador de 0,5 s en `src/lib/ui/Capsulito.svelte`.
- [x] T010 [US4] `bostezoMano` y `tocarReloj` en `docs/diseno/f12/rive/generar-reposo.mjs`; compilar `static/mascota/capsulito.riv`; capturas de los cinco gestos.
- [x] T011 [US5] `--sonido agua` en `scripts/generar-sonido.mjs`; 4 candidatos y uno provisional en `static/mascota/sonidos/agua.mp3`; `celebrar(…, 'agua')` en `src/lib/ui/contextos/mascota.svelte.ts` y en Inicio; precarga del service worker; prueba CA-260.
- [x] T012 **Parada**: la persona usuaria elige el sonido del agua y revisa las capturas de los gestos.

## Fase 4: Pantallas (US6, US7) — P2/P3

- [x] T013 [US6] Componente `src/lib/ui/DosColumnas.svelte` y su uso en Usuarios, Arqueos y recuentos, Cápsulas, Compras y Avisos; ancho `wide` para `/avisos`.
- [x] T014 [US7] Avisos pendientes resaltados con «Nuevo» (CA-262) y stock en Compras (`economia/compras.ts`, CA-263).
- [x] T015 [US6] E2E `e2e/flujos/columnas-f14.spec.ts` (CA-261 a 1280 y 390 px, CA-262, CA-263) con axe en claro y oscuro.

## Fase 5: Corto (US8) — P3

- [x] T016 [US8] `src/lib/ui/Corto.svelte` a pantalla completa con la portada difuminada, «Saltar» en una esquina y la transcripción en una hoja; sin `<track>` ni `static/corto/subtitulos.vtt`; ajustar `exportar-web.mjs`, sus pruebas, las del componente y `e2e/flujos/corto-f13.spec.ts` (CA-264, CA-265).

## Fase 6: Cierre

- [x] T017 Documentación: `ARCHITECTURE.md` (módulo `copias`, `DosColumnas`), `docs/operacion.md` §6 (restaurar desde la aplicación, reinicio del contenedor) y `docs/pruebas.md`.
- [x] T018 `npm run verify` y E2E afectados; anotar en `.local/verification/runs.jsonl`; revisar `git status`.
