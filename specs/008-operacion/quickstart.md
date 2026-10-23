# Validación: Operación (F7)

Detalles en [plan.md](plan.md), [data-model.md](data-model.md) y [contracts/rutas.md](contracts/rutas.md). El procedimiento completo de producción estará en `docs/operacion.md`.

## Requisitos previos

- F1 y F5 terminadas (planificador y aviso `fallo_copia`).
- Para la demostración: un bucket S3 de pruebas con su regla de ciclo de vida y credenciales en `.env` (nunca en el repositorio).

## Comprobaciones automáticas

1. `npx vitest run src/lib/server/copias src/lib/server/configuracion`.
2. `npm run verify` (migración y entorno cambian).
3. `npm run test:e2e:quick -- e2e/flujos/admin-configuracion.spec.ts e2e/flujos/admin-copias.spec.ts`; proyectos `sin-js`, `acceso` y `a11y`.
4. Imagen local: `docker build --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) -t becafe:local .`; arrancarla con un volumen y comprobar `/api/salud`, el evento de arranque con versión y commit, y que los datos siguen tras `docker restart`.

## Demostración de restauración (EV-070)

| Paso | Resultado esperado |
| --- | --- |
| Lanzar la copia con el reloj de la tarea o esperar a las 03:00 | Archivo en `becafe/AAAA/MM/` del bucket; copia «correcta» en `/admin/copias` |
| `npm run copia:verificar -- <archivo>` | `integrity_check` correcto, migraciones al día, totales de saldos |
| Restaurar en un entorno aparte según `docs/operacion.md` | La aplicación arranca con los mismos saldos |
| Anotar la prueba en `/admin/copias` | Desaparece el aviso de 100 días |
| Cambiar `S3_SECRET_KEY` por una incorrecta y forzar la copia | Copia «fallida» con `S3_CREDENCIALES`; aviso a los administradores; el log no contiene la clave |
