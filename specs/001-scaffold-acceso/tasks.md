---

description: "Tareas de F1: preparación del proyecto y acceso"
---

# Tasks: Preparación del proyecto y acceso (F1)

**Input**: documentos de diseño de `specs/001-scaffold-acceso/`: [plan.md](plan.md) (aprobado), [spec.md](spec.md) (revisión 4, aprobada), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/) y [quickstart.md](quickstart.md).

**Tests**: obligatorios. La constitución VIII exige al menos una prueba por CA y EV del alcance, con el ID en su nombre (`it('CA-133: …')`). El nivel de cada prueba sigue la matriz de la spec y `docs/pruebas.md` §14.1.

**Organization**: tras la preparación (fases 1 y 2), las tareas se agrupan por historia de usuario en el orden US3 → US2 → US1 → US4 → US5. Cada historia necesita lo que entrega la anterior: el primer administrador, el inicio de sesión y la siembra de E2E (`plan.md`, «Lotes de implementación»). Cada fase lleva la línea de lote de `docs/pruebas.md` §19: tareas → impacto → selección → evidencia → condición para ampliar.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede hacerse en paralelo (archivos distintos y sin dependencias pendientes).
- **[Story]**: historia de la spec (US1 a US5).
- Las rutas son relativas a la raíz del repositorio.

## Reglas para todas las tareas

- Cumplir `AGENTS.md` §5 y §6, `ARCHITECTURE.md` y la constitución. Los imports entre módulos van solo por `#lib/server/<modulo>`. La única excepción: un `*.test.ts` puede importar `src/lib/server/<otro>/pruebas/` (research R17).
- Los textos de la interfaz y los mensajes de error van en español y centralizados en `src/lib/shared/textos.ts` (RNF-012).
- Ningún evento de registro, `detalle` de auditoría ni `valores` de `fail` contiene correos, nombres, contraseñas, tokens ni enlaces (constitución XVI).
- **Confirmación (constitución X, `contracts/rutas.md`):** `alta`, `cambiarRol`, `generarEnlace`, `reactivar`, `cambiarContrasena` y `aceptar` confirman su resultado con un mensaje anunciado: aviso `aria-live="polite"` con JavaScript y `Banner` con `role="status"` a partir de la prop `form` sin JavaScript. Las E2E de cada flujo lo comprueban con `getByRole('status')`.
- **Sin conexión (EXC-007):** con `use:enhance`, un fallo de red muestra «Sin conexión. Esta acción necesita red: vuelve a intentarlo cuando tengas conexión.» y conserva lo escrito.
- Al cerrar cada fase: ejecutar la selección indicada, anotar cada ejecución en `.local/verification/runs.jsonl` (`docs/pruebas.md` §17.3) y comprobar que el filtro selecciona al menos una prueba.
- Los archivos protegidos (`.github/workflows/`, `AGENTS.md`) se escriben con la confirmación nativa de Claude Code.

---

## Phase 1: Setup (F1-L0 traslado y F1-L1 herramientas)

**Purpose**: dejar la plantilla en la raíz y todas las herramientas de verificación funcionando.

### F1-L0 Traslado (research R1 a R3)

- [X] T001 Anotar el SHA de `HEAD` anterior al traslado y mover con `git mv` desde `design-system/` a la raíz: `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `svelte.config.js`, `src/`, `tokens/`, `static/` y `scripts/generate-tokens.mjs` (tabla de research R1)
- [X] T002 Mover `design-system/docs/` a `docs/diseno/`, y `design-system/design/` y `scripts/generate-pwa-assets.py` a `docs/diseno/recursos/`. Crear `docs/diseno/README.md` con las «Reglas obligatorias» y el mapa de `design-system/AGENTS.md`, y con el SHA de T001 y el comando `git show <sha>:design-system/src/routes/...` para recuperar las pantallas. Fusionar `design-system/README.md` en un `README.md` nuevo de la raíz. Borrar `design-system/` cuando quede vacío
- [X] T003 Mover `src/lib/components/*` a `src/lib/ui/*` y exportarlos en `src/lib/ui/index.ts`. Repartir `src/lib/utils.ts`: `formatMoney` y `parseMoney` a `src/lib/shared/dinero.ts`, `formatDate` a `src/lib/shared/fechas/formato.ts` e `initials` a `src/lib/shared/texto.ts`; `cn` y `buttonClasses` a `src/lib/ui/utils.ts`. Mover `src/lib/movements.ts` a `src/lib/ui/movimientos.ts`
- [X] T004 Retirar de `src/routes/` las pantallas de otras funcionalidades (`/compras`, `/saldos`, `/historial`, `/estadisticas`, `/ayuda`, `/admin/capsulas`, `/admin/control`, `/admin/configuracion`, `/admin/copias`, `/componentes`, `/errores/[tipo]`, `/offline` y el contenido actual de `/`), `src/lib/mock.ts` y `static/robots.txt`
- [X] T005 Definir `imports` en `package.json` según research R2 (`#lib/ui` → `./src/lib/ui/index.ts`; `#lib/server/*` → `./src/lib/server/*/index.ts`; `#lib/shared/*` y `#lib/client/*` → sus archivos) y sustituir todo `$lib/` por `#lib/` en los archivos movidos
- [X] T006 Convertir `theme.svelte.ts`, `toast.svelte.ts` y `notifications.svelte.ts` en clases compartidas por contexto, con `crearContextoTema()`/`usarTema()`, `crearContextoAvisos()`/`usarAvisos()` y `crearContextoNotificaciones()`/`usarNotificaciones()` en `src/lib/ui/contextos/` (research R3). `ThemeToggle`, `ToastRegion`, `NotificationBell` y `NotificationPanel` leen el contexto. `ToastRegion` es una región `aria-live="polite"`. `AppShell` recibe la campana como propiedad opcional
- [X] T007 Actualizar `.gitignore` con `src/tokens.css`, `/build-scripts/`, `.local/`, `.env`, `*.db` y `*.db-*`. Crear `.env.example` con los valores de ejemplo de `contracts/entorno-y-eventos.md`, sin secretos
- [X] T008 Instalar las dependencias de la plantilla (`npm install`, con confirmación). Verificar contra el paquete instalado las APIs marcadas «verificar en el scaffold»: `imports` con `.ts` en Vite, `svelte-check` y Vitest (R2); `defineEnvVars` y `$app/env/private` (R13); `kit.csp` con nonce en `app.html` (R15). Anotar el resultado en `research.md` y avisar si alguna difiere del diseño. Ejecutar `npm run tokens`, `npx svelte-check` y `npm run build`

**Lote F1-L0**: T001–T008 → toda la plantilla → `check` + `build` → `runs.jsonl` → si una API difiere, parar y proponer el ajuste del diseño.

### F1-L1 Herramientas (research R18 y R19; T-TEST-001, 003, 005, 006 y 008)

