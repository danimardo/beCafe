# Tareas: F16 — Registro de quién instala la aplicación

**Fuente:** [spec.md](spec.md) y [plan.md](plan.md), aprobados el 2026-10-27. Constitución 1.9.0. Sin benchmark completo al cerrar, salvo que se pida.

## Fase 1: Lo ya implementado (US2) — P2

- [x] T001 [US2] Nombrar con CA-276 y CA-277 las pruebas existentes de `src/lib/client/instalacion.test.ts` y `e2e/flujos/ajustes.spec.ts` (hoy CA-206). Commit del código ya hecho (captura temprana en `hooks.client.ts`, diagnóstico en Ajustes).

## Fase 2: Estado en el servidor (US1) — P1

- [x] T002 [US1] Dominio puro `src/lib/server/usuarios/dominio/instalacion.ts` (`siguienteEstadoInstalacion`). Prueba de propiedades EV-116 y CA-280.
- [x] T003 [US1] Tabla `instalacion_app` en `src/lib/server/usuarios/esquema.ts` (`usuario_id` clave primaria y foránea; `CHECK (estado IN ('instalada', 'rechazada'))`; `instante` UTC) y migración `drizzle/0010_f16-instalacion.sql` con drizzle-kit.
- [x] T004 [US1] Evento `instalacion.registrada` en `plataforma/registro.ts`. Casos de uso `registrarInstalacion` y `leerInstalacion` en `src/lib/server/usuarios/instalacion.ts`, exportados en `index.ts`. Integración CA-278, CA-280, CA-281 (permiso) y CA-283.
- [x] T005 [US1] Contrato `src/lib/shared/contratos/instalacion.ts` (`z.strictObject({ estado: z.enum(['instalada', 'rechazada']) })`) y *action* `registrarInstalacion` en `src/routes/(app)/+page.server.ts`. Prueba con evento falso (CA-279).

## Fase 3: Cliente y ficha (US1) — P1

- [ ] T006 [US1] `+layout.server.ts` devuelve `instalacion` (estado propio). Componente `src/routes/(app)/RegistroInstalacion.svelte` montado en `+layout.svelte`; envía `instalada` o `rechazada` según RF-279 sin reenviar. Prueba de componente y textos en `textos.ts`.
- [ ] T007 [US1] Línea de estado en la ficha `admin/usuarios/[usuarioId=ulid]` (`load` y `+page.svelte`). E2E `e2e/flujos/instalacion-f16.spec.ts` (CA-279, CA-281) y axe en claro y oscuro de la ficha.

## Fase 4: Privacidad (US1) — P1

- [ ] T008 [US1] `VERSION_PRIVACIDAD = 5` y líneas nuevas en `src/lib/shared/privacidad.ts`. Ajustar las pruebas afectadas (CA-224, CA-282).

## Fase 5: Cierre

- [ ] T009 Documentación: `ARCHITECTURE.md` (tabla `instalacion_app`, `RegistroInstalacion`) y `docs/pruebas.md` (cómo se prueba F16).
- [ ] T010 `npm run verify` y E2E afectados; anotar en `.local/verification/runs.jsonl`; revisar `git status`.

## Dependencias

- T002 → T004. T003 → T004 → T005 → T006 → T007.
- T008 es independiente. T010 va después de todas.

## Estrategia

MVP: fases 2 y 3 (el dato y su vista). La fase 4 va antes de desplegar, porque el dato es personal.
