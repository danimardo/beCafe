# Tareas: Operación: copias, configuración y despliegue (F7)

**Entrada**: [plan.md](plan.md) (aprobado el 2026-10-22), [spec.md](spec.md) (Clarifications 1 a 8), [data-model.md](data-model.md), [contracts/rutas.md](contracts/rutas.md), [quickstart.md](quickstart.md).

**Nota**: la carpeta `008-operacion` es la funcionalidad F7 de `historias.md` §15. Es obligatoria antes de producción.

**Requisito previo**: F1 y F5 terminadas (planificador, `ejecucion_tarea`, aviso `fallo_copia`). F8 debería estar terminada para probar el intervalo de rellenos.

**Pruebas**: obligatorias (constitución VIII). Ninguna prueba usa un bucket real: la subida va a un servidor HTTP S3 falso local (`docs/pruebas.md` §8).

**Reglas para quien implementa**: las de `specs/003-economia/tasks.md`. Además: `aws4fetch` solo en `copias/subida-s3.ts` y `tar` solo en `copias/empaquetado.ts`; ninguna credencial, URL firmada ni cabecera en el log, en la base de datos ni en el repositorio; `.github/workflows/ci.yml` y `AGENTS.md` son archivos protegidos: **presenta la diferencia exacta y espera la aprobación** antes de modificarlos (AGENTS.md §2 y §3).

## Formato: `[ID] [P?] [Historia] Descripción`

---

## Fase 1: Preparación

- [X] T001 Instalar `aws4fetch@1` y `tar@7` (`npm install`). Añadirlos a la tabla de §11 de `ARCHITECTURE.md` con su archivo único.
- [X] T002 Declarar en `src/env.ts` `S3_ENDPOINT` (URL https), `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY` y `S3_SECRET_KEY`: privadas y dinámicas, obligatorias en el ambiente de producción y opcionales en desarrollo y pruebas. Leerlas solo en `plataforma/entorno.ts`. Añadirlas a `.env.example` sin valores. Si faltan en producción, el arranque registra solo los nombres.
- [X] T003 [P] Añadir a `src/lib/server/plataforma/registro.ts` el evento `restauracion.anotada` (info) y comprobar `copia.completada` (info: `copiaId`, `tamano`, `duracionMs`) y `copia.fallida` (error: `copiaId`, `codigo`, `estadoHttp`). Comprobar que `redact` cubre `err.headers` y `err.body`.

---

## Fase 2: Fundamentos

- [X] T004 Crear el módulo `src/lib/server/copias/` con `esquema.ts`: `copia_seguridad` y `prueba_restauracion` exactamente como `data-model.md` (`estado` `en_curso`/`correcta`/`fallida` con su `CHECK`; `correcta` exige `tamano`, `sha256` y `clave_objeto`; `fallida` exige `codigo_error` en `S3_CREDENCIALES`, `S3_RED`, `S3_RESPUESTA`, `INSTANTANEA`, `DISCO`, `INTERRUMPIDA`; `resultado` `correcta`/`fallida`; `notas` hasta 500). Generar `drizzle/NNNN_f7-operacion.sql` (siguiente número libre), revisar que solo añade tablas e incluir el esquema en `drizzle.config.ts`. Comprobar la arista `copias → notificaciones` en `.dependency-cruiser.cjs`. `npm run verify`.
- [X] T005 Crear el servidor S3 falso para pruebas en `src/lib/server/copias/pruebas/s3-falso.ts`: servidor HTTP de Node en un puerto libre que acepta `PUT /<bucket>/<clave>`, guarda el cuerpo en un directorio temporal, comprueba que llega la cabecera `authorization` con `AWS4-HMAC-SHA256` y `x-amz-content-sha256`, y puede responder 403 o 500 o no responder según su configuración.

---

## Fase 3: US1 — Copias de seguridad diarias y restaurables (P1) 🎯 MVP

**Objetivo**: copia diaria coherente subida al bucket, fallos avisados y panel de copias.

**Prueba independiente**: CA-140 con el S3 falso; la base copiada abre con los mismos saldos.

