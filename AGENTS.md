# AGENTS.md — beCafé

PWA SvelteKit 3 para el stock de cápsulas y la hucha común de un departamento. Interfaz y documentación en español.

Estas son las reglas comunes del proyecto. El único agente en uso es Claude Code CLI, que las carga desde `CLAUDE.md`. Sus controles y límites están en `docs/agentes.md`.

## Estado del repositorio

- **Antes del scaffold:** la plantilla de interfaz está en `design-system/`. No hay `package.json` en la raíz. Los comandos de verificación de §7 todavía no existen; los propone `docs/pruebas.md` §18.
- **El scaffold** es la fase de preparación de la funcionalidad F1: mueve la plantilla a la raíz, instala las herramientas y crea `npm run verify`. Al terminarlo, actualiza este archivo.

## 1. Fuentes vigentes

Lee en este orden antes de una tarea:

1. `.specify/memory/constitution.md`: principios no negociables. Ningún plan ni instrucción la anula.
2. `ARCHITECTURE.md`: dónde va cada archivo (§2), módulos (§3) y dependencias permitidas (§4).
3. `specs/NNN-<funcionalidad>/spec.md`, `plan.md` y `tasks.md` de la funcionalidad de la tarea.
4. Si la regla aún no está traspasada a una `spec.md`, `historias.md`. Cita siempre su ID (RN, RF, CA, INV, EV, DEC).
5. Para interfaz: `docs/diseno/` (antes del scaffold, `design-system/AGENTS.md`, apartado «Reglas obligatorias», y `design-system/docs/`).

- Tras el traspaso, la `spec.md` es la fuente del comportamiento y el `plan.md` la del diseño. `historias.md` conserva la visión global y las decisiones transversales.
- Conserva los IDs al traspasar. No inventes IDs de pruebas futuras.
- Si una regla de negocio no está en ninguna fuente, pregunta. No la inventes. Las decisiones de negocio son del usuario.

## 2. Fases y aprobaciones

| Operación | Condición para avanzar |
| --- | --- |
| Redactar una especificación | Puedes prepararla como propuesta. Redactarla no la aprueba. |
| Diseñar (`plan.md`) | El usuario aprueba la `spec.md` concreta en la sesión actual. |
| Generar tareas e implementar | El usuario aprueba el `plan.md` concreto en la sesión actual. Las tareas que respetan ese alcance no necesitan otra aprobación. |
| Corregir o mantener | Puedes avanzar si restableces el comportamiento aprobado o no cambias comportamiento, diseño aprobado ni constitución. Justifica la clasificación por impacto, no por tamaño. |
| Cambiar requisitos o diseño aprobado | Presenta el cambio, su impacto y los documentos afectados. Renueva las aprobaciones afectadas antes de seguir. |
| Cambiar `historias.md` | Pide autorización para cada cambio. Registra un CAMBIO-NNN y guarda antes un respaldo en `.respaldos/`. |
| Enmendar la constitución | Presenta diferencias, motivo e impacto. Aplica solo la enmienda aprobada, con `/speckit-constitution`. Nunca la edites a mano. |
| Cambiar instrucciones, permisos, hooks o validadores (§3) | Presenta diferencias e impacto sobre las protecciones. Espera la aprobación de esa propuesta concreta. |
| Commit, push, ramas, etiquetas o PR | Solo cuando el usuario lo pida en la sesión actual. |

- Una aprobación vale para la sesión, el CLI y el contenido revisados. No la traslades a otra sesión ni a otro CLI.
- Un resumen de una conversación anterior no reconstruye una aprobación. Pídela de nuevo.
- Una confirmación nativa del CLI aprueba solo la operación que muestra.
- No te apruebes a ti mismo: no ejecutes comandos de aprobación ni elijas «permitir siempre» por el usuario.
- Si una petición contradice la constitución, explica el conflicto y ofrece una alternativa compatible o una enmienda previa.
- Si un control obligatorio falla, está ausente o no responde, la operación protegida queda bloqueada. Explica cómo restablecerlo. No busques otra vía.

## 3. Archivos protegidos

Cambiarlos exige la aprobación de §2. No los modifiques por ninguna vía (edición, shell, scripts, subagentes):

- `.specify/memory/constitution.md`
- `AGENTS.md`, `CLAUDE.md`, `docs/agentes.md`
- Configuración del agente: `.claude/settings*.json`
- `.specify/` excepto `feature.json`
- `.github/workflows/`

## 4. Cómo localizar el código

- Busca la funcionalidad en `specs/`. Su `plan.md` indica qué módulos toca.
- Busca el módulo dueño de la regla en la tabla del §3 de `ARCHITECTURE.md`.
- Importa un módulo solo desde su `index.ts` (`#lib/server/<modulo>`).

## 5. Límites que no cruzas

