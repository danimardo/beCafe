# Implementation Plan: Operación: copias, configuración y despliegue (F7)

**Branch**: `main` (AGENTS.md §9) | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md) (aprobada el 2026-10-22)

**Estado**: plan aprobado por la persona usuaria el 2026-10-22, con las decisiones propuestas. Las decisiones están en la sección Clarifications de la spec.

**Artefactos**: decisiones D1 a D12 en este archivo; tablas en [data-model.md](data-model.md); rutas en [contracts/rutas.md](contracts/rutas.md); procedimiento de operación y validación en [quickstart.md](quickstart.md).

**Nota de numeración**: la carpeta `008-operacion` contiene la funcionalidad F7 de `historias.md` §15. Se implementa la última del orden acordado y es obligatoria antes de producción.

**Depende de** F1 (configuración con valores por defecto, auditoría, reautenticación, `/api/salud`), F5 (planificador, `ejecucion_tarea`, aviso `fallo_copia`) y F4/F8 (los parámetros que se configuran).

## Summary

F7 deja la aplicación lista para producción:

1. **Copias:** el módulo `copias` hace cada día a las 03:00 de Madrid una instantánea con `VACUUM INTO`, la empaqueta con las fotos en un `.tar.gz`, la sube al bucket S3 con `aws4fetch` y registra el resultado. Un fallo se registra y se avisa a los administradores. `/admin/copias` muestra las últimas copias y permite anotar pruebas de restauración; el panel de administración avisa a los 100 días sin prueba.
2. **Configuración:** `/admin/configuracion`, con reautenticación, cambia los tres parámetros dentro de sus rangos, muestra los tramos del recordatorio de deuda y registra cada cambio en la auditoría.
3. **Despliegue:** `Dockerfile` de varias etapas, imagen verificada en la CI y procedimiento de despliegue y restauración en `docs/operacion.md`.

## Technical Context

**Language/Version**: TypeScript 6 estricto; Node 24 LTS.

**Primary Dependencies**: `aws4fetch` 1.x (solo en `copias/subida-s3.ts`) y `tar` 7.x (solo en `copias/empaquetado.ts`). Las dos están en la tabla de tecnologías de la constitución. F7 las instala.

**Storage**: SQLite. Migración `NNNN_f7-operacion.sql` (siguiente número libre): `copia_seguridad` y `prueba_restauracion`. Archivos temporales en `<directorio de datos>/tmp/`, borrados al terminar.

**Testing**: Vitest: integración con `VACUUM INTO` real y un servidor HTTP S3 falso local que guarda el archivo recibido (CA-140, CA-142; `docs/pruebas.md` §8); reloj simulado (CA-144, recuperación); ruta con evento falso (rangos, reautenticación). Playwright: `/admin/configuracion` y `/admin/copias` (`flujos`, `sin-js`, `a11y`, `acceso`). CI: construcción y prueba de humo de la imagen. Demostración manual de restauración (EV-070).

**Target Platform**: contenedor Docker en Coolify, una instancia (RT-003, RT-010), volumen persistente `/data`.

**Performance Goals**: la copia no bloquea los registros más allá de lo que dura `VACUUM INTO` (milisegundos con la escala del proyecto; se mide en la primera ejecución real).

**Constraints**: credenciales solo en variables de entorno privadas; nunca en el log, en la tabla ni en el repositorio. Los logs no entran en la copia (constitución XVI).

**Scale/Scope**: base de datos de pocos MB y fotos de unos pocos cientos de KB cada una.

## Constitution Check

| Principio | Cumplimiento en F7 | Estado |
| --- | --- | --- |
| I. Fuente vigente | Comportamiento de la spec. Huecos en D12 | Cumple, con D12 pendiente |
| II. Complejidad | Dos dependencias ya aprobadas, un módulo previsto en §3, una tarea. Sin SDK de AWS (DEC-065) | Cumple |
| III. Separación | `copias` aislado; solo avisa con `notificaciones`. `configuracion` anota la auditoría con `usuarios` (arista nueva, D7) | Cumple, con arista nueva |
| IV. Integridad | La copia es una instantánea coherente (`VACUUM INTO`); la restauración se comprueba con los saldos | Cumple |
| V. Almacenamiento | Copia diaria fuera del servidor, restaurable y probada (RNF-009) | Cumple |
| VI. Seguridad | Variables S3 privadas validadas al arrancar; reautenticación en la configuración (RN-050) | Cumple |
| IX. Verificación | La CI construye y prueba la imagen que se despliega | Cumple, con el cambio de CI pendiente de aprobación (D10) |
| XI. Accesibilidad | axe en las dos pantallas nuevas | Cumple |
| XIII. Errores | Códigos cerrados de fallo de copia; el fallo avisa sin bloquear nada | Cumple |
| XVI. Registro | `copia.completada`, `copia.fallida`, `tarea.*` sin credenciales ni URL firmada | Cumple |
| XVII. SvelteKit | *Actions* con formularios que funcionan sin JavaScript | Cumple |