- [X] T009 Instalar las dependencias de ejecución de research R18 (`drizzle-orm` 0.45.x, `better-sqlite3` 13.x, `zod` 4.x, `@node-rs/argon2` 2.x, `ulid` 3.x, `pino` 10.x, `pino-roll` 4.x, `pino-pretty` 13.x, `loglevel` 1.x, `@sveltejs/adapter-node` 6.x), comprobando licencia, actividad y `npm audit`. Crear `.nvmrc` con `24` y `engines` en `package.json` (`node >=24 <25`, `npm >=11 <12`)
- [X] T010 Instalar las dependencias de desarrollo de research R18 (`drizzle-kit` 0.31.x, `vitest` 5.x, `@vitest/coverage-v8`, `fast-check` 4.x, `@vitest/browser-playwright` 5.x, `vitest-browser-svelte` 3.x, `@playwright/test` 1.x, `@axe-core/playwright` 4.x, ESLint 10.x, `typescript-eslint` 8.x, `eslint-plugin-svelte` 3.x, `prettier` 3.x, `prettier-plugin-svelte`, `@eslint-community/eslint-plugin-eslint-comments`, `dependency-cruiser` 18.x, `@types/better-sqlite3`, `@types/node`, `globals`, `@eslint/js`). No instalar `web-push`, `sharp`, `aws4fetch`, `tar`, `croner`, `idb` ni StrykerJS
- [X] T011 [P] Crear `eslint.config.js` (configuración plana, con tipos) con las prohibiciones de `AGENTS.md` §6 y `ARCHITECTURE.md` §12: imports restringidos (`$lib`, `$app/stores`, `$app/environment`, `$env/*`, `svelte/store`, `@lucide/svelte` sin ruta, librerías con un único archivo permitido, `drizzle-orm` en `src/routes`), `no-console`, sin `as` salvo `as const`, sin `any` ni `!`, y `eslint-comments/no-use` para prohibir `eslint-disable`
- [X] T012 [P] Crear `.prettierrc` con `prettier-plugin-svelte`
- [X] T013 [P] Crear `.dependency-cruiser.cjs` con el grafo de `ARCHITECTURE.md` §4: sin ciclos; sin imports de `lib/server` desde `lib/ui`, `lib/client` ni `lib/shared`; sin imports de archivos internos de otro módulo, salvo que el origen sea un `*.test.ts` y el destino esté en `src/lib/server/<otro>/pruebas/` (research R17); y `auth → usuarios` como única arista entre los módulos de F1
- [X] T014 [P] Configurar Vitest en `vite.config.ts` con dos proyectos (T-TEST-001): `servidor` (Node, `src/**/*.test.ts` salvo `src/lib/ui`, cobertura v8 sobre líneas y ramas con umbral del 80 % en `src/lib/server` + `src/lib/shared`, y del 90 % en `src/lib/server/economia/**` y `**/dominio/**`) y `componentes` (Browser Mode con `@vitest/browser-playwright`, `src/lib/ui/**/*.test.ts`), con un `testTimeout` global. Comprobar cómo trata Vitest un umbral cuyo patrón no tiene archivos (F1 no tiene `economia` ni `dominio/`) y anotar el resultado en `research.md`
- [X] T015 [P] Crear `playwright.config.ts` con los proyectos `chromium-movil`, `webkit-movil`, `chromium-escritorio`, `sin-js` y `api` (`docs/pruebas.md` §12.3), con `timezoneId: 'Europe/Madrid'`, `locale: 'es-ES'`, artefactos solo en fallo y `retries: 1` solo en la CI. Crear `e2e/fixtures/errores-navegador.ts` (falla ante `pageerror`, `console.error` o respuestas ≥ 500 propias; lista de excepciones vacía) y `e2e/fixtures/servidor.ts` (por worker: directorio de datos temporal, puerto propio, `node build`) (T-TEST-003)
- [X] T016 Crear los scripts npm de `docs/pruebas.md` §18 en `package.json`: `verify` (format:check → lint → check → arch → test → test:componentes → build, en serie), `format`, `format:check`, `lint`, `lint:changed` (con `scripts/lint-cambiados.mjs`, portable, que lintará todo si cambia la configuración de ESLint o de TypeScript), `check` (`svelte-check --fail-on-warnings`), `arch`, `test`, `test:changed`, `test:componentes`, `test:e2e`, `test:e2e:quick`, `test:e2e:smoke`, `build`, `tokens` y `db:generate`. `test:mutacion`, `perf:*` y `test:e2e:visual` no se crean en F1
- [X] T017 [P] Añadir una prueba mínima por proyecto para que ningún filtro quede vacío: `src/lib/shared/dinero.test.ts` (formato de céntimos), `src/lib/ui/PasswordField.test.ts` (mostrar y ocultar la contraseña, Browser Mode) y `e2e/smoke/arranque.spec.ts` (la página responde y no queda en blanco)
- [X] T018 [P] Adaptar `scripts/benchmark.sh` y `scripts/benchmark.ps1` desde `docs/Prompts/plantillas/benchmark/` (`docs/pruebas.md` §17.3): pasos de Prettier, ESLint, `svelte-check`, dependency-cruiser (`HAS_ARCH_CHECK=true`), build, Vitest `servidor` con cobertura, Vitest `componentes` y Playwright; sin pasos de Rust ni Tauri; `QUICK_E2E_PROJECT=chromium-movil`. Validar con `--dry-run` y `-DryRun` (T-TEST-005)
- [X] T019 [P] Crear `scripts/dev-windows-defender-exclusions.ps1` con la opción `-Remove`, para excluir la carpeta del proyecto y las cachés de npm y de Playwright. Lo ejecuta una persona administradora; el agente no lo ejecuta (T-TEST-008)
- [X] T020 Crear `.github/workflows/ci.yml` (archivo protegido) según `docs/pruebas.md` §21, por ahora solo con `npm ci` (caché de npm), `npm run verify` y `npm audit` en cada push a `main` y cada PR. El paso de Playwright se añade en T058, cuando existen la plataforma y la siembra (T-TEST-006) *Hecho el 22-10-2026 tras la aprobación de la persona usuaria y su confirmación nativa. No verificado todavía en GitHub: la primera ejecución real está pendiente.*
- [X] T021 Medir el número de archivos que carga TypeScript (`npx tsc -p tsconfig.json --listFilesOnly`, contando líneas) y anotarlo en `runs.jsonl` (T-TEST-008). Ejecutar `npm run verify`

**Lote F1-L1**: T009–T021 → configuración de todas las herramientas → `npm run verify` (cambia la configuración) → `runs.jsonl` con el número de archivos de TypeScript → siempre `verify`.

---

## Phase 2: Foundational (F1-L2 plataforma y bases de los módulos)

**Purpose**: plataforma de servidor, tablas, sesiones, enlaces y reautenticación que necesitan todas las historias.

**⚠️ CRITICAL**: ninguna historia empieza antes de terminar esta fase.

### Plataforma (RNF-014, RNF-016, RNF-006)