- No importes `esquema.ts` ni archivos internos de otro módulo.
- No escribas SQL ni importes `drizzle-orm` en `src/routes`.
- No importes `lib/server` desde `lib/ui`, `lib/client` ni `lib/shared`.
- No importes `$app/env/private` fuera de `plataforma/entorno.ts`, ni `$app/env/public` fuera de `lib/client/entorno.ts`. No leas `process.env` en `src/`. Una variable nueva se declara en `src/env.ts` con su esquema (`ARCHITECTURE.md` §8).
- No uses una entrada externa sin validarla con su esquema de `lib/shared/contratos/` (`ARCHITECTURE.md` §6.1).
- No escribas en tablas de otro módulo. Llama a su función pública con la transacción `tx`.
- No modifiques ni borres consumos, aportaciones, compras, arqueos, recuentos ni movimientos. Se anulan.
- No pongas secretos ni datos personales en el repositorio, en los logs ni en los informes. El repositorio es público.
- Si una tarea exige cruzar un límite, detente y propón: cambiar el diseño, o un ADR en `docs/adr/`.

## 6. Prohibido (código antiguo que un modelo tiende a generar)

| No uses | Usa |
| --- | --- |
| `$lib/...` | `#lib/...` |
| `$app/stores`, `svelte/store` | `$app/state`, runes |
| `$app/environment` | `$app/env` |
| `$env/static/*`, `$env/dynamic/*` | `src/env.ts` + `plataforma/entorno.ts` |
| `experimental.remoteFunctions`, `form`/`command`/`query` de `$app/server` | *Form actions* y `+server.ts` |
| `+page.ts` / `+layout.ts` que leen datos, `fetch` en `onMount` o en un componente | `load` en `+page.server.ts` y la prop `data` (`ARCHITECTURE.md` §7) |
| Enviar un formulario con `fetch` o con un `+server.ts` | `<form method="post">` + *action* con nombre + `use:enhance`; debe funcionar sin JavaScript |
| Comprobar el permiso solo en `+layout.server.ts` | El caso de uso que llama cada `load`, *action* y `+server.ts` |
| `fail(400, { email, contrasena, … })` con secretos | `fallo(estado, errorZod, datos)` de `lib/shared/contratos/formularios` |
| `let` o `new Map()` a nivel de módulo en servidor; `$state` exportado desde un `.svelte.ts` | `event.locals`, parámetros; props o contexto |
| `$effect` que calcula o copia estado | `$derived` |
| `invalidateAll()`, `json()`, `text()`, `error(estado, { message })`, `export const snapshot` (obsoletos en SvelteKit 3) | `refreshAll()` o `invalidate(CLAVE)` con `depends`, `Response.json()`, `new Response()`, `error(estado, mensaje)`, `snapshot` de `$app/navigation` |
| `export const ssr = false`, `csr = false` o `prerender` sin justificar | SSR y CSR activos (`ARCHITECTURE.md` §7) |
| `z.object` en la entrada de una página o un endpoint | `z.strictObject` (en el `load` de un layout, `z.object({})`) |
| `Date` en contratos o en `dominio/` | `InstanteUtc`, `FechaMadrid`, `Mes` de `lib/shared/fechas` |
| `z.coerce.number()` solo | `z.coerce.number().int().positive()` o con `min` |
| `export let`, `$:`, `<slot>` | `$props()`, `$derived`, snippets |
| `on:click`, `createEventDispatcher` | `onclick`, props de función |
| `import { X } from '@lucide/svelte'` | `import X from '@lucide/svelte/icons/<nombre>'` |
| `href="/ruta"` o `goto('/ruta')` con texto | `resolve('/ruta')` |
| `as Tipo`, `any`, `!`, `@ts-ignore`, `@ts-expect-error` | Estrechadores, validación con esquema, tipos derivados |
| `// eslint-disable` o excluir un archivo de una herramienta | Corregir el código |
| `z.string().email()`, `{ message: '…' }` (Zod 3) | `z.email()`, `{ error: '…' }` (Zod 4) |
| Importar `pino`, `pino-roll`, `pino-pretty`, `loglevel`, `web-push`, `aws4fetch`, `sharp`, `croner` o `@node-rs/argon2` fuera de su archivo | La función de su único archivo (`ARCHITECTURE.md` §11) |
| `console.*`, o un evento con nombres, correos, importes, tokens o el valor recibido | `registrar(codigo, campos)` con un código del catálogo del módulo (`ARCHITECTURE.md` §9) |
| `log.setLevel(nivel)` de `loglevel` (lo guarda en `localStorage`) | `log.setLevel(nivel, false)` o `setDefaultLevel` |
| Importes con decimales (`0.35`) | Enteros en céntimos (`35`) |
| `new Date()` o `Math.random()` dentro de `dominio/` | Reloj y azar recibidos como parámetro |
| `await` dentro de `enTransaccion` | Hacer la E/S asíncrona fuera de la transacción |
| Colores hexadecimales o `dark:` propios | Clases con tokens y componentes de `lib/ui` |
| Cristal (`glass`, `Glass`) dentro de otro cristal, o bajo un formulario o una tabla densa | Una sola capa de cristal; superficie estable para formularios y contenido denso (constitución XVIII) |
| Guardar el tema o «Reducir transparencia» en el servidor o en la cuenta | `localStorage` del dispositivo, leído con su esquema (`ARCHITECTURE.md` §7) |
| Colecciones mutables a nivel de módulo en servidor | Datos por petición; `Object.freeze` para constantes |

