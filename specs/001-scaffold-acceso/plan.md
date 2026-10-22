# Implementation Plan: Preparación del proyecto y acceso (F1)

**Branch**: `main` (AGENTS.md §9) | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md) (revisión 3)

**Input**: Feature specification from `specs/001-scaffold-acceso/spec.md`

**Estado**: aprobado por el usuario el 2026-10-21, con los cambios del análisis de coherencia (`/speckit-analyze`) y la revisión 4 de la spec.

## Summary

F1 deja el repositorio listo para trabajar y entrega el acceso a la aplicación.

**Preparación del proyecto:**
- La plantilla Latte pasa a la raíz.
- Se instalan las herramientas de `docs/pruebas.md` y se crean `npm run verify`, la CI y el benchmark.
- Se crean la plataforma de servidor (base de datos, entorno, registro técnico, reloj, errores) y la salud.

**Funcionalidad:**
- primer administrador e invitaciones;
- definición de contraseña e inicio de sesión con bloqueo;
- sesiones de 90 días con cierre global;
- roles con la invariante del último administrador;
- reactivación y reautenticación de administradores;
- auditoría de las acciones de administración;
- texto de privacidad que bloquea el acceso hasta leerlo;
- tema y «Reducir transparencia»;
- exclusión de buscadores.