- [X] T022 Declarar en `src/env.ts` las variables de `contracts/entorno-y-eventos.md`, todas privadas y dinámicas: `ORIGIN` (`z.url()` con protocolo https, o http solo con el host `localhost` o `127.0.0.1`; obligatoria; aclaración 10), `DIRECTORIO_DATOS` (texto no vacío, obligatoria), `LOG_LEVEL` (`fatal` | `error` | `warn` | `info` | `debug` | `trace` | `silent`, por defecto `info`), `ADMIN_INICIAL_EMAIL` (`z.email().optional()`), `ADMIN_INICIAL_NOMBRE` (`z.string().trim().min(1).max(80).optional()`) y `TZ` (`z.literal('Europe/Madrid')`). Exportar los esquemas para los comandos de `scripts/servidor/`. Prueba en `src/env.test.ts`: `ORIGIN` `http://ejemplo.com` se rechaza; `http://localhost:5173` y `https://ejemplo.com` se aceptan
- [X] T023 Crear `src/lib/server/plataforma/entorno.ts`, único lector de `$app/env/private`, y `src/lib/client/entorno.ts` (sin variables públicas en F1)
- [X] T024 [P] Crear `src/lib/server/plataforma/reloj.ts` (`Reloj` con `ahora(): InstanteUtc`, real y fijo para pruebas), `src/lib/server/plataforma/ids.ts` (ULID) y `src/lib/shared/fechas/` (`InstanteUtc`, `FechaMadrid`, `Mes`, con sus esquemas Zod)
- [X] T025 [P] Crear `src/lib/server/plataforma/errores.ts` (`ErrorDeNegocio` con el conjunto cerrado de `ARCHITECTURE.md` §6 más `CREDENCIALES_INCORRECTAS`, `ENLACE_NO_VALIDO`, `CONTRASENA_NO_VALIDA`, `CORREO_DUPLICADO`, `PRIVACIDAD_PENDIENTE` y `LIMITE_SUPERADO`), `src/lib/shared/contratos/formularios.ts` (`fallo(estado, errorZod, datos)`), `src/lib/shared/textos.ts` (incluye los mensajes de confirmación y el de sin conexión) y `src/lib/shared/pruebas/` (`crearEventoAccion`, `desenvolverFallo`) (T-TEST-002)
- [X] T026 Crear `src/lib/server/plataforma/registro.ts` (pino con `redact`, catálogo tipado de códigos, dos instancias: la normal hacia la salida estándar y `<DIRECTORIO_DATOS>/logs/` con `pino-roll` diario y 30 días de retención, y otra solo hacia la salida estándar; `pino-pretty` solo en desarrollo), `src/lib/server/plataforma/contexto-operacion.ts` (`AsyncLocalStorage` con un ULID por operación) y `src/lib/server/plataforma/pruebas/registro-falso.ts` (`crearRegistroFalso()`, que falla ante una clave prohibida o un valor con forma de correo) (T-TEST-002)
- [X] T027 Crear `src/lib/server/plataforma/db/` (conexión WAL en `<DIRECTORIO_DATOS>/becafe.db`, `enTransaccion` síncrona con `BEGIN IMMEDIATE`, aplicación de migraciones), `drizzle.config.ts` y `src/lib/server/plataforma/pruebas/base-temporal.ts` (base SQLite temporal con migraciones) (T-TEST-002)
- [X] T028 Definir las tablas de `data-model.md` y generar `drizzle/0000_*.sql`:
  - `src/lib/server/usuarios/esquema.ts`: `usuario` (`id` ULID; `nombre` NOT NULL, «1 a 80 caracteres, sin espacios al principio ni al final»; `email` NOT NULL UNIQUE, «en minúsculas y sin espacios»; `rol` CHECK `IN ('miembro', 'administrador')`; `estado` CHECK `IN ('activo', 'baja')`; `privacidad_version` INTEGER NULL; `privacidad_leida_en` NULL; `creado_en` NOT NULL; `baja_en` NULL; índice `(rol, estado)`; sin columna de saldo) y `registro_auditoria` (`actor_id` NULL → `usuario.id`; `accion`, `objeto_tipo`, `objeto_id`, `detalle` y `creado_en` NOT NULL; índice `(objeto_tipo, objeto_id)`)
  - `src/lib/server/auth/esquema.ts`: `credencial` (`usuario_id` PK → `usuario.id`; `hash` NOT NULL; `intentos_fallidos` INTEGER NOT NULL DEFAULT 0, CHECK ≥ 0; `bloqueado_hasta` NULL; `actualizada_en` NOT NULL), `sesion` (`id_hash` PK; `usuario_id` NOT NULL con índice; `creada_en`, `ultimo_uso_en` y `ultima_autenticacion_en` NOT NULL; sin columna de caducidad) y `enlace_acceso` (`id` ULID; `usuario_id` NOT NULL con índice; `tipo` CHECK `IN ('invitacion', 'recuperacion')`; `token_hash` NOT NULL UNIQUE; `expira_en` NOT NULL; `usado_en`, `anulado_en` y `creado_por` NULL; `creado_en` NOT NULL)
  - `src/lib/server/configuracion/esquema.ts`: `configuracion` (`clave` PK; `valor` NOT NULL, JSON; `modificado_por` NOT NULL → `usuario.id`; `modificado_en` NOT NULL)
