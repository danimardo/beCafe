# 0001 — SvelteKit 3 como framework

- **Estado:** Aceptado
- **Fecha:** 21-10-2026
- **Requisitos relacionados:** RT-002, HALL-012, DEC-041, FUENTE-09

## Contexto

RT-002 exige SvelteKit y Tailwind CSS. La sección 10.3 de `historias.md` propone SvelteKit 2 con Svelte 5. El paquete de diseño aceptado como base (DEC-044, FUENTE-09) usa SvelteKit 3.1, Svelte 5.57, Tailwind 4.3, Vite 8 y TypeScript 6, y compila sin errores. HALL-012 dejó la versión abierta para la fase de plan.

## Decisión

La aplicación usa **SvelteKit 3 con Svelte 5 en modo runes**, adaptador Node y Tailwind CSS 4. Las versiones exactas se fijan en `package.json` durante el scaffold.

## Alternativas consideradas

- **SvelteKit 2.** Más ejemplos disponibles. Obliga a bajar de versión la plantilla (alias `#lib`, `$app/env`, configuración en `vite.config.ts`) y a volver a validar componentes que ya funcionan.
- **Decidir en el plan de F1.** Deja provisionales las convenciones, el lint y este ADR hasta entonces.

## Consecuencias

- Se reutiliza la plantilla sin cambios de API.
- **Riesgo:** los modelos de lenguaje generan con frecuencia código de SvelteKit 2 o Svelte 4 (`$lib`, `$app/stores`, `$app/environment`, `export let`, `on:click`). `CLAUDE.md` lo prohíbe de forma explícita, el compilador obliga al modo runes y ESLint bloquea los imports antiguos.
- Algunas librerías pueden no declarar todavía compatibilidad con SvelteKit 3. El plan de cada funcionalidad verifica la compatibilidad antes de añadir una dependencia.
- Cierra HALL-012.