**Resultado:** la puerta se supera, con la arista nueva de D7 y el cambio de `.github/workflows/ci.yml` (archivo protegido) presentados para su aprobación.

## Architecture Check (`ARCHITECTURE.md` §15)

1. **Constitución:** sí.
2. **Ubicaciones:** módulo `src/lib/server/copias/` (`index.ts`, `esquema.ts`, `copia-diaria.ts`, `instantanea.ts`, `empaquetado.ts`, `subida-s3.ts`, `pruebas-restauracion.ts`, `consultas.ts`); `configuracion/cambiar.ts`; rutas `(app)/admin/configuracion`, `(app)/admin/copias`; `Dockerfile`, `.dockerignore`; `docs/operacion.md`; `scripts/copias/verificar-copia.ts`.
3. **Grafo:** `copias → notificaciones` (prevista). **Nueva:** `configuracion → usuarios`, para anotar la auditoría y leer el rol (D7). No crea ciclos: `usuarios` no depende de nadie.
4. **Reutilización:** `ReauthDialog`, `MoneyField`, `TextField`, `ListRow`, `Badge`, `Banner`, `EmptyState`, `Section`.
5. **Piezas nuevas:** módulo `copias` (previsto en §3), `Dockerfile`, `docs/operacion.md`.
6. **Reglas:** RF-140 a RF-144 y RF-150 con dueño y prueba.
7. **Repetición y fallos:** la copia se marca en `ejecucion_tarea` antes de empezar (una por día, también tras una caída); una copia que falla queda `fallida` con su código y avisa; los temporales se borran en un `finally` y al arrancar.
8. **Fuentes:** la spec, `historias.md` §10.7 (variables, SQLite, copias, restauración) y el diseño §8.5 (pantalla de configuración), con el rango de la spec para el intervalo (0 a 1440, no «≥ 1»).
9. **Autorización:** las dos pantallas exigen rol administrador en el caso de uso; la configuración exige además reautenticación en los últimos 15 minutos (CA-138). Rutas nuevas en EV-050.
10. **Afectados:** F3 y F4 (plazo de autoanulación), F5 (límite de deuda), F8 (intervalo de rellenos con 0).
11. **Migraciones:** una, solo de avance.
12. **Datos y formularios:** *actions* `guardar` (configuración), `anotarPrueba` (copias).
13. **Eventos:** los de §9 (`copia.completada`, `copia.fallida`, `configuracion.cambiada`, `tarea.*`). Nuevo: `restauracion.anotada` (info).
14. **Pantallas:** estados en [contracts/rutas.md](contracts/rutas.md).

## Decisiones

### D1. Copia diaria (RF-140, CA-140)

Tarea `copias.hacerCopiaDiaria` a las 03:00 de Madrid, registrada en el planificador de F5:

1. Inserta `ejecucion_tarea ('copia_diaria', 'AAAA-MM-DD')`; si ya existe, termina (Clarifications 1). Inserta `copia_seguridad` en estado `en_curso`.
2. **Instantánea** (`instantanea.ts`): `VACUUM INTO '<datos>/tmp/copia-<id>.db'` fuera de cualquier transacción, y `PRAGMA quick_check` sobre el archivo resultante.
3. **Empaquetado** (`empaquetado.ts`, `tar`): `.tar.gz` con `becafe.db` (la instantánea) y `fotos/`. Nunca incluye `logs/`, `tmp/` ni el archivo vivo de la base de datos. Calcula el SHA-256 al escribir.
4. **Subida** (`subida-s3.ts`, `aws4fetch`): `PUT` firmado a `S3_ENDPOINT/S3_BUCKET/becafe/AAAA/MM/becafe-<instante>.tar.gz`, con el SHA-256 en `x-amz-content-sha256` y como metadato. Tiempo máximo de 10 minutos.
5. Actualiza `copia_seguridad` a `correcta` con tamaño y SHA-256, o a `fallida` con un código cerrado (D3). Borra los temporales en un `finally`.