- [X] T029 Escribir `src/hooks.server.ts`: `handle` con el contexto de operación; responde a `GET /robots.txt` antes de `resolve` con `200 text/plain`, `User-agent: *` y `Disallow: /` (research R15; sin `+server.ts`); añade a toda respuesta `X-Robots-Tag: noindex, nofollow`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` y `Strict-Transport-Security: max-age=31536000` solo si `ORIGIN` es https; registra `peticion.completada` y `operacion.rechazada`; `handleError` registra el error y devuelve el `operacionId`. Configurar `kit.csp` en `svelte.config.js` con las directivas de research R15. Definir `__APP_VERSION__` y `__APP_COMMIT__` en `vite.config.ts` (de `GIT_COMMIT`, o `git rev-parse --short HEAD`, o `desconocido`) y declararlas en `src/app.d.ts`
- [X] T030 [P] Crear `src/routes/api/salud/+server.ts` (200 `{ estado: 'ok', version }` si la base responde; 503 `{ estado: 'error' }`; evento en `debug`)
- [X] T031 Crear `src/lib/server/arranque.ts` como raíz de composición: recibe un objeto `Dependencias`, aplica las migraciones y registra `app.arranque` (`version`, `commit`, `node`, `nivelLog`) y `app.migraciones_aplicadas`. Con un entorno no válido, registra `app.entorno_invalido` con los nombres de las variables, sin valores, y termina con código 1

### Bases de los módulos

- [X] T032 Crear `src/lib/server/configuracion/leer.ts` e `index.ts`: devuelve `plazo_autoanulacion_min` = 15, `limite_deuda_centimos` = −500 e `intervalo_rellenos_min` = 60 si no hay fila; si un valor guardado no supera su esquema, registra `dato.invalido` y usa el valor por defecto. Prueba en `src/lib/server/configuracion/leer.test.ts`
- [X] T033 Crear en `src/lib/server/usuarios/` `consultas.ts` (por id, por correo normalizado, número de administradores activos, lista), `alta.ts` (`crearUsuario(tx, …)` que normaliza el correo a minúsculas y sin espacios y traduce el índice único a `CORREO_DUPLICADO`), `auditoria.ts` (`anotarAuditoria(tx, …)` con un esquema de `detalle` por acción: `usuario.alta` `{ rol }`, `usuario.rol_cambiado` `{ rolAnterior, rolNuevo }`, `usuario.reactivado` `{}`, `enlace.generado` `{ tipo: 'invitacion' | 'recuperacion', origen: 'aplicacion' | 'arranque' | 'comando' }`, validado al escribir y al leer), `eventos.ts`, `index.ts` y `pruebas/constructores.ts` (`construirUsuario({ rol, estado, … })` con valores por defecto legibles e ids ULID fijos; admite `estado: 'baja'`, research R17)
- [X] T034 Crear `src/lib/server/auth/contrasenas.ts` (Argon2id con m = 19 456, t = 2, p = 1 en formato PHC; NFC; de 15 a 256 puntos de código; sin reglas de composición; lista de bloqueo comparada en minúsculas y NFC; hash de referencia para correos inexistentes), `src/lib/server/auth/contrasenas-comunes.txt` (entradas de 15 caracteres o más de «10-million-password-list-top-1000000» de SecLists, MIT, con la fuente y el procedimiento de generación en la cabecera) y su prueba `contrasenas.test.ts` (14 rechazada, 15 aceptada, 256 aceptada, 257 rechazada, una de la lista rechazada, parámetros de Argon2id según RNF-004). Medir el coste de una verificación y anotarlo en `runs.jsonl`
- [X] T035 Crear `src/lib/server/auth/sesiones.ts`: identificador de 32 bytes en base64url en la cookie `becafe_sesion` (`HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age` de 90 días, `Secure` si `ORIGIN` es https); guarda solo su SHA-256; caducidad = `ultimo_uso_en` + 90 días; actualiza `ultimo_uso_en` como mucho una vez por hora; descarta la sesión de un usuario no activo; borra la sesión actual, todas o todas salvo la actual. Resolver la sesión en `src/hooks.server.ts` y dejar el usuario en `event.locals`. Prueba `sesiones.test.ts` con reloj fijo (RN-049: renovación y caducidad; RNF-005: atributos de la cookie, `Secure` con `ORIGIN` https, y hash)
- [X] T036 Crear `src/lib/server/auth/actor.ts` y `src/lib/server/auth/reautenticacion.ts`: `actor` con `usuarioId`, `rol` y `autenticadoEn`; exigir sesión (`SIN_SESION`), rol de administrador (`SIN_PERMISO` y `auth.permiso_denegado`) y autenticación de hace 15 minutos o menos (con 15 minutos exactos se permite); con `contrasenaActual` correcta actualiza `ultima_autenticacion_en` en la misma petición; si es incorrecta, error de campo sin contar para el bloqueo (research R9); eventos `auth.reautenticacion`
- [X] T037 Crear `src/lib/server/auth/enlaces.ts`: token de 32 bytes en base64url con solo su SHA-256 guardado; tipo `invitacion` (24 h) si el usuario no tiene `credencial` y `recuperacion` (1 h) si la tiene; anula los enlaces sin usar del usuario en la misma transacción; anota `enlace.generado`; valida sin consumir; enlace válido = `usado_en IS NULL`, `anulado_en IS NULL` y `expira_en` posterior al instante actual; eventos `auth.enlace_generado` y `auth.enlace_rechazado`. Prueba `enlaces.test.ts` con reloj fijo (`it('CA-132: …')` vigencias de 24 h y 1 h antes y después del límite, generar otro enlace anula el anterior, validar no consume)
- [X] T038 Crear `src/lib/shared/contratos/registro-cliente.ts` (versión 1, `z.strictObject`, de 1 a 10 eventos, unión discriminada por `codigo` sobre el catálogo de cliente), `src/lib/server/plataforma/limitador.ts` (ventana fija de 60 s), `src/routes/api/registro-cliente/+server.ts` (401 `SIN_SESION`; 415 si no es JSON; 413 `LIMITE_SUPERADO` por encima de 16 KiB; 429 `LIMITE_SUPERADO` por encima de 30 eventos por minuto y sesión; 400 `VALIDACION`; 204 con `origen: 'cliente'`; `cliente.registro_rechazado` como mucho una vez por minuto y sesión) y `src/lib/client/registro.ts` (`loglevel` con `setDefaultLevel`; envía en lotes solo `warn` y `error`)
- [X] T039 [P] Crear `src/params/token.ts` (`^[A-Za-z0-9_-]{43}$`) y `src/params/ulid.ts` (ULID de 26 caracteres Crockford base32), `src/routes/+layout.svelte` (crea los contextos de T006 y pinta `ToastRegion`), `src/routes/+error.svelte` (mensaje en español y `operacionId`) y `src/lib/ui/formularios.ts` (opciones de `use:enhance` compartidas: aviso de confirmación con el texto de la respuesta y aviso de sin conexión ante un fallo de red, sin perder lo escrito)
- [X] T040 Pruebas de la plataforma: `src/lib/server/plataforma/db/db.test.ts` (migraciones sobre una base vacía; `enTransaccion` deshace todo ante un error), `src/lib/server/plataforma/registro.test.ts` (RNF-014: `redact` oculta las rutas prohibidas; `LOG_LEVEL` no válido impide arrancar), `src/routes/api/registro-cliente/server.test.ts` (401, 415, 413, 429, 400 y 204) y `e2e/api/cabeceras.spec.ts` (RNF-016: `/robots.txt` con `Disallow: /` y `X-Robots-Tag` en `/robots.txt` y `/login`; CSP y `Referrer-Policy` presentes; RNF-006: un POST desde otro origen recibe 403; `/api/salud` responde 200)

**Lote F1-L2**: T022–T040 → `plataforma/`, `hooks.server.ts`, esquema y primera migración → `test:changed` + `npm run verify` (cambian `plataforma/`, los hooks y el esquema) + `npm run test:e2e -- --project=api` → `runs.jsonl` → siempre `verify`.

**Checkpoint**: base lista; las historias pueden empezar.

---

## Phase 3: User Story 3 - Primer administrador de la instalación (Priority: P1) 🎯 MVP

**Goal**: una instalación nueva crea su primer administrador, y el operador puede recuperar el acceso desde el contenedor (RF-139, RF-139b).

**Independent Test**: se arranca una base sin usuarios con las dos variables. La salida estándar muestra el enlace y el fichero de log no lo contiene.

### Tests for User Story 3 ⚠️

- [X] T041 [P] [US3] `src/lib/server/arranque.test.ts` con directorio temporal y captura de la salida estándar: `it('CA-139: …')` sin usuarios y con las dos variables crea el administrador con ese correo y nombre, la salida estándar contiene el enlace de 24 h y el fichero de `<DIRECTORIO_DATOS>/logs/` contiene `auth.admin_inicial_creado` sin el enlace; con usuarios no se crea nada; sin `ADMIN_INICIAL_EMAIL` o sin `ADMIN_INICIAL_NOMBRE` termina con código 1 y registra `app.entorno_invalido` con el nombre, sin valores; la auditoría tiene `actor_id` nulo y `origen: 'arranque'`
- [X] T042 [P] [US3] `scripts/servidor/recuperar-admin.test.ts`: `it('CA-139: RF-139b …')` administrador activo → enlace de recuperación de 1 h y salida 0; correo nuevo con `--nombre` → administrador con invitación de 24 h y salida 0; correo nuevo sin `--nombre` → salida 2; miembro o persona de baja (creada con `construirUsuario`) → salida 3 sin cambios; entorno no válido → salida 1 con los nombres; auditoría con `origen: 'comando'`

### Implementation for User Story 3

- [X] T043 [US3] Crear `src/lib/server/auth/admin-inicial.ts` (con `usuarios.crearUsuario` y `enlaces.generar`, crea el administrador y su invitación en una transacción, con auditoría `usuario.alta` y `enlace.generado` `origen: 'arranque'` u `origen: 'comando'`) y conectarlo en `src/lib/server/arranque.ts`: si no hay usuarios, exige `ADMIN_INICIAL_EMAIL` y `ADMIN_INICIAL_NOMBRE`; escribe `auth.admin_inicial_creado` en el registro normal y el enlace solo con la instancia de salida estándar
- [X] T044 [US3] Crear `scripts/servidor/recuperar-admin.ts` (`--correo <correo> [--nombre <nombre>]`, códigos de salida de `contracts/api.md`; valida `DIRECTORIO_DATOS` y `ORIGIN` con los esquemas de `src/env.ts`), su empaquetado con `vite build --ssr` en `build-scripts/recuperar-admin.js` (externos `better-sqlite3` y `@node-rs/argon2`) y el script `npm run admin:recuperar`

**Lote F1-L5 (US3)**: T041–T044 → `arranque.ts`, `auth`, comando → `test:changed` + `npm run verify` (cambia el arranque) → `runs.jsonl` → —.

**Checkpoint**: una instalación nueva tiene administrador con un enlace de invitación.

---

## Phase 4: User Story 2 - Definir la contraseña, entrar y gestionar las sesiones (Priority: P1)

**Goal**: definir la contraseña con un enlace, iniciar sesión con bloqueo, cambiar la contraseña y cerrar sesiones (RF-132, RF-133, RF-137, RF-138, RN-055).

**Independent Test**: una persona define su contraseña con un enlace válido y entra. Con una contraseña incorrecta recibe el mismo mensaje que con un correo inexistente.

### Tests for User Story 2 ⚠️

- [X] T045 [P] [US2] `src/lib/server/auth/iniciar-sesion.test.ts` con reloj fijo: `it('CA-133: …')` 4 fallos no bloquean; el quinto bloquea; el sexto intento, aunque sea correcto, se rechaza; 15 min antes del fin sigue bloqueada, en el límite y después se evalúa; el bloqueo no se alarga; mismo mensaje para correo inexistente, contraseña incorrecta y cuenta bloqueada; los fallos con correo inexistente no se cuentan; `it('RN-055: …')` un usuario de baja, creado con `construirUsuario({ estado: 'baja' })`, recibe el mismo mensaje; eventos `auth.acceso_fallido` sin correo
- [X] T046 [P] [US2] `src/lib/server/auth/definir-contrasena.test.ts`: `it('CA-132: …')` 14 caracteres rechazada, 15 aceptada, contraseña de la lista rechazada (RN-053), enlace usado o caducado → `ENLACE_NO_VALIDO`; tras el éxito, enlace usado, sesiones anteriores borradas (RN-051) y sesión nueva
- [X] T047 [P] [US2] `src/lib/server/auth/cambiar-contrasena.test.ts`: `it('CA-137: …')` cerrar sesión en todos los dispositivos invalida todas las sesiones en la siguiente petición; cambiar la contraseña desde el perfil borra las demás sesiones y mantiene la actual (aclaración 9); contraseña actual incorrecta → `CREDENCIALES_INCORRECTAS`
- [X] T048 [P] [US2] `src/lib/server/auth/reautenticacion.test.ts` con reloj fijo: `it('CA-138: …')` con 15 minutos exactos se permite la acción; con 16 se rechaza con `REAUTENTICACION_REQUERIDA`; con `contrasenaActual` correcta se ejecuta y actualiza `ultima_autenticacion_en`; con una incorrecta, error de campo sin contar para el bloqueo

### Implementation for User Story 2

- [X] T049 [US2] Crear `src/lib/server/auth/iniciar-sesion.ts` según research R7: contador y bloqueo en `credencial`; quinto fallo seguido → `bloqueado_hasta` = instante del fallo + 15 min; mensaje único «Correo o contraseña incorrectos. Tras 5 intentos fallidos, la cuenta se bloquea 15 minutos.»; verificación con hash de referencia si el correo no existe; sesión nueva en cada inicio; eventos `auth.sesion_iniciada`, `auth.acceso_fallido` y `auth.cuenta_bloqueada`
- [X] T050 [US2] Añadir a `src/lib/server/auth/enlaces.ts` `definirContrasenaConEnlace`: en una transacción comprueba el enlace, valida RN-053, guarda el hash, marca el enlace como usado, borra las sesiones del usuario y crea una nueva; eventos `auth.enlace_usado` y `auth.contrasena_cambiada` (`via: 'enlace'`)
- [X] T051 [US2] Añadir a `src/lib/server/auth/sesiones.ts` `cerrarSesionesGlobal` (`auth.sesion_cerrada`, `alcance: 'todas'`) y crear `src/lib/server/auth/cambiar-contrasena.ts` (verifica la actual, guarda el hash, contador a 0, borra las demás sesiones; `alcance: 'otras'`, `via: 'perfil'`). Exportar en `src/lib/server/auth/index.ts`
- [X] T052 [P] [US2] Crear `src/lib/shared/contratos/auth.ts` con `z.strictObject`: inicio de sesión (`email` con `z.email()` normalizado, `contrasena` de 1 a 256), definición de contraseña (`contrasena` y `repeticion` iguales) y cambio de contraseña (`contrasenaActual`, `contrasenaNueva`, `repeticion`)
- [X] T053 [US2] Crear `src/routes/(auth)/login/+page.server.ts` y `+page.svelte` (con sesión válida, 303 a `/`; *action* `default`; 400 `VALIDACION` o 401 `CREDENCIALES_INCORRECTAS` con `valores = { email }`; formulario sobre superficie estable, sin la tarjeta de cristal; `use:enhance` con las opciones de T039)
- [X] T054 [US2] Crear `src/routes/(auth)/acceso/[token=token]/+page.server.ts` y `+page.svelte` (el `load` devuelve `{ valido, tipo }` sin consumir; `Cache-Control: no-store`; *action* `default` con 400 `CONTRASENA_NO_VALIDA` o 410 `ENLACE_NO_VALIDO` y «Enlace no válido o caducado»; éxito → 303 a `/aceptar-privacidad` o a `/`)
- [X] T055 [US2] Crear `src/routes/logout/+page.server.ts` (*action* `default`: borra la sesión y la cookie, 303 a `/login`), `src/routes/(app)/+page.server.ts` y `+page.svelte` (estado vacío provisional) y `src/routes/(app)/perfil/+page.server.ts` y `+page.svelte` (`{ nombre, email, rol }`; *actions* `cambiarContrasena`, con confirmación anunciada, y `cerrarSesionesGlobal`, con `ConfirmDialog` con JavaScript y envío directo sin él)
- [X] T056 [US2] Pruebas de las *actions* con `crearEventoAccion` en `src/routes/(auth)/login/page.server.test.ts`, `src/routes/(auth)/acceso/[token=token]/page.server.test.ts` y `src/routes/(app)/perfil/page.server.test.ts`: `valores` nunca contiene contraseñas; códigos y estados de `contracts/rutas.md`; `cambiarContrasena` devuelve el mensaje de confirmación
- [X] T057 [US2] Crear `scripts/servidor/sembrar-e2e.ts` (Ana administradora con contraseña, Luis miembro con contraseña, Pedro activo sin contraseña y con invitación; sin usuarios de baja; solo con funciones públicas de los módulos: `usuarios.crearUsuario`, la generación de enlaces y `definirContrasenaConEnlace` de `auth`; escribe en la salida estándar un JSON con los enlaces), su empaquetado en `build-scripts/sembrar-e2e.js`, y conectarlo a `e2e/fixtures/servidor.ts`. Crear `e2e/fixtures/sesiones.ts` (proyecto de preparación que guarda el `storageState` de `anonimo`, `miembro` y `administrador`) y `e2e/acceso/rutas.ts` (lista de rutas de F1 de la que se generan los casos de EV-050) (T-TEST-002, T-TEST-003, T-TEST-004) *Desviación:* la sesión E2E entra por el formulario (`e2e/fixtures/sesiones.ts`), sin `storageState`; ver `docs/pruebas.md` §12.1.
- [X] T058 [US2] Añadir a `.github/workflows/ci.yml` (archivo protegido) la caché de los navegadores de Playwright y el paso `npx playwright test` con los cinco proyectos contra la build, con artefactos solo si algo falla (T-TEST-006) *Hecho el 22-10-2026 en el mismo `ci.yml`. Pendiente la primera ejecución en GitHub.*
- [X] T059 [US2] E2E: `e2e/flujos/cierre-global.spec.ts` (CA-137, dos contextos), `e2e/sin-js/login.spec.ts` y `e2e/sin-js/definir-contrasena.spec.ts`, rutas `/logout` y `/perfil` en `e2e/acceso/rutas.ts`, `e2e/a11y/acceso.spec.ts` (`/login`, `/acceso/[token]` y `/perfil` en claro y oscuro; confirmación del cambio de contraseña con `getByRole('status')`) y, en `e2e/api/cabeceras.spec.ts`, `X-Robots-Tag` en `/perfil` con sesión (RNF-016)

**Lote F1-L4/L6 (US2)**: T045–T059 → `auth`, rutas de acceso y perfil, siembra, CI → `test:changed`, `lint:changed`, `check`, `test:e2e:quick -- e2e/flujos/cierre-global.spec.ts`, `sin-js` y `api` → `runs.jsonl` → matriz completa si cambia el formulario de acceso.

**Checkpoint**: el primer administrador define su contraseña y entra; existen la siembra y las sesiones por rol.

---

## Phase 5: User Story 1 - Dar de alta y gestionar usuarios (Priority: P1)

**Goal**: un administrador da de alta personas, cambia roles, reactiva usuarios y genera enlaces, con auditoría (RF-130, RF-131, RF-134, RF-136, RF-139c).

**Independent Test**: un administrador da de alta a Pedro, copia el enlace de 24 h y ve a Pedro activo sin contraseña.

### Tests for User Story 1 ⚠️

> Se escriben antes o justo después del código: tocan permisos e invariantes (`docs/pruebas.md` §4).

- [X] T060 [P] [US1] `src/lib/server/usuarios/roles.test.ts`: `it('CA-134: …')` el único administrador activo no puede quitarse el rol (`ULTIMO_ADMIN`) y `it('EV-040: …')` dos `worker_threads` con conexiones propias y `Atomics.wait` quitan a la vez el rol al otro; solo se aplica un cambio y queda un administrador activo *Desviación aceptada por la persona usuaria:* dos conexiones SQLite en el mismo proceso, sin `worker_threads`.
- [X] T061 [P] [US1] `src/lib/server/auth/invitar.test.ts`: `it('CA-130: …')` Pedro queda activo sin `credencial`; `it('CA-131: …')` el enlace es de invitación y caduca a las 24 h; `CORREO_DUPLICADO` con el mismo correo en otra capitalización; `it('CA-139c: …')` alta, cambio de rol, reactivación y enlace dejan cada uno una fila con autor y fecha, sin correos ni nombres en `detalle`; eventos comprobados con `crearRegistroFalso()`
- [X] T062 [P] [US1] `src/lib/server/auth/reactivar.test.ts`: `it('CA-136: …')` un usuario de baja (`construirUsuario({ estado: 'baja' })`) vuelve a `activo`, sin `credencial`, sin enlaces válidos ni sesiones, y el siguiente enlace es una invitación de 24 h; 409 si ya está activo; 409 al generar un enlace para un usuario de baja

### Implementation for User Story 1

- [X] T063 [US1] Crear `src/lib/server/usuarios/roles.ts` (`cambiarRol(tx, …)`: cuenta los administradores activos dentro de `BEGIN IMMEDIATE`, rechaza con `ULTIMO_ADMIN`, anota `usuario.rol_cambiado` y emite el evento) y exportarlo en `src/lib/server/usuarios/index.ts`
- [X] T064 [US1] Crear `src/lib/server/usuarios/reactivar.ts` (`reactivarUsuario(tx, …)`: de `baja` a `activo`, anota `usuario.reactivado`) y exportarlo
- [X] T065 [US1] Crear `src/lib/server/auth/invitar.ts`, que coordina en una transacción: alta con invitación (`usuarios.crearUsuario` + enlace + auditoría `usuario.alta` y `enlace.generado` con `origen: 'aplicacion'`); reactivación (`usuarios.reactivarUsuario` + borrar `credencial`, anular enlaces y borrar sesiones); generar enlace para un usuario (409 si está de baja; tipo según aclaración 8). Cada caso exige administrador reautenticado (T036). Exportar en `src/lib/server/auth/index.ts`
- [X] T066 [P] [US1] Crear `src/lib/shared/contratos/usuarios.ts` con `z.strictObject`: alta (`nombre` de 1 a 80 tras `trim`, `email` con `z.email()` normalizado, `rol` `miembro` | `administrador`, `contrasenaActual` opcional), `cambiarRol`, `generarEnlace` y `reactivar` (cada uno con `contrasenaActual` opcional) y el parámetro `usuarioId`
- [X] T067 [US1] Crear `src/routes/(app)/admin/+page.server.ts` y `+page.svelte` (secciones disponibles; miembro → `error(403, mensaje)` decidido por el caso de uso)
- [X] T068 [US1] Crear `src/routes/(app)/admin/usuarios/+page.server.ts` y `+page.svelte`: lista (`id`, `nombre`, `email`, `rol`, `estado`, `tieneContrasena`, sin saldo), aviso de RN-042 si hay un solo administrador activo, *action* `alta` que devuelve `{ enlace, expiraEn }` para `CopyField` y el mensaje de confirmación, formulario sobre superficie estable, `ReauthDialog` con JavaScript y campo `contrasenaActual` en el mismo formulario sin JavaScript (research R9 y R16), `use:enhance` con las opciones de T039 *Desviación aceptada por la persona usuaria:* `ReauthDialog` con el campo `contrasenaActual` condicional.
- [X] T069 [US1] Crear `src/routes/(app)/admin/usuarios/[usuarioId=ulid]/+page.server.ts` y `+page.svelte`: *actions* `cambiarRol`, `generarEnlace` (devuelve `{ enlace, tipo, expiraEn }`) y `reactivar`, cada una con su mensaje de confirmación, y los errores de `contracts/rutas.md` (401, 403, 404, 409)
- [X] T070 [US1] Pruebas de las *actions* con `crearEventoAccion` en `src/routes/(app)/admin/usuarios/page.server.test.ts` y `src/routes/(app)/admin/usuarios/[usuarioId=ulid]/page.server.test.ts`: `valores` sin contraseñas, 401 `REAUTENTICACION_REQUERIDA`, 403 `SIN_PERMISO` para un miembro, 409 `ULTIMO_ADMIN`, mensaje de confirmación en cada éxito, y el aviso de RN-042 en el `load` con un administrador activo y no con dos
- [X] T071 [US1] E2E: `e2e/flujos/alta-usuario.spec.ts` (`chromium-escritorio`, CA-130 y CA-131: alta, confirmación con `getByRole('status')` y copia del enlace), `e2e/sin-js/alta-usuario.spec.ts` (también con la confirmación por `Banner`), rutas de `/admin*` en `e2e/acceso/rutas.ts` (EV-050) y `e2e/a11y/admin.spec.ts` (axe en claro y oscuro)

**Lote F1-L3/L7 (US1)**: T060–T071 → `usuarios`, `auth`, rutas `/admin*` → `test:changed`, `lint:changed`, `check`, `test:e2e:quick -- e2e/flujos/alta-usuario.spec.ts`, proyectos `sin-js` y `api` → `runs.jsonl` → matriz completa si cambia el formulario de alta.

**Checkpoint**: alta → enlace → contraseña → inicio de sesión funciona de principio a fin.

---

## Phase 6: User Story 4 - Texto de privacidad (Priority: P2)

**Goal**: nadie usa la aplicación sin haber leído la versión vigente del texto de privacidad (RF-160, RF-161).

**Independent Test**: una persona nueva no puede usar la aplicación hasta pulsar «He leído el texto»; quedan la fecha y la versión.

### Tests for User Story 4 ⚠️

- [X] T072 [P] [US4] `src/lib/server/usuarios/privacidad.test.ts` y `src/hooks.server.test.ts`: `it('CA-160: …')` aceptar guarda la versión y el instante; con una versión vigente mayor vuelve a estar pendiente; con la privacidad pendiente, un GET de página redirige 303 a `/aceptar-privacidad` y un POST o un `/api/*` recibe 403 `PRIVACIDAD_PENDIENTE`; `/aceptar-privacidad`, `/logout`, `/api/salud`, `/api/registro-cliente` y `/robots.txt` no pasan por la puerta *Desviación:* sin `src/hooks.server.test.ts`; la puerta se cubre en `puerta-privacidad.test.ts` y en los E2E de privacidad.

### Implementation for User Story 4

- [X] T073 [P] [US4] Crear `src/lib/shared/privacidad.ts` (`VERSION_PRIVACIDAD = 1` y el texto del anexo A con sus marcadores, PEND-014) y adaptar `PrivacyText` en `src/lib/ui/`
- [X] T074 [US4] Crear `src/lib/server/usuarios/privacidad.ts` (`aceptarPrivacidad`, evento `privacidad.aceptada` con `usuarioId` y `version`) y añadir la puerta de research R10 en `src/hooks.server.ts`
- [X] T075 [US4] Crear `src/routes/(gate)/aceptar-privacidad/+page.server.ts` y `+page.svelte` (`{ version, primeraVez }`, sin navegación; si no hay nada pendiente, 303 a `/`; *action* `aceptar` → 303 a `/?aviso=privacidad-aceptada`), validar en `src/routes/(app)/+page.server.ts` el parámetro con `z.strictObject({ aviso: z.literal('privacidad-aceptada').optional() })` y mostrar la confirmación con `role="status"`, y crear `src/routes/(app)/privacidad/+page.server.ts` y `+page.svelte` (`{ version, leidaEn }`); añadir el enlace permanente en `/perfil` (RF-161)
- [X] T076 [US4] E2E: `e2e/flujos/invitacion-privacidad.spec.ts` (`chromium-movil`: enlace de Pedro → contraseña → `/aceptar-privacidad` → `/` con la confirmación en `getByRole('status')`; reabrir el enlace muestra «Enlace no válido o caducado»; CA-132 y CA-160), `e2e/sin-js/aceptar-privacidad.spec.ts`, rutas en `e2e/acceso/rutas.ts` y `e2e/a11y/privacidad.spec.ts`

**Lote F1-L6 (US4)**: T072–T076 → `hooks.server.ts`, `usuarios`, rutas de privacidad → `test:changed` + `npm run verify` (cambian los hooks) + `test:e2e:quick -- e2e/flujos/invitacion-privacidad.spec.ts`, `sin-js` y `api` → `runs.jsonl` → —.

**Checkpoint**: el flujo completo de una persona nueva funciona.

---

## Phase 7: User Story 5 - Tema y transparencia (Priority: P2)

**Goal**: cada persona elige el tema y la transparencia en su dispositivo (RF-180, RF-181, RNF-015).

**Independent Test**: cambiar de tema no pierde lo escrito ni el foco; «Reducir transparencia» deja todas las superficies opacas con las mismas acciones.

### Tests for User Story 5 ⚠️

- [X] T077 [P] [US5] `src/lib/shared/contratos/apariencia.test.ts`: `becafe-tema` acepta `auto` | `claro` | `oscuro` (por defecto `auto`) y `becafe-transparencia` acepta `normal` | `reducida` (por defecto `normal`); un valor no válido o un `localStorage` que lanza devuelven el valor por defecto
- [X] T078 [P] [US5] `e2e/a11y/apariencia.spec.ts` (`chromium-movil`): `it('CA-180: …')` con el sistema en oscuro y sin preferencia, la aplicación está en oscuro con «Automático»; al emular el cambio a claro cambia sin recargar; con texto escrito en `/perfil`, elegir «Claro» conserva el texto y el foco y persiste al recargar; `it('CA-181: …')` con «Reducir transparencia» ninguna superficie tiene `backdrop-filter` y siguen las mismas acciones; `it('EV-061: …')` en cada pantalla de F1, con `forced-colors`, `prefers-contrast: more`, `prefers-reduced-motion`, texto al 200 % y 320 px de ancho, sin pérdida de texto, límites, foco ni función, y axe sin infracciones

### Implementation for User Story 5

- [X] T079 [P] [US5] Crear `src/lib/shared/contratos/apariencia.ts` con los esquemas de las dos claves; la lectura no válida registra `dato.invalido` en el cliente sin el valor
- [X] T080 [US5] Añadir a `src/app.html` el script en línea con `nonce="%sveltekit.nonce%"` que aplica `data-theme` y `data-transparencia` antes de pintar (solo valores de la lista cerrada), y a `src/app.css` las reglas que tratan `[data-transparencia="reducida"]` igual que `@media (prefers-reduced-transparency: reduce)`, sin quitar nunca la reducción del sistema
- [X] T081 [US5] Adaptar el contexto de tema de `src/lib/ui/contextos/` (claves `becafe-tema` y `becafe-transparencia`, todo acceso a `localStorage` en `try/catch`, «Automático» escucha `matchMedia('(prefers-color-scheme: dark)')`) y añadir a `/perfil` el `ThemeToggle` (Automático, Claro, Oscuro) y un interruptor «Reducir transparencia» (crear `src/lib/ui/Switch.svelte` solo si el componente actual no cumple)
- [X] T082 [US5] Prueba de componente en `src/lib/ui/ThemeToggle.test.ts` (Browser Mode): cambiar de opción actualiza el atributo de `<html>` sin mover el foco

**Lote F1-L7 (US5)**: T077–T082 → `lib/ui`, `app.html`, `app.css`, `/perfil` → `test:changed`, `test:componentes`, `lint:changed`, `check`, `test:e2e:quick -- e2e/a11y` → `runs.jsonl` → matriz completa si cambian los tokens o el cristal.

**Checkpoint**: todas las historias funcionan.

---

## Phase 8: Polish & Cross-Cutting Concerns (F1-L8 cierre)

- [X] T083 [P] Actualizar `ARCHITECTURE.md`: §2 (`build-scripts/`, `scripts/servidor/`, `docs/diseno/recursos/`), §3 (`credencial` en `auth` y la coordinación de research R11), §4 y §12 (solo un `*.test.ts` puede importar `src/lib/server/<otro>/pruebas/`), §6 (códigos de R12), §7 (puerta de privacidad en `hooks.server.ts` y `/robots.txt` respondido por `handle`), §8 (restricción de `ORIGIN`), §9 (eventos de `contracts/entorno-y-eventos.md`) y §14 (CSP y límites de `/api/registro-cliente` resueltos; `X-Robots-Tag` de los estáticos aplazado al proxy de F7) *Hecho el 22-10-2026: §4, §6, §7, §8, §9, §12 y §14 contrastados con el código.*
- [X] T084 [P] Actualizar `docs/pruebas.md`: §23 con T-TEST-001 a 006 y 008 hechas; §24 con los falsos de push y S3 aplazados al plan de F5; documentar las fixtures, los constructores, la siembra y los comandos nuevos
- [X] T085 Actualizar en `AGENTS.md` (archivo protegido) el apartado «Estado del repositorio» tras el scaffold y la referencia a `docs/diseno/` del §1.5 *Hecho el 22-10-2026 tras la aprobación de la persona usuaria y su confirmación nativa.*
- [X] T086 Recorrer `quickstart.md`, pasos 1 a 6, y anotar el resultado de cada uno en este archivo **Resultado (22-10-2026):** paso 1, `design-system/` ya no existe y `docs/diseno/README.md` está; paso 2, con una build de prueba y directorio de datos temporal, la consola muestra el enlace de invitación, el fichero diario no lo contiene, un reinicio no crea usuarios ni enlaces, y sin `ADMIN_INICIAL_NOMBRE` se registra `app.entorno_invalido` con solo el nombre y el proceso termina con código 1 (queda una traza de Node en la salida estándar, pendiente de decisión); paso 3 (14 y 15 caracteres, privacidad, enlace usado), paso 4 (alta, `ULTIMO_ADMIN`, sin JavaScript) y paso 5 (bloqueo tras cinco fallos) están cubiertos por la E2E y las pruebas de integración citadas en `tasks.md`, pero no se recorrieron a mano; paso 5.3 y paso 6 (cabeceras de `/robots.txt` y `/login`, `Referrer-Policy: strict-origin`) se comprobaron con `curl`; paso 7, benchmark en verde.
- [X] T087 Volver a medir el número de archivos de TypeScript y anotarlo en `runs.jsonl`
- [X] T088 Ejecutar en serie el benchmark completo (`scripts/benchmark.sh` en Linux) y proponer avisos de duración con sus datos (T-TEST-007)
- [ ] T089 Pedir a la persona usuaria la revisión manual con VoiceOver (iOS) y TalkBack (Android) de las pantallas de F1 y anotar el resultado aquí (constitución XI) **DEUDA ACEPTADA (22-10-2026, decisión de la persona usuaria):** la revisión manual con VoiceOver y TalkBack no se hace antes del cierre de F1. Incumple el principio XI de la constitución («antes de cerrarse»). Queda pendiente y debe hacerse antes de la primera publicación en producción.
- [ ] T090 Puerta de F1 (`docs/pruebas.md` §20.2): todos los lotes cerrados, cada CA y EV con su prueba en verde, benchmark en verde, sin `waitForTimeout` ni pruebas omitidas, `git status` sin `.env`, `*.db`, `.local/` ni informes generados, e informe de lo ejecutado, lo reutilizado y lo no verificable **Estado parcial (22-10-2026):** cada CA y EV del alcance de F1 tiene una prueba que lo nombra; CA-135, EV-041 y CA-150 son de F4 y F7 y quedan fuera. Sin `waitForTimeout`, sleeps ni `.only`; el único `skip` es el de `apariencia.spec.ts`, por diseño, fuera de `chromium-movil`. Pendiente: T089 y la primera ejecución de la CI en GitHub, tras el push. **No cerrada:** F1 tiene todo lo verificable en verde, pero la revisión con lector de pantalla (T089) queda como deuda aceptada, así que la puerta de F1 no se da por superada.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (fase 1)**: F1-L0 antes de F1-L1.
- **Foundational (fase 2)**: depende de la fase 1 y bloquea todas las historias. Dentro de ella, `/api/registro-cliente` (T038) va después de las sesiones (T035).
- **US3 (fase 3)**: depende de la fase 2. Solo usa `crearUsuario` y `enlaces.generar`.
- **US2 (fase 4)**: depende de US3: la siembra (T057) y las E2E parten de un administrador con enlace. Cierra la siembra, las sesiones por rol y las E2E en la CI.
- **US1 (fase 5)**: depende de US2: sus E2E necesitan el inicio de sesión y el `storageState` de administrador.
- **US4 (fase 6)**: depende de US2 (definición de contraseña) y, para su E2E, de la siembra.
- **US5 (fase 7)**: depende de `/perfil` (T055).
- **Polish (fase 8)**: depende de todas las historias.

### Within Each User Story

- Las pruebas de permisos, invariantes y límites de tiempo se escriben antes o justo después del caso de uso.
- Esquemas y casos de uso antes que las rutas; rutas antes que los E2E.

### Parallel Opportunities

- Fase 1: T011–T015 y T017–T019 en paralelo tras T010.
- Fase 2: T024, T025, T030 y T039 en paralelo cuando existan sus dependencias.
- En cada historia, las tareas de prueba marcadas [P] van en paralelo entre sí, igual que los contratos de `lib/shared/contratos/`.
- Las historias no van en paralelo: cada una depende de la anterior (ver arriba).
- No se ejecutan lint y pruebas a la vez (`AGENTS.md` §7): el paralelismo es de escritura, no de verificación.

## Parallel Example: User Story 1

```text
Task: "T060 [US1] roles.test.ts (CA-134, EV-040)"
Task: "T061 [US1] invitar.test.ts (CA-130, CA-131, CA-139c)"
Task: "T062 [US1] reactivar.test.ts (CA-136)"
Task: "T066 [US1] contratos/usuarios.ts"
```

## Implementation Strategy

### MVP

1. Fases 1 y 2.
2. US3, US2 y US1 (las tres P1): una instalación nueva tiene administrador, este entra, da de alta personas y estas entran.
3. Parar y validar con los pasos 2 a 4 de `quickstart.md`.

### Entrega incremental

- US4 añade la puerta de privacidad, obligatoria antes de usar datos reales (PEND-014).
- US5 completa la apariencia y la accesibilidad de EV-061.
- La fase 8 cierra F1 con la puerta de `docs/pruebas.md` §20.2. F1 no se da por terminada sin ella.

## Notes

- Las tareas [P] tocan archivos distintos y no dependen de tareas pendientes.
- Cada historia se puede comprobar en su checkpoint con lo que entregan las anteriores.
- Commit y push solo cuando la persona usuaria lo pida (`AGENTS.md` §9).
- Una comprobación fallida, interrumpida o sin pruebas seleccionadas no cuenta como superada.