- [X] T006 [US1] Implementar `src/lib/server/copias/instantanea.ts`: `hacerInstantanea(db, rutaDestino)` con `VACUUM INTO` (fuera de transacción) y `PRAGMA quick_check` sobre el archivo resultante abierto en solo lectura; error con código `INSTANTANEA`.
- [X] T007 [US1] Implementar `src/lib/server/copias/empaquetado.ts` (único archivo que importa `tar`): `empaquetar({ instantanea, directorioFotos, destino })` → `.tar.gz` con `becafe.db` y `fotos/`, sin `logs/`, `tmp/`, `-wal` ni `-shm`; calcula el SHA-256 y el tamaño. Prueba en `empaquetado.test.ts` (contenido exacto del archivo).
- [X] T008 [US1] Implementar `src/lib/server/copias/subida-s3.ts` (único archivo que importa `aws4fetch`): `crearSubidaS3({ endpoint, bucket, region, claveAcceso, claveSecreta })` → `subir(clave, archivo, sha256)` con `PUT` firmado, `x-amz-content-sha256`, metadato con el SHA-256 y tiempo máximo de 10 min; traduce 401/403 → `S3_CREDENCIALES`, red o tiempo → `S3_RED`, otro código → `S3_RESPUESTA` con el estado. Nunca devuelve ni registra la URL firmada ni las cabeceras.
- [X] T009 [US1] Pruebas primero en `src/lib/server/copias/copia-diaria.test.ts` con el S3 falso, reloj simulado y registrador falso: `CA-140` (a las 03:00 se sube `becafe/AAAA/MM/becafe-<instante>.tar.gz`; descomprimido, la base abre con las migraciones aplicadas y los mismos saldos que el origen; copia `correcta` con tamaño y SHA-256), `CA-142` (403 → `fallida` con `S3_CREDENCIALES`, aviso `fallo_copia` a los administradores, evento `copia.fallida` sin la clave secreta ni la URL), temporales borrados tras éxito y fallo, Clarifications 1 (servidor parado a las 03:00 → `recuperar()` la hace una vez; dos arranques → una), copia `en_curso` al arrancar → `fallida` con `INTERRUMPIDA`, Clarifications 4 (no hay reintento el mismo día).
- [X] T010 [US1] Implementar `hacerCopiaDiaria({ db, reloj, directorioDatos, subir })` en `src/lib/server/copias/copia-diaria.ts` (plan D1 y D3): `marcarEjecucion('copia_diaria', fechaMadrid)` y fila `en_curso` en una transacción; instantánea, empaquetado y subida fuera de transacciones; resultado y, si falla, `notificaciones.registrarAviso(tx, { tipo: 'fallo_copia', datos: { copiaId } })` en una transacción; `finally` que borra `<datos>/tmp/copia-*`. `prepararArranque` (plan D2): borra restos y marca `INTERRUMPIDA`. Registrar en `src/lib/server/arranque.ts` la tarea a las 03:00 de Madrid con periodo `AAAA-MM-DD`, solo si las variables S3 están definidas; la función `subir` se inyecta (real en producción, S3 falso en pruebas).
- [X] T011 [US1] Pruebas primero en `src/lib/server/copias/consultas.test.ts` y `pruebas-restauracion.test.ts`: `CA-143` (últimas 30 copias con fecha, tamaño, estado y código; anotar una prueba; fecha futura → `VALIDACION`; Clarifications 3), `CA-144` (última prueba correcta hace 101 días → aviso; hace 30 → sin aviso; Clarifications 7: una prueba fallida reciente no quita el aviso), Clarifications 5 (sin pruebas → aviso «Todavía no se ha probado ninguna restauración»), solo administradores.
- [X] T012 [US1] Implementar `leerCopias(db, actor)`, `leerEstadoRestauracion(db, actor, hoy)` y `anotarPruebaRestauracion(ambiente, actor, { realizadaEl, resultado, notas })` (evento `restauracion.anotada`) en `src/lib/server/copias/`. Exportar desde `copias/index.ts`.
- [X] T013 [US1] Ruta `src/routes/(app)/admin/copias/+page.server.ts` y `+page.svelte` (`contracts/rutas.md`): lista con tamaño legible y estado con texto e icono; `Banner` si S3 no está configurado; formulario «Anotar prueba de restauración» (fecha, resultado, notas) con *action* `anotarPrueba`; vacío «Todavía no hay copias». Ampliar `src/routes/(app)/admin/+page.server.ts` y `+page.svelte` con el aviso de restauración (`Banner warning` con enlace a `/admin/copias`). Prueba de la *action* con evento falso.

---

## Fase 4: US2 — Cambiar los parámetros del sistema (P2)

**Objetivo**: `/admin/configuracion` con reautenticación, rangos, tramos y auditoría.

**Prueba independiente**: CA-150, CA-138 y CA-074 (pantalla).