La E/S es asíncrona y va fuera de transacciones. La aplicación sigue respondiendo durante la copia; solo `VACUUM INTO` ocupa la conexión unos milisegundos.

### D2. Arranque

`arranque.ts` borra los restos de `<datos>/tmp/copia-*` y marca como `fallida` (`INTERRUMPIDA`) una copia que quedó `en_curso`. Después, el planificador recupera la copia del día si ya pasaron las 03:00 y no consta en `ejecucion_tarea`.

### D3. Fallo de una copia (RF-142, CA-142)

- Códigos cerrados: `S3_CREDENCIALES` (401/403), `S3_RED` (red o tiempo agotado), `S3_RESPUESTA` (otro código HTTP), `INSTANTANEA` (`VACUUM INTO` o `quick_check`), `DISCO` (espacio o escritura), `INTERRUMPIDA`.
- En una transacción: `copia_seguridad` a `fallida` con el código y `notificaciones.registrarAviso(tx, { tipo: 'fallo_copia', datos: { copiaId } })` a los administradores.
- `copia.fallida` (error) con `copiaId`, código y estado HTTP. Nunca la URL firmada, las cabeceras, el cuerpo de la respuesta ni las claves (`redact` de `err.headers` y `err.body` como protección adicional).
- No hay reintento automático en el mismo día (D12-1).

### D4. Retención en el bucket (RF-141)

La aplicación no borra copias. La regla de ciclo de vida del bucket (30 días sobre el prefijo `becafe/`) la configura el operador; `docs/operacion.md` incluye el ejemplo de regla y la comprobación por inspección.

### D5. Panel de copias (`/admin/copias`, RF-143, CA-143)

- Lista de las últimas 30 copias: fecha, tamaño legible, estado con texto e icono (no solo color) y código de error si falló.
- Formulario «Anotar prueba de restauración»: fecha (`FechaMadrid`, no futura: Clarifications 3), resultado (`correcta` / `fallida`) y notas opcionales (hasta 500 caracteres, sin datos personales). Lista de pruebas anotadas con autor.
- Sin reautenticación (spec, Assumptions).

### D6. Aviso de los 100 días (RF-144, CA-144)

El `load` de `/admin` (F1) añade `copias.leerEstadoRestauracion(actor, hoy)`. Con la última prueba **correcta** hace más de 100 días naturales, `Banner warning` «Hace más de 100 días que no se prueba una restauración» con enlace a `/admin/copias`. Sin ninguna prueba: D12-2.

### D7. Configuración (`/admin/configuracion`, RF-150, CA-150, CA-138)

- `configuracion.cambiarConfiguracion(ambiente, actor, valores)` en una transacción: exige rol administrador y reautenticación (`auth.exigirReautenticacion`; la llama la *action* antes del caso de uso, como en F1), valida los rangos, escribe solo los parámetros que cambian y anota cada cambio con `usuarios.anotarAuditoria` (valor anterior y nuevo, autor, instante). Evento `configuracion.cambiada` con la clave, sin valores.
- **Arista nueva `configuracion → usuarios`:** la auditoría es de `usuarios` (`registro_auditoria`). La alternativa (una tabla de historial propia) duplicaría el registro de auditoría.
- **Rangos** (Clarifications 2), en los esquemas de lectura y de escritura de `configuracion/leer.ts`:
  - plazo de autoanulación: entero de 1 a 1440 minutos;
  - límite de deuda: de −100 a −10 000 céntimos; en pantalla, un `MoneyField` positivo «5,00 €» que se guarda como −500;
  - intervalo entre rellenos: entero de 0 a 1440 minutos; 0 desactiva el intervalo (F8).
- Un valor fuera de rango: `fail(400, { errores, valores })` con «Escribe un número entre 1 y 1440.» por campo (Clarifications 2).
- **Tramos (CA-074):** bloque informativo con los tres tramos derivados del límite. El cálculo es la función pura de `lib/shared/deuda/tramos.ts` (F5), así que el bloque se actualiza en vivo mientras se escribe el límite con JavaScript y tras guardar sin él.
- Un valor guardado fuera de rango al leerse vuelve al valor por defecto y registra `dato.invalido` (comportamiento de F1).

### D8. Variables de entorno

`S3_ENDPOINT` (URL https), `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`: privadas y dinámicas en `src/env.ts`, obligatorias en el ambiente de producción y opcionales en desarrollo y pruebas (sin ellas, la tarea de copia no se registra y `/admin/copias` lo indica). Ningún valor en el log: si faltan, se registran solo los nombres (constitución XVI).