**Enfoque:**
- Tres módulos de servidor nuevos (`usuarios`, `auth`, `configuracion`) sobre `plataforma`, sin aristas nuevas en el grafo.
- Páginas con *form actions* que funcionan sin JavaScript.
- Una puerta de privacidad en `hooks.server.ts`.
- Las decisiones técnicas están en [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 6 estricto; Node 24 LTS; npm 11.

**Primary Dependencies**:
- SvelteKit 3 con `adapter-node`, Svelte 5 (runes), Vite 8, Tailwind CSS 4 y Bits UI 2.
- Drizzle ORM 0.45 con `better-sqlite3` 13, y Zod 4.
- `@node-rs/argon2` 2, `ulid` 3, `pino` 10 con `pino-roll` y `pino-pretty`, y `loglevel` 1.
- Lista en research R18.

**Storage**:
- SQLite (WAL) en `<DIRECTORIO_DATOS>/becafe.db`.
- Logs en `<DIRECTORIO_DATOS>/logs/`.
- En el navegador, solo las dos preferencias de apariencia en `localStorage`.

**Testing**:
- Vitest 5 con el proyecto `servidor` (unidad e integración con SQLite real, con cobertura) y el proyecto `componentes` (Browser Mode).
- Playwright con los proyectos `chromium-movil`, `webkit-movil`, `chromium-escritorio`, `sin-js` y `api`, y `@axe-core/playwright`.

**Target Platform**:
- Servidor Linux en un contenedor Docker con una sola instancia (RT-010).
- Desarrollo en Linux y en Windows (DEC-056, DEC-101).
- Clientes: Safari iOS ≥ 16.4 y Chrome Android (RNF-013).

**Project Type**: aplicación web full-stack (PWA SvelteKit) en la raíz del repositorio (DEC-055).

**Performance Goals**: F1 no tiene objetivos propios.
- RNF-002 aplica al registro de consumos (F3).
- El coste de Argon2id por verificación se mide al implementarlo (research R6); no se fija antes.

**Constraints**:
- WCAG 2.2 AA en claro y en oscuro.
- Las *actions* funcionan sin JavaScript.
- Sin datos personales en los logs.
- Repositorio público: sin secretos.

**Scale/Scope**:
- Unos 10 usuarios, con capacidad para 30 (RNF-003).
- Pantallas nuevas: `/login`, `/acceso/[token]`, `/aceptar-privacidad`, `/`, `/perfil`, `/privacidad`, `/admin`, `/admin/usuarios` y `/admin/usuarios/[usuarioId]`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento en F1 | Estado |
| --- | --- | --- |
| I. Fuente vigente | Cada comportamiento cita su RF, RN o CA de la spec. Las aclaraciones 7 a 9 las decidió el usuario y están en la spec | Cumple |
| II. Complejidad justificada | Cada pieza nueva responde a un problema (ver «Complexity Tracking»). No se instalan dependencias de otras funcionalidades | Cumple |
| III. Separación y módulos | Reglas en `usuarios`, `auth` y `configuracion`. Rutas finas. Sin aristas nuevas (`auth → usuarios` ya existe). dependency-cruiser y el mapa de `imports` impiden los imports profundos (R2) | Cumple |
| IV. Integridad económica | F1 no registra datos económicos. Las tablas de F1 no tocan dinero. Los parámetros de configuración se guardan en enteros | No aplica / cumple |
| V. Almacenamiento | SQLite con migraciones Drizzle, ULID, UTC. El navegador guarda solo las preferencias de apariencia. La sesión viaja en una cookie `HttpOnly` | Cumple |
| VI. Seguridad y validación | Zod en todas las fronteras. Las entradas de ruta son `strictObject`. `src/env.ts` es el único lugar de declaración. Hashes del identificador de sesión, de los tokens y de las contraseñas. Permisos en el caso de uso | Cumple |
| VII. Tipado estricto | Sin `as`, `any`, `!` ni comentarios que desactiven herramientas. ESLint lo impide. No se excluyen archivos: `src/tokens.css` pasa a `.gitignore` (R1) | Cumple |
| VIII. Pruebas y cobertura | Cada CA y EV del alcance tiene su prueba (matriz de la spec). Umbral del 80 % en `server` + `shared`. F1 no crea `dominio/` | Cumple |
| IX. Verificación | `npm run verify` en serie y la CI desde F1. El benchmark se ejecuta en la puerta | Cumple |
| X. Usabilidad | Una acción primaria por pantalla. Estados definidos (`contracts/rutas.md`). Mensajes en español con la acción posible. Confirmación al cerrar todas las sesiones | Cumple |
| XI. Accesibilidad | axe en claro y oscuro, EV-061 con emulación y revisión con VoiceOver y TalkBack antes de cerrar | Cumple |
| XII. Redacción | Plan, research y contratos en ETS | Cumple |
| XIII. Errores | Códigos cerrados (R12). `handleError` devuelve el `operacionId` | Cumple |
| XIV. Migraciones | Primera migración. Solo añade. El contrato de `/api/registro-cliente` está versionado | Cumple |
| XV. Agentes | Los cambios en `ARCHITECTURE.md` se anotan abajo y se hacen en su lote | Cumple |
| XVI. Registro técnico | `plataforma/registro.ts` y `lib/client/registro.ts`. Catálogo tipado (`contracts/entorno-y-eventos.md`). El enlace de RF-139 va solo a la salida estándar | Cumple |
| XVII. SvelteKit idiomático | `load` en el servidor, *actions* con nombre y sin JavaScript (R9, R16), sin `ssr`/`csr`/`prerender`. `+server.ts` solo para salud y registro del cliente. `/robots.txt` lo responde `handle` en `hooks.server.ts`, sin `+server.ts` (R15) | Cumple |
| XVIII. Identidad visual | Tokens Latte. Formularios sobre una superficie estable (R16). Alternativa opaca con el ajuste y con la preferencia del sistema. Movimiento con `prefers-reduced-motion` | Cumple |

**Resultado:** la puerta se supera. No hay infracciones que justificar. La puerta se volvió a comprobar después del diseño de la fase 1, con el mismo resultado.

## Architecture Check (`ARCHITECTURE.md` §15)

1. **Constitución:** sí (tabla anterior).
2. **Ubicaciones:**
   - Archivos según el §2.
   - Tablas en sus dueños: `usuario` y `registro_auditoria` en `usuarios`; `credencial`, `sesion` y `enlace_acceso` en `auth`; `configuracion` en `configuracion`.
   - `credencial` es nueva respecto a `historias.md` §10.4 (R11).
3. **Grafo:** sin aristas nuevas. `arranque.ts`, `hooks.server.ts` y los comandos empaquetados son raíces de composición.
4. **Reutilización:** se reutilizan los componentes de la plantilla (`Button`, `TextField`, `PasswordField`, `Banner`, `ListRow`, `PageHeader`, `SegmentedControl`, `ThemeToggle`, `ReauthDialog`, `ConfirmDialog`, `CopyField`, `PrivacyText`, `AppShell`, `EmptyState`). Solo se crean `Switch` para la transparencia, si el actual no basta, y los contextos de R3.
5. **Piezas nuevas con su problema:**
   - `credencial`: R11.
   - `plataforma/limitador.ts`: PEND-034, R14.
   - Comandos empaquetados: RF-139b y la siembra, R13.
   - Puerta de privacidad en `hooks.server.ts`: R10.
   - F1 no añade tareas programadas.
6. **Reglas, invariantes y escenarios:** la tabla «Invariantes» de `data-model.md` y la matriz de la spec asignan a cada RN, INV y EV un caso de uso, un mecanismo y una prueba.
7. **Repetición, retraso y fallo a mitad:**
   - Reenviar un formulario de alta da `CORREO_DUPLICADO`.
   - Un enlace ya usado da `ENLACE_NO_VALIDO`.
   - Cada caso de uso es una sola transacción: un fallo a mitad no deja datos parciales.
   - F1 no tiene avisos pendientes.
8. **Fuentes vigentes:**
   - Comportamiento: la spec. Diseño: este plan y `contracts/`.
   - El único contrato JSON nuevo, `/api/registro-cliente` v1, nace versionado.
9. **Autorización:** en los casos de uso (`actor`). Entran en EV-050:
   - las rutas de `(app)`, incluidas `/admin/usuarios` y `/admin/usuarios/[usuarioId]`;
   - `/logout`;
   - `/aceptar-privacidad`;
   - `/api/registro-cliente`.
10. **Afectados:**
    - `ARCHITECTURE.md` (§2, §3, §6, §7, §9 y §14).
    - `docs/pruebas.md`: §23, tareas hechas, y §24, falsos aplazados a F5.
    - `AGENTS.md`: «Estado del repositorio».
    - `docs/diseno/`.
    - F4 reutilizará `usuarios.marcarBaja` y `auth.invalidarSesiones`.
11. **Migraciones:** la primera crea las tablas de F1. No hay datos económicos.
12. **Datos y formularios:** todas las pantallas cargan en `+page.server.ts` y cambian datos con *actions* sin JavaScript. Solo `/api/registro-cliente` usa `fetch` desde el cliente, y no es un formulario.
13. **Eventos:**
    - Los nuevos están en `contracts/entorno-y-eventos.md`.
    - Las pruebas los comprueban con `crearRegistroFalso()`.
    - CA-139 comprueba el fichero de log y la salida estándar.
14. **Pantallas:**
    - Los estados están en `contracts/rutas.md`.
    - Todas entran en la suite `a11y`, en claro y oscuro y con las preferencias de EV-061.
    - La alternativa opaca usa el atributo `data-transparencia` y la preferencia del sistema.

## Project Structure

### Documentation (this feature)

```text
specs/001-scaffold-acceso/
├── spec.md
├── plan.md              # Este archivo
├── research.md          # Decisiones R1–R19
├── data-model.md        # Tablas, transiciones e invariantes
├── quickstart.md        # Validación de principio a fin
├── contracts/
│   ├── rutas.md         # Páginas, actions, matchers y estados
│   ├── api.md           # /api/salud, /api/registro-cliente, /robots.txt, comandos
│   └── entorno-y-eventos.md
├── checklists/requirements.md
└── tasks.md             # Lo crea /speckit-tasks tras aprobar este plan
```

### Source Code (repository root)

```text
/
├─ package.json · package-lock.json · .nvmrc · vite.config.ts · tsconfig.json
├─ eslint.config.js · .prettierrc · .dependency-cruiser.cjs · playwright.config.ts
├─ drizzle.config.ts · drizzle/0000_*.sql
├─ .env.example · .gitignore (añade src/tokens.css, /build-scripts/)
├─ .github/workflows/ci.yml
├─ tokens/tokens.json · static/ (sin robots.txt)
├─ scripts/
│  ├─ generate-tokens.mjs
│  ├─ benchmark.sh · benchmark.ps1 · dev-windows-defender-exclusions.ps1
│  └─ servidor/recuperar-admin.ts · sembrar-e2e.ts       (se empaquetan en build-scripts/)
├─ docs/diseno/                          (antes design-system/docs + reglas de su AGENTS.md)
├─ e2e/
│  ├─ fixtures/ (servidor por worker, errores de navegador, sesiones por rol)
│  ├─ smoke/ · flujos/ · sin-js/ · acceso/ · a11y/ · api/
└─ src/
   ├─ app.html · app.css · app.d.ts · env.ts · hooks.server.ts
   ├─ params/token.ts · params/ulid.ts
   ├─ routes/
   │  ├─ +layout.svelte · +error.svelte
   │  ├─ (auth)/login/ · (auth)/acceso/[token=token]/
   │  ├─ (gate)/aceptar-privacidad/
   │  ├─ (app)/+page.svelte · perfil/ · privacidad/ · admin/ · admin/usuarios/ · admin/usuarios/[usuarioId=ulid]/
   │  ├─ logout/+page.server.ts
   │  └─ api/salud/+server.ts · api/registro-cliente/+server.ts
   └─ lib/
      ├─ ui/ (componentes de la plantilla, contextos de apariencia y avisos, index.ts)
      ├─ client/entorno.ts · registro.ts
      ├─ shared/
      │  ├─ contratos/ (formularios.ts, usuarios.ts, auth.ts, apariencia.ts, registro-cliente.ts)
      │  ├─ fechas/ (incluye formato.ts) · dinero.ts · texto.ts · textos.ts · privacidad.ts · claves-carga.ts
      │  └─ pruebas/ (crearEventoAccion, desenvolverFallo)
      └─ server/
         ├─ arranque.ts
         ├─ plataforma/ (db/, entorno.ts, registro.ts, reloj.ts, ids.ts, errores.ts, limitador.ts, contexto-operacion.ts, pruebas/)
         ├─ configuracion/ (index.ts, esquema.ts, leer.ts)
         ├─ usuarios/ (index.ts, esquema.ts, eventos.ts, alta.ts, roles.ts, reactivar.ts, privacidad.ts, auditoria.ts, consultas.ts,
         │             pruebas/constructores.ts)
         └─ auth/ (index.ts, esquema.ts, eventos.ts, contrasenas.ts, contrasenas-comunes.txt, sesiones.ts, enlaces.ts,
                   iniciar-sesion.ts, cambiar-contrasena.ts, reautenticacion.ts, invitar.ts, admin-inicial.ts, actor.ts)
```

**Structure Decision:** una sola aplicación en la raíz (DEC-055, ADR-0002), con la estructura de `ARCHITECTURE.md` §2. Las pruebas van junto al código (`*.test.ts`) salvo las E2E (`e2e/`).

## Lotes de implementación

Cada lote lleva su nota previa (`docs/pruebas.md` §5). La selección de cierre sigue el §17.1. Los lotes que tocan autenticación o permisos son pequeños.

`tasks.md` reagrupa estos lotes por historia de usuario, en el orden US3 → US2 → US1 → US4 → US5: cada historia necesita lo que entrega la anterior (el primer administrador, el inicio de sesión y la siembra). La siembra de las E2E se crea al final de US2 y no incluye usuarios de baja (research R17).

| Lote | Contenido | CA/EV | Pruebas previstas | Datos y falsos | Cierre | Ampliar si… |
| --- | --- | --- | --- | --- | --- | --- |
| **F1-L0 Traslado** | R1 a R3: `git mv`, `lib/ui`, `#lib/*`, contextos, retirada de las pantallas de otras funcionalidades, `docs/diseno/`, `src/tokens.css` ignorado | — | `npm run check` y `npm run build` | — | `check` + `build` | — |
| **F1-L1 Herramientas** | Dependencias de R18. ESLint, Prettier, dependency-cruiser (grafo del §4), Vitest (dos proyectos con umbrales), Playwright (cinco proyectos y fixtures), scripts del §18, benchmark (`--dry-run`), Defender, CI, `.nvmrc` | — | Una prueba de humo por herramienta, para que ningún filtro quede vacío | — | `npm run verify` | Siempre `verify` (cambia la configuración) |
| **F1-L2 Plataforma** | `env.ts`, `entorno.ts`, `db` (conexión, `enTransaccion` síncrona, migraciones), `registro.ts` (`redact`, dos instancias, fichero diario), contexto de operación, reloj, ULID, `ErrorDeNegocio`, `handleError`, cabeceras, CSP, `/api/salud`, `/robots.txt`, constantes de versión | RNF-016, RNF-014 | Unidad (`fallo`, fechas, esquemas del entorno); integración (migraciones sobre una base vacía, `enTransaccion`, `redact`, `LOG_LEVEL` no válido); `api` (`robots`, cabeceras, salud) | Directorio temporal, registrador falso | `test:changed` + `verify` (cambia `plataforma/` y `hooks`) | — |
| **F1-L3 Usuarios y configuración** | Esquemas `usuario`, `registro_auditoria` y `configuracion`; `cambiarRol` (INV-03), auditoría; lectura de la configuración con valores por defecto | CA-134, EV-040, CA-139c | Integración: último administrador, dos `worker_threads` (EV-040), auditoría sin datos personales, valores por defecto y `dato.invalido` | Constructores de usuario, reloj fijo | `test:changed` + `verify` (esquema y migración) | — |
| **F1-L4 Credenciales y sesiones** | `credencial`, `sesion`; Argon2id, lista de bloqueo, inicio de sesión con bloqueo, renovación cada hora, cierre global, cambio de contraseña, `actor` y reautenticación | CA-132 (contraseña), CA-133, CA-137, CA-138, RN-055 | Integración con reloj fijo: 4, 5 y 6 intentos; 15 min antes, en el límite y después; usuario de baja; sesiones tras el cambio de contraseña; 15 y 16 min de reautenticación. Unidad: normalización y longitud | Reloj fijo, hash de referencia | `test:changed` + `verify` | — |
| **F1-L5 Enlaces, alta y arranque** | `enlace_acceso`; alta con invitación, enlace de recuperación, reactivación (aclaración 8), primer administrador (DEC-104, aclaración 7), comando de RF-139b y siembra | CA-130, CA-131, CA-132 (enlace), CA-136, CA-139, CA-139c | Integración: vigencias de 24 h y 1 h, uso único, anulación, `GET` sin consumir; arranque con y sin variables; fichero frente a salida estándar | Directorio temporal, captura de la salida estándar | `test:changed` + `verify` | — |
| **F1-L6 Pantallas de acceso y privacidad** | `/login`, `/acceso/[token]`, `/aceptar-privacidad`, `/logout`, puerta en los hooks, `/privacidad` | CA-132, CA-133, CA-160, RN-055 | *Actions* con evento falso (incluido `valores` sin contraseñas); E2E de invitación → contraseña → privacidad (`chromium-movil`); `sin-js` de inicio de sesión y contraseña; `acceso` de las rutas nuevas; `a11y` | Siembra E2E, `storageState` por rol | `test:changed`, `test:e2e:quick` de los specs, `sin-js`, `acceso` | Matriz completa si cambia el formulario de acceso |
| **F1-L7 Perfil y administración** | `/`, `/perfil` (contraseña, cierre global, apariencia), `/admin`, `/admin/usuarios`, `/admin/usuarios/[usuarioId]` (reautenticación sin JavaScript) | CA-130, CA-131, CA-134, CA-136, CA-137, CA-138, CA-180, CA-181, EV-050, EV-061 | *Actions* con evento falso; unidad de la lectura de preferencias; E2E de alta y copia del enlace (`chromium-escritorio`); cierre global; `sin-js` del alta; `a11y` con EV-061 | Siembra E2E | Igual que L6 | — |
| **F1-L8 Cierre** | Actualizar `ARCHITECTURE.md`, `docs/pruebas.md` y el «Estado del repositorio» de `AGENTS.md`; medir los archivos de TypeScript; benchmark completo (T-TEST-007); revisión con VoiceOver y TalkBack | Todos | Benchmark en serie | — | Puerta (`docs/pruebas.md` §20.2) | — |

## Cambios en otros documentos

Se hacen en el lote indicado, no ahora.

| Documento | Cambio | Lote |
| --- | --- | --- |
| `ARCHITECTURE.md` | §2: `build-scripts/`, `scripts/servidor/`, `docs/diseno/recursos/`. §3: `credencial` en `auth` y la coordinación de R11. §6: códigos de R12. §7: puerta de privacidad en los hooks (R10) y `/robots.txt` respondido por `handle` (R15). §4 y §12: solo un `*.test.ts` puede importar `src/lib/server/<otro>/pruebas/` (R17). §9: eventos de F1. §14: CSP y límites del registro del cliente resueltos | L2–L8 |
| `docs/pruebas.md` | §23: T-TEST-001 a 006 y 008 hechas. §24: falsos aplazados al plan de F5 | L1, L8 |
| `AGENTS.md` (protegido) | «Estado del repositorio» tras el scaffold; §1.5 `docs/diseno/` | L8 |
| `.github/workflows/ci.yml` (protegido) | Nuevo | L1 |
| `historias.md` | Sin cambios: el comportamiento nuevo está en la spec, que ya es su fuente | — |

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Las APIs de SvelteKit 3 (`defineEnvVars`, `$app/env/private`, `kit.csp`, nonce en `app.html`) se comportan de forma distinta a lo documentado aquí | Se verifican en L0 y L2 contra el paquete instalado, antes de escribir el código que depende de ellas. Si cambian, se ajusta el diseño y se avisa |
| Patrones de `imports` con `.ts` no admitidos por alguna herramienta (R2) | Prueba en L0. Alternativa: mapas explícitos por módulo |
| WebKit en Linux no acepta cookies `Secure` en `localhost` | `Secure` según `ORIGIN` (aclaración 10, R5). El esquema de `ORIGIN` solo admite http con `localhost` o `127.0.0.1`, así que en producción la cookie siempre lleva `Secure` |
| El número de archivos de TypeScript se dispara con `@lucide/svelte` | Se importan los iconos por ruta (`AGENTS.md` §6) y se mide en L1 (`docs/pruebas.md` §17.3) |
| `X-Robots-Tag` ausente en los recursos estáticos (R15) | **Decidido (opción A):** se acepta el límite en F1. El plan de F7 añade la cabecera en el proxy de Coolify. `/robots.txt` ya pide no indexar nada |

## Complexity Tracking

No hay infracciones de la constitución. Estas piezas nuevas tienen su justificación en `research.md`:

| Pieza | Problema concreto | Alternativa más simple descartada porque… |
| --- | --- | --- |
| Tabla `credencial` (R11) | `auth` escribiría en la tabla de `usuarios` en cada inicio de sesión | Columnas en `usuario`: rompe la regla de no escribir en tablas ajenas |
| `plataforma/limitador.ts` (R14) | PEND-034: un cliente con un error en bucle inundaría el log | Sin límite: el log de 30 días se llena de ruido |
| Comandos empaquetados con Vite (R13, R17) | RF-139b y la siembra necesitan la lógica de los módulos fuera de SvelteKit | `tsx`: dependencia nueva. Endpoint: superficie expuesta a internet |
| Puerta de privacidad en los hooks (R10) | Las *actions* no pasan por los `load` del layout | Puerta en el layout: deja las *actions* abiertas |
