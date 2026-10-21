# CLAUDE.md — beCafé

PWA SvelteKit 3 para el stock de cápsulas y la hucha común de un departamento. Interfaz y documentación en español.

## Estado del repositorio

- **Antes del scaffold:** la plantilla de interfaz está en `design-system/`. No hay `package.json` en la raíz. Los comandos de verificación de la sección «Comandos» todavía no existen.
- **El scaffold** es la fase de preparación de la funcionalidad F1: mueve la plantilla a la raíz, instala las herramientas y crea `npm run verify`. Al terminarlo, actualiza este archivo.

## 1. Qué leer antes de una tarea

1. `.specify/memory/constitution.md`: principios no negociables.
2. `ARCHITECTURE.md`: dónde va cada archivo (§2), módulos (§3) y dependencias permitidas (§4).
3. `specs/NNN-<funcionalidad>/spec.md`, `plan.md` y `tasks.md` de la funcionalidad de la tarea.
4. Si la regla aún no está traspasada a una `spec.md`, `historias.md`. Cita siempre su ID (RN, RF, CA, INV, EV, DEC).
5. Para interfaz: `docs/diseno/` (antes del scaffold, `design-system/AGENTS.md`, apartado «Reglas obligatorias», y `design-system/docs/`).

Si una regla de negocio no está en ninguna de estas fuentes, pregunta. No la inventes.

## 2. Cómo localizar el código

- Busca la funcionalidad en `specs/`. Su `plan.md` indica qué módulos toca.
- Busca el módulo dueño de la regla en la tabla del §3 de `ARCHITECTURE.md`.
- Importa un módulo solo desde su `index.ts` (`#lib/server/<modulo>`).

## 3. Límites que no cruzas

- No importes `esquema.ts` ni archivos internos de otro módulo.
- No escribas SQL ni importes `drizzle-orm` en `src/routes`.
- No importes `lib/server` desde `lib/ui`, `lib/client` ni `lib/shared`.
- No leas `process.env` ni `$env/*` fuera de `plataforma/entorno.ts`.
- No escribas en tablas de otro módulo. Llama a su función pública con la transacción `tx`.
- No modifiques ni borres consumos, aportaciones, compras, arqueos, recuentos ni movimientos. Se anulan.
- No edites `.specify/memory/constitution.md` a mano. Usa `/speckit-constitution`.
- Si una tarea exige cruzar un límite, detente y propón: cambiar el diseño, o un ADR en `docs/adr/`.

## 4. Prohibido (código antiguo que un modelo tiende a generar)

| No uses | Usa |
| --- | --- |
| `$lib/...` | `#lib/...` |
| `$app/stores`, `svelte/store` | `$app/state`, runes |
| `$app/environment` | `$app/env` |
| `export let`, `$:`, `<slot>` | `$props()`, `$derived`, snippets |
| `on:click`, `createEventDispatcher` | `onclick`, props de función |
| `import { X } from '@lucide/svelte'` | `import X from '@lucide/svelte/icons/<nombre>'` |
| `href="/ruta"` o `goto('/ruta')` con texto | `resolve('/ruta')` |
| `as Tipo`, `any`, `!`, `@ts-ignore`, `@ts-expect-error` | Estrechadores, validación con esquema, tipos derivados |
| `// eslint-disable` o excluir un archivo de una herramienta | Corregir el código |
| `z.string().email()`, `{ message: '…' }` (Zod 3) | `z.email()`, `{ error: '…' }` (Zod 4) |
| Importar `pino`, `web-push`, `aws4fetch`, `sharp`, `croner` o `@node-rs/argon2` fuera de su archivo | La función de su único archivo (`ARCHITECTURE.md` §11) |
| Importes con decimales (`0.35`) | Enteros en céntimos (`35`) |
| `new Date()` o `Math.random()` dentro de `dominio/` | Reloj y azar recibidos como parámetro |
| `await` dentro de `enTransaccion` | Hacer la E/S asíncrona fuera de la transacción |
| Colores hexadecimales o `dark:` propios | Clases con tokens y componentes de `lib/ui` |
| Colecciones mutables a nivel de módulo en servidor | Datos por petición; `Object.freeze` para constantes |

## 5. Pruebas que creas

- Regla pura de `dominio/` → prueba unitaria; si hay dinero o secuencias, prueba de propiedades con `fast-check`.
- Caso de uso que escribe → prueba de integración con SQLite real y migraciones.
- Cada CA o EV del alcance de la tarea → al menos una prueba que lo nombre en su descripción (`it('CA-041: …')`).
- Ruta nueva con permisos → añádela a la prueba de acceso directo por URL (EV-050).
- Pantalla nueva → comprobación axe en su prueba E2E.

## 6. Comandos

Usa solo scripts npm: funcionan igual en Windows y en Linux.

| Momento | Comando |
| --- | --- |
| Mientras editas | `npm run lint:changed` y `npm run check` |
| Antes de declarar terminada una tarea | `npm run verify` |
| Antes de cerrar una funcionalidad o un PR | `npm run verify` y `npm run test:e2e` |

No ejecutes lint y pruebas a la vez: compiten por CPU y falsean los tiempos.

## 7. Cuándo una tarea está terminada

Una tarea está terminada cuando se cumplen todas estas condiciones:

1. `npm run verify` termina sin errores (formato, lint, tipos, arquitectura, pruebas unitarias y de integración, build).
2. Cada CA o EV del alcance tiene su prueba y la prueba pasa.
3. `tasks.md` marca la tarea como hecha.
4. Si cambiaste un módulo, una arista o una ubicación, `ARCHITECTURE.md` lo refleja en el mismo cambio.
5. `git status` no muestra archivos sospechosos (`.env`, `*.db`, claves, informes generados).
6. Informas de lo que no se pudo verificar y del motivo.

## 8. Git

- Trabaja en `main`. Si un comando de SpecKit crea una rama de funcionalidad, intégrala en `main` al cerrar la funcionalidad.
- Haz commit o push solo cuando te lo pidan.