### D9. Imagen Docker (RT-003, RT-010, PEND-035)

- `Dockerfile` de varias etapas sobre `node:24-bookworm-slim`: `npm ci`, `npm run build` con `ARG GIT_COMMIT` (ya leído por `vite.config.ts`), `npm prune --omit=dev`; etapa final sin herramientas de compilación, usuario sin privilegios, `ENV TZ=Europe/Madrid`, `VOLUME /data`, `EXPOSE 3000`, `HEALTHCHECK` con `node -e "fetch('http://127.0.0.1:3000/api/salud')…"`.
- `better-sqlite3` y `sharp` se compilan o descargan en la misma base que la etapa final (misma libc).
- `.dockerignore`: `node_modules`, `.git`, `.local`, `.env*`, `data`, `*.db`, informes, `.respaldos`, `specs`.
- Versión y commit: `package.json` y `GIT_COMMIT` al construir (PEND-035 para la imagen).

### D10. Integración continua (archivo protegido)

Propuesta de cambio en `.github/workflows/ci.yml`, que se presentará con su diferencia exacta para aprobarla antes de aplicarla (AGENTS.md §3):

- Trabajo nuevo `imagen`, tras `verificacion`: construye la imagen con `GIT_COMMIT=${{ github.sha }}`, la arranca con un volumen temporal y variables de prueba, espera a `/api/salud`, reinicia el contenedor y comprueba que un dato sembrado sigue en el volumen (spec, US3).
- En `main`, publica la imagen verificada en un registro de contenedores y Coolify despliega esa imagen por su digest, para que lo desplegado sea lo verificado (D12-3).

### D11. Operación y restauración (EV-070)

- `docs/operacion.md`: variables de Coolify, volumen `/data`, primer administrador (RF-139), generación de claves VAPID (F5), regla de ciclo de vida del bucket, actualización, lectura de logs y **restauración paso a paso**: descargar el archivo, detener la aplicación, sustituir `/data/becafe.db` y `/data/fotos`, arrancar, comprobar `/api/salud` y los saldos, y anotar la prueba en `/admin/copias`.
- `scripts/copias/verificar-copia.ts` (`npm run copia:verificar -- <archivo>`): descomprime en un directorio temporal, ejecuta `PRAGMA integrity_check`, comprueba que las migraciones aplicadas coinciden con las del código y muestra los totales (número de usuarios, suma de saldos, saldo de la hucha) sin nombres. Sirve para la demostración de EV-070.

### D12. Decisiones de la persona usuaria

1. **Reintento de una copia fallida.** Ninguno automático: se avisa a los administradores y la siguiente copia es la del día siguiente. Alternativa: un botón «Hacer copia ahora» en `/admin/copias` (no está en la spec).
2. **Sin ninguna prueba de restauración.** El panel muestra el aviso «Todavía no se ha probado ninguna restauración» desde el primer despliegue.
3. **Registro de la imagen.** Publicar la imagen en GitHub Container Registry desde la CI y desplegarla en Coolify por digest. Alternativa: que Coolify construya desde el `Dockerfile` (más sencillo, pero la imagen desplegada no es la verificada).
4. **Prueba que cuenta para los 100 días.** Solo una prueba con resultado «correcta».
5. **Hora de la copia y de las demás tareas.** Copia a las 03:00; aguador a las 00:05 (F8); resumen y recordatorio de deuda a las 09:00 (F5). No coinciden.

## Pruebas

| Regla o escenario | Nivel | Archivo previsto |
| --- | --- | --- |
| CA-140 (copia con base de datos y fotos; restaurable) | Integración con S3 falso; se descomprime y se abre la base copiada con los mismos saldos | `copias/copia-diaria.test.ts` |
| CA-142 (credenciales incorrectas → `fallida`, aviso, evento sin secretos) | Integración con S3 falso (403) y registrador falso | `copias/copia-diaria.test.ts` |
| Recuperación y doble arranque; copia interrumpida | Integración con reloj simulado | `copias/copia-diaria.test.ts` |
| Copia sin `logs/` ni `tmp/` | Integración | `copias/empaquetado.test.ts` |
| CA-143 (lista; prueba con fecha futura rechazada) | Integración + E2E + `sin-js` | `copias/pruebas-restauracion.test.ts`, `e2e/flujos/admin-copias.spec.ts` |
| CA-144 (30 y 101 días) | Integración con reloj simulado | `copias/consultas.test.ts` |
| CA-150 (30 minutos, auditoría, aplicado a la siguiente anulación) | Integración + E2E | `configuracion/cambiar.test.ts`, `e2e/flujos/admin-configuracion.spec.ts` |
| Rangos (límites de cada campo, 0 en rellenos) | Ruta con evento falso | `src/routes/(app)/admin/configuracion/page.server.test.ts` |
| CA-138 (15 y 16 minutos) | Integración | `configuracion/cambiar.test.ts` |
| CA-074 (tramos en pantalla) | E2E | `e2e/flujos/admin-configuracion.spec.ts` |
| Imagen: arranque, salud, reinicio con datos | CI | `.github/workflows/ci.yml` (trabajo `imagen`) |
| EV-070 | Demostración manual | `docs/operacion.md`, anotada en `/admin/copias` |
| RF-141 | Inspección | Regla del bucket |