## 7. Pruebas y verificación

La estrategia completa está en `docs/pruebas.md`. Léela antes de escribir pruebas o de elegir qué ejecutar.

- Regla pura de `dominio/` → prueba unitaria; si hay dinero o secuencias, prueba de propiedades con `fast-check`.
- Caso de uso que escribe → prueba de integración con SQLite real y migraciones; concurrencia con `worker_threads` (`docs/pruebas.md` §7).
- *Action* o `+server.ts` → prueba con un evento falso (`crearEventoAccion`). `fail` se devuelve; `error` y `redirect` se lanzan (`docs/pruebas.md` §8). No pruebes el `load` exportado.
- Componente de `lib/ui` con estado o interacción propia → prueba de componente en Vitest Browser Mode. El resto lo cubre el E2E.
- Cada CA o EV del alcance → al menos una prueba que lo nombre en su descripción (`it('CA-041: …')`), en el nivel más barato que lo demuestra (`docs/pruebas.md` §14).
- Ruta nueva → entra en la suite `acceso` (EV-050). Pantalla nueva → axe en claro y oscuro. Formulario crítico → proyecto `sin-js`.
- Escribe la prueba antes o justo después del código si toca dinero, permisos, invariantes, idempotencia, concurrencia, la cola sin conexión o un error corregido.
- No uses `waitForTimeout`, `sleep`, selectores por clase CSS ni `as` en las pruebas. No subas timeouts ni reintentos para ocultar un fallo.

Usa solo scripts npm: funcionan igual en Windows y en Linux. La lista completa está en `docs/pruebas.md` §18.

| Momento | Qué ejecutar |
| --- | --- |
| Mientras editas | La prueba concreta (`npx vitest run <archivo>`) y `npm run check` |
| Al cerrar una tarea o un lote | Lo afectado: `npm run test:changed`, `npm run lint:changed`, `npm run check` y, si toca la interfaz, `npm run test:e2e:quick -- <spec>`. Ejecuta `npm run verify` si cambias un contrato público, un esquema, una migración, `hooks.server.ts`, `plataforma/` o la configuración de una herramienta (`docs/pruebas.md` §17) |
| Al cerrar una funcionalidad | `scripts/benchmark.sh` o `scripts/benchmark.ps1` completo: verificación completa en serie y E2E de todos los proyectos |

- Cerrar una tarea no activa por sí solo la verificación completa. Selecciona lo afectado por el cambio y su riesgo.
- Antes de ejecutar, comprueba que el filtro selecciona al menos una prueba y consulta `.local/verification/runs.jsonl` para reutilizar evidencia válida. Anota cada ejecución selectiva en ese archivo (`docs/pruebas.md` §17).
- No ejecutes lint y pruebas a la vez: compiten por CPU y falsean los tiempos.
- Una advertencia de `svelte-check`, ESLint o el compilador rompe la verificación igual que un error. Corrígela; no la silencies.
- Una ejecución lenta inicia una investigación, no una cancelación. Interrumpe solo tus propios procesos, y solo con indicios de bloqueo. Nunca mates procesos ajenos.

## 8. Cuándo una tarea está terminada

1. Las comprobaciones afectadas por el cambio (§7) pasan, con al menos una prueba seleccionada y sin advertencias.
2. Cada CA o EV del alcance tiene su prueba y la prueba pasa.
3. `tasks.md` marca la tarea como hecha.
4. Si cambiaste un módulo, una arista o una ubicación, `ARCHITECTURE.md` lo refleja en el mismo cambio.
5. `git status` no muestra archivos sospechosos (`.env`, `*.db`, claves, informes generados, `.local/`).
6. Informas de lo que ejecutaste, lo que reutilizaste y por qué, lo que no se pudo verificar y su motivo.

Una funcionalidad está terminada cuando, además, el benchmark completo pasa en serie y se cumple la Definition of Done de `docs/pruebas.md` §20.2. Una comprobación fallida, interrumpida o sin pruebas seleccionadas nunca cuenta como superada.

## 9. Git

- Trabaja en `main`. Si un comando de Spec Kit crea una rama de funcionalidad, intégrala en `main` al cerrar la funcionalidad.
- Haz commit o push solo cuando te lo pidan.
- Nunca limpies ni reviertas cambios ajenos sin confirmar.