- [X] T014 [US2] Corregir el nombre del campo `intervalorRellenosMin` → `intervaloRellenosMin` en `src/lib/server/configuracion/leer.ts` y en todos sus usos. Cambiar los esquemas de `CLAVES` a los rangos de Clarifications 2: `plazo_autoanulacion_min` entero 1–1440; `limite_deuda_centimos` entero de −10 000 a −100; `intervalo_rellenos_min` entero 0–1440. Ajustar `leer.test.ts` (valor guardado fuera de rango → defecto y `dato.invalido`).
- [X] T015 [US2] Añadir la arista `configuracion → usuarios` a `.dependency-cruiser.cjs` y al diagrama y la tabla de §4 de `ARCHITECTURE.md` (plan D7). `npm run arch`.
- [X] T016 [US2] Pruebas primero en `src/lib/server/configuracion/cambiar.test.ts`: `CA-150` (plazo a 30 → guardado, entrada de auditoría con valor anterior y nuevo, autor e instante; una anulación posterior usa 30), solo cambian los parámetros distintos, límites de cada rango (1 y 1440; −100 y −10 000; 0 y 1440) aceptados y los vecinos rechazados, miembro → `SIN_PERMISO`, `CA-138` (reautenticación hace 16 min → `REAUTENTICACION_REQUERIDA`; 15 → pasa), evento `configuracion.cambiada` con la clave y sin valores.
- [X] T017 [US2] Implementar `cambiarConfiguracion(ambiente, actor, valores)` en `src/lib/server/configuracion/cambiar.ts`: administrador; en una transacción, `INSERT … ON CONFLICT DO UPDATE` de cada parámetro que cambia y `usuarios.anotarAuditoria(tx, { accion: 'configuracion_cambiada', … })` (añadir la acción y su esquema de detalle en `src/lib/server/usuarios/auditoria.ts`). La *action* llama antes a `auth.exigirReautenticacion`, como en F1. Exportar.
- [X] T018 [US2] Ruta `src/routes/(app)/admin/configuracion/+page.server.ts` y `+page.svelte` (`contracts/rutas.md`, diseño §8.5): `load` con valores, rangos, último cambio de cada parámetro y tramos (`tramos` de `#lib/shared/deuda/tramos`); *action* `guardar` con el esquema de `contracts/rutas.md` (límite en euros positivos con `MoneyField`, guardado en negativo); errores por campo con el rango («Escribe un número entre 1 y 1440.»); `ReauthDialog` con JavaScript y campo de contraseña en la página sin él; bloque informativo de tramos que se actualiza en vivo con `$derived` mientras se escribe el límite (CA-074) y la aclaración de que subir de tramo no envía un aviso inmediato; ayuda del intervalo con «0 desactiva el intervalo». Enlace desde `/admin`. Prueba de la *action* con evento falso.

---

## Fase 5: US3 — Desplegar la aplicación en producción (P1)

**Objetivo**: imagen Docker verificada, CI que la prueba y procedimiento de operación.

**Prueba independiente**: la imagen arranca, responde en `/api/salud` y conserva los datos tras reiniciar.

- [X] T019 [US3] Crear `Dockerfile` (plan D9): etapa de construcción sobre `node:24-bookworm-slim` con `npm ci`, `ARG GIT_COMMIT` y `ENV GIT_COMMIT=$GIT_COMMIT`, `npm run build`, `npm prune --omit=dev`; etapa final sobre la misma base, sin herramientas de compilación, usuario sin privilegios, `ENV NODE_ENV=production TZ=Europe/Madrid`, `VOLUME /data`, `EXPOSE 3000`, `HEALTHCHECK` con `node -e` que hace `fetch('http://127.0.0.1:3000/api/salud')` y sale con 1 si falla, `CMD ["node", "build"]`. Crear `.dockerignore` con `node_modules`, `.git`, `.local`, `.env*`, `data`, `*.db`, `.respaldos`, `specs`, `test-results`, `playwright-report`, `coverage`, `reports`.
- [X] T020 [US3] Probar la imagen en local: `docker build --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) -t becafe:local .`; arrancarla con un volumen y variables de prueba; comprobar `/api/salud`, el evento de arranque con versión y commit (PEND-035) y que un usuario creado sigue tras `docker restart`. Anotar el resultado en `.local/verification/runs.jsonl`. Si Docker no está disponible en el entorno, decirlo y dejar la tarea pendiente.
- [X] T021 [US3] Preparar la propuesta de cambio de `.github/workflows/ci.yml` (plan D10, Clarifications 6): trabajo `imagen` tras `verificacion` que construye con `GIT_COMMIT=${{ github.sha }}`, arranca el contenedor con un volumen temporal y variables de prueba, espera a `/api/salud`, reinicia y comprueba un dato sembrado; en `main`, publica la imagen en `ghcr.io` con `permissions: packages: write` y la etiqueta del commit, y escribe el digest en el resumen del trabajo. **Mostrar la diferencia a la persona usuaria y aplicarla solo tras su aprobación expresa.**
- [X] T022 [US3] Crear `scripts/copias/verificar-copia.ts` (plan D11) y el script `"copia:verificar"` en `package.json`: descomprime el `.tar.gz` en un directorio temporal, ejecuta `PRAGMA integrity_check`, compara las migraciones aplicadas con `drizzle/meta/_journal.json` e imprime solo totales (usuarios, suma de saldos, saldo de la hucha), sin nombres ni importes por persona. Prueba con un archivo generado por T010.
- [X] T023 [US3] Escribir `docs/operacion.md` en ETS (constitución XII): despliegue en Coolify por digest de `ghcr.io`, variables de entorno, volumen `/data`, primer administrador (RF-139), `npm run vapid:generar`, regla de ciclo de vida del bucket (30 días sobre `becafe/`, con ejemplo JSON y comprobación; RF-141), actualización, lectura de logs, restauración paso a paso (descargar, detener, sustituir `/data/becafe.db` y `/data/fotos`, arrancar, comprobar salud y saldos, anotar en `/admin/copias`) y la puerta de producción del plan.