## Lotes de implementación (orientativo)

| Lote | Contenido | CA/EV | Cierre |
| --- | --- | --- | --- |
| F7-L1 Configuración | Rangos, `cambiarConfiguracion`, arista, pantalla | CA-150, CA-138, CA-074 | `test:changed`, E2E, `sin-js`, `acceso` |
| F7-L2 Copias | Migración, `aws4fetch`, `tar`, variables S3, tarea, S3 falso | CA-140, CA-142 | `verify` (migración, entorno) |
| F7-L3 Panel de copias | `/admin/copias`, pruebas de restauración, aviso de 100 días | CA-143, CA-144 | `test:changed`, E2E, `a11y` |
| F7-L4 Imagen | `Dockerfile`, `.dockerignore`, construcción y prueba local | US3 | Construcción local y prueba de humo |
| F7-L5 CI | Cambio de `ci.yml` **tras su aprobación** | US3 | CI en verde |
| F7-L6 Operación | `docs/operacion.md`, `verificar-copia`, demostración de restauración | EV-070, RF-141 | Demostración anotada |
| F7-L7 Cierre | `ARCHITECTURE.md`, benchmark, puerta de producción | Todos | `verify` + benchmark |

## Puerta de producción

- Verificación completa y E2E en verde sobre la imagen que se despliega.
- PEND-014 resuelto (texto de privacidad, responsabilidad del departamento).
- Revisión con lector de pantalla pendiente de F1 (T089) hecha.
- Una copia real subida al bucket y una restauración demostrada (EV-070).

## Cambios en otros documentos

| Documento | Cambio | Lote |
| --- | --- | --- |
| `ARCHITECTURE.md` | §4: arista `configuracion → usuarios`. §3: módulo `copias` creado. §8: variables S3. §9: `restauracion.anotada`. §14: «construcción Docker en la CI» hecha | F7-L7 |
| `.github/workflows/ci.yml` | Trabajo `imagen` (D10). Archivo protegido: aprobación previa de la diferencia | F7-L5 |
| `docs/diseno/screen-layouts.md` | §8.5: intervalo «de 0 a 1440» en lugar de «≥ 1» | F7-L7 |
| `specs/008-operacion/spec.md` | Clarifications con las decisiones de D12 aprobadas | Antes de `tasks.md` |
| `AGENTS.md` | «La CI aún no existe» ya no es cierto: actualizar el estado del repositorio (archivo protegido; propuesta aparte) | F7-L7 |

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Credenciales S3 en el log | Catálogo tipado sin esos campos, `redact` y prueba con el registrador falso |
| Copia que no se puede restaurar | `quick_check` antes de subir, prueba que abre la copia y demostración trimestral (EV-070) |
| Disco lleno por temporales | Borrado en `finally` y al arrancar |
| Imagen desplegada distinta de la verificada | Despliegue por digest (D12-3) |
| Cambio de parámetros desde una sesión olvidada | Reautenticación (RN-050) |

## Complexity Tracking

| Pieza | Problema concreto | Alternativa más simple descartada porque… |
| --- | --- | --- |
| Arista `configuracion → usuarios` | Cada cambio queda en el registro de auditoría con autor y fecha (RF-150) | Una tabla de historial propia duplicaría el registro de auditoría |
| Trabajo `imagen` en la CI | Verificar la imagen que se despliega (spec, US3) | Verificar solo el código no detecta fallos de la imagen (dependencias nativas, permisos del volumen) |
| `scripts/copias/verificar-copia.ts` | Demostrar EV-070 sin datos personales en pantalla | Abrir la base a mano expone nombres e importes |
