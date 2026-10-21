# 0002 — Aplicación única en la raíz con módulos de servidor y API pública

- **Estado:** Propuesto (se acepta al autorizar la escritura)
- **Fecha:** 21-10-2026
- **Requisitos relacionados:** RT-010, DEC-041 (sección 10.6 de `historias.md`), DEC-044

## Contexto

El repositorio contiene la especificación (`historias.md`), SpecKit en la raíz y una plantilla de interfaz en `design-system/` con componentes, pantallas de ejemplo y datos simulados. La aplicación tiene unos 10 usuarios, un servidor y una instancia. Trabaja una persona con agentes de IA en serie. El riesgo principal a largo plazo es que los agentes acoplen módulos poco a poco: reglas económicas en rutas, consultas a tablas ajenas, ciclos de importación.

## Decisión

1. La aplicación vive en la **raíz del repositorio**, con un solo `package.json`. El scaffold mueve la plantilla de `design-system/` a la raíz con `git mv`. Los componentes pasan a `src/lib/ui/` y la documentación de diseño a `docs/diseno/`.
2. El código de servidor se organiza en **módulos por capacidad** (`src/lib/server/<modulo>/`) con un único punto de entrada público (`index.ts`), tablas propias (`esquema.ts`) y un grafo de dependencias sin ciclos, descrito en el §4 de `ARCHITECTURE.md`.
3. `economia` es el módulo núcleo y aísla sus cálculos en funciones puras (`dominio/`). Los demás módulos usan operaciones directas.
4. No se usan capas de repositorio, CQRS, *event sourcing* ni mensajería (sección 10.2 de `historias.md`). Drizzle ya da consultas tipadas; un repositorio solo duplicaría su API.
5. dependency-cruiser comprueba el grafo y los imports en cada `npm run verify`.

## Alternativas consideradas

- **Aplicación dentro de `design-system/`.** Menos movimientos, pero todos los comandos, la CI y SpecKit trabajarían con una subcarpeta.
- **Monorepo con workspaces** (`packages/ui` + `apps/web`). Separa la interfaz de forma estricta, pero exige empaquetar la librería, mantener sus exports y encadenar builds sin un segundo consumidor que lo justifique.
- **Organización por tipo técnico** (`services/`, `repositories/`, `models/`). Cada cambio tocaría todas las carpetas y no hay límite que impida acoplar capacidades.

## Consecuencias

- Un agente localiza el dueño de una regla en una tabla y sabe qué puede importar.
- El scaffold produce un diff grande de movimientos; se hace en un commit separado, sin cambios de contenido.
- `design-system/AGENTS.md` deja de existir en el scaffold: sus reglas visuales pasan a `docs/diseno/` y las operativas, a `CLAUDE.md`.
- Las migraciones de Drizzle se generan en un único directorio (`drizzle/`), un punto de contención aceptable con agentes en serie.
- Si otra aplicación necesita la interfaz, se extrae `src/lib/ui` a un paquete con un ADR nuevo.