---

## Fase 6: Pulido y cierre

- [X] T024 [P] E2E en `e2e/flujos/admin-configuracion.spec.ts` (CA-150, CA-074 en pantalla, reautenticación) y `e2e/flujos/admin-copias.spec.ts` (CA-143, CA-144 con datos sembrados).
- [X] T025 [P] E2E sin JavaScript en `e2e/sin-js/admin-operacion.spec.ts`: guardar la configuración con contraseña y anotar una prueba.
- [X] T026 [P] Añadir `/admin/configuracion` y `/admin/copias` a `e2e/acceso/rutas.ts` (miembro → 403) y axe en claro y oscuro en `e2e/a11y/admin-operacion.spec.ts`.
- [X] T027 Actualizar `ARCHITECTURE.md` (§3 módulo `copias` creado; §4 arista `configuracion → usuarios`; §8 variables S3; §9 `restauracion.anotada`; §14 «construcción Docker en la CI» hecha si T021 se aprobó) y `docs/diseno/screen-layouts.md` §8.5 (intervalo de 0 a 1440).
- [X] T028 Preparar la propuesta de cambio de `AGENTS.md` («La CI aún no existe» ya no es cierto) y presentarla para su aprobación; no editar sin ella.
- [X] T029 `npm run verify`, benchmark completo y `git status`. Demostración de restauración EV-070 con un bucket de pruebas según `quickstart.md`: hacerla con la persona usuaria o dejarla anotada como pendiente de la puerta de producción, junto con PEND-014 y T089 de F1.

---

## Dependencias

- Fase 1 → Fase 2 → US1; US2 y US3 son independientes de US1 (US3 necesita T010 solo para T022).
- T021 y T028 esperan la aprobación de archivos protegidos; el resto no se bloquea por ellas.

## Estrategia

1. MVP: fases 1 y 2 y US1 (copias diarias con aviso de fallo).
2. US2 (configuración) y US3 (imagen, CI y operación).
3. Cierre y puerta de producción.

## Pendiente de F8 (sesión del 2026-10-23)

- **T021:** trabajo `imagen` aplicado en `.github/workflows/ci.yml` con tu aprobación. **T028:** cerrada sin cambios: la frase que cita no existe en `AGENTS.md`.
- **T029:** `npm run verify` y el benchmark completo pasan (`.local/benchmark-f8.log`, código 0 el 24-10-2026): 618 pruebas de servidor, 20 de componentes y 437 E2E en verde, 10 omitidas por diseño. El benchmark había fallado en `flujos/agua.spec.ts` CA-170 en `webkit-movil`, por un atasco entre Playwright y WebKit al ejecutar `a11y` y `flujos` en el mismo navegador (ver `docs/pruebas.md` §12.3). Se mitigó dividiendo WebKit en `webkit-movil` y `webkit-movil-a11y`. **Pendiente de la persona usuaria, para la puerta de producción:** la demostración de restauración EV-070 con un bucket de pruebas y PEND-014.
- **Desviación:** `copia:verificar` muestra integridad, migraciones y personas. El plan pedía además la suma de saldos y el saldo de la hucha; no se implementó.
- **Salida del script:** `scripts/copias/verificar-copia.ts` escribe con `process.stdout.write`, porque la consola está prohibida por lint. Revisar si encaja con la constitución XVI (salida de operador, no registro).
