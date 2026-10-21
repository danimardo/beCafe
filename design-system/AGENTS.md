# AGENTS.md — beCafé UI

Punto de entrada para un modelo de IA (o una persona) que vaya a **construir la PWA «beCafé»**: inventario de cápsulas de la cafetera y hucha común del departamento. Este paquete contiene el **sistema de diseño Latte** (claro y oscuro), una **biblioteca de componentes Svelte 5 + Tailwind 4 con código real**, una **plantilla SvelteKit ejecutable** y remite a la **especificación completa**, que está en la raíz del repositorio (`../historias.md`).

## Qué está decidido y qué no

- **Decidido**: estética (Latte, cristal translúcido, claro/oscuro), stack, tokens, componentes, navegación, accesibilidad, idioma (solo español, RT-009).
- **Implementado en la plantilla**: toda la UI con datos de ejemplo (`src/lib/mock.ts`).
- **NO implementado** (sácalo de `../historias.md`): base de datos SQLite, autenticación y sesiones, cálculo de coste medio y repartos, endpoints, cola sin conexión / service worker, notificaciones push, copias de seguridad, subida real de fotos.
- **Propuesto, pendiente de revisión humana**: las pantallas de administración (`/admin/*`), el texto de privacidad (`/privacidad`, Anexo A) y toda ruta marcada «propuesta» en la sección 10.5 de la especificación. Impleméntalas, pero indica en tu resumen que son propuestas.
- **Propuestos en la v0.4.0** (revisar): colocación del aguador del mes y de la tarjeta de agua en Inicio, rellenos visibles y anulables desde `/historial`, tamaño de página del historial (20) y `MovementList`/`Pagination`.
- **Propuestos en la v0.3.0** (revisar): ubicación de la campana y del panel de avisos, hoja de detalle de movimiento, resumen de regularizaciones, mensaje de bloqueo genérico (sin revelar si el correo existe), selector de persona en estadísticas, hoja «Gestionar» de usuarios, páginas de error.
- Si algo no está en este paquete ni en la especificación: **pregunta; no inventes** reglas de negocio.

## Stack

SvelteKit 3 (Svelte 5 con runes, snippets), Tailwind CSS 4 (`@tailwindcss/vite`), TypeScript, Bits UI (Dialog, AlertDialog, RadioGroup, Switch), Lucide (`@lucide/svelte/icons/<nombre>`), fuentes autoalojadas con `@fontsource-variable` (Fraunces para títulos, Inter para texto), `adapter-node` (despliegue en Docker/Coolify, RT-003).

Comandos: `npm install` · `npm run dev` · `npm run check` · `npm run build`. Abre **`/componentes`** para ver todos los componentes en claro y oscuro.

## Mapa del repositorio

| Ruta | Contenido |
| --- | --- |
| `tokens/tokens.json` | **Fuente única de verdad** de color, tipografía, radios, sombras y desenfoque (temas `claro` y `oscuro`). |
| `scripts/generate-tokens.mjs` | Genera `src/tokens.css` a partir del JSON (se ejecuta solo en `dev`/`build`). **No edites `src/tokens.css` a mano.** |
| `src/app.css` | Tailwind, estilos base y utilidades `glass`, `glass-strong`, `wall-blobs`, animaciones. |
| `src/app.html` | Script que fija el tema antes de pintar (sin parpadeo). |
| `src/lib/components/ui` · `capsulas` · `layout` | Componentes. Todos se exportan desde `#lib` (`src/lib/index.ts`). |
| `src/lib/utils.ts` | `cn`, `formatMoney`, `parseMoney`, `formatDate`, `buttonClasses`… |
| `src/lib/theme.svelte.ts` | Preferencia de tema (Automático/Claro/Oscuro). |
| `src/lib/toast.svelte.ts` | `toasts.showUndo(...)` («Deshacer», con `warning` opcional) y `toasts.notify(...)` (aviso sin deshacer). |
| `src/lib/notifications.svelte.ts` | Estado del panel de avisos (RF-107). |
| `src/lib/movements.ts` | Orientación de anulación (`voidPolicy`) y etiquetas de movimientos. Decide el servidor. |
| `src/lib/components/layout/BrandMark.svelte` | Marca «beCafé» (logo + nombre). Úsala siempre en vez de escribir el nombre a mano. |
| `src/lib/mock.ts` | Datos de ejemplo. **Se sustituyen** por los de la base de datos. |
| `src/routes/` | Pantallas de ejemplo (grupos `(app)`, `(auth)`, y `/componentes`). |
| `docs/` | Documentación . |

## Reglas obligatorias

1. **Usa los componentes**, no clases Tailwind sueltas para reproducirlos. Si falta uno, créalo en `src/lib/components/` siguiendo el patrón de los existentes y exporta en `src/lib/index.ts`.
2. **Solo tokens.** Colores como `bg-accent`, `text-ink-muted`, `border-hairline`; nunca hex ni `dark:` con colores propios. El tema oscuro se resuelve solo porque los tokens cambian bajo `[data-theme="oscuro"]`.
3. **Dinero en céntimos enteros** (RN-020). Muéstralo siempre con `<Money>` / `formatMoney` (signo U+2212, formato es-ES). Para entrada, `<MoneyField bind:cents>`.
4. **Todo el texto en español (es-ES)**, tuteo, frases cortas. Sin i18n en v1.
5. **Accesibilidad WCAG 2.2 AA** (RNF-001): objetivos ≥44 px, foco visible, texto ≥4,5:1, el color nunca es la única señal (signo, icono o texto), etiquetas visibles, `prefers-reduced-motion` y `prefers-reduced-transparency` respetados.
6. **Cristal con criterio**: `glass` para tarjetas, `glass-strong` para lo que flota. El texto pequeño nunca va directamente sobre el fondo de color.
7. **Una acción primaria por pantalla** (`<Button variant="primary">`).
8. **Toda lista define** estados vacío, cargando, error y sin conexión (ver `docs/screens-and-flows.md`).
9. **Las acciones de servidor se validan en servidor**; la UI solo avisa pronto (permisos, contraseñas, tamaños, plazos).
10. Svelte 5: `$state`, `$derived`, `$props`, snippets (`{#snippet}` / `{@render}`); no uses `export let`, `$:` ni stores antiguos.
11. Importa con alias `#lib` (`import { Button, Money } from '#lib'`), definidos en `package.json` → `imports`.

## Documentación

- [`docs/design-principles.md`](docs/design-principles.md) — principios visuales, tokens, tipografía, cristal, claro/oscuro.
- [`docs/components/README.md`](docs/components/README.md) — un documento por componente (props, uso, accesibilidad).
- [`docs/screen-layouts.md`](docs/screen-layouts.md) — **distribución de cada pantalla**: zonas numeradas con captura, componentes, datos, comportamiento y medidas (móvil y escritorio).
- [`docs/screens-and-flows.md`](docs/screens-and-flows.md) — pantallas ↔ historias de usuario ↔ rutas ↔ componentes ↔ estados.
- [`docs/pwa-assets.md`](docs/pwa-assets.md) — todos los iconos de la aplicación (web, PWA, iOS, Android, macOS, Windows) y cómo regenerarlos desde el logotipo de marca.
- [`docs/admin-screens.md`](docs/admin-screens.md) — diseño de administración (**propuesto**).
- [`docs/implementation-notes.md`](docs/implementation-notes.md) — tema, fuentes, PWA, sin conexión, despliegue, lo pendiente.
- [`../historias.md`](../historias.md) — especificación completa (fuente de verdad del negocio).

## Orden de trabajo recomendado

1. Ejecuta la plantilla y revisa `/componentes` y las pantallas de ejemplo.
2. Lee en `historias.md` las secciones 5–7 (historias, reglas, requisitos) y 10 (diseño técnico).
3. Implementa datos, autenticación y reglas de negocio por funcionalidad (sección 15 de la especificación), sustituyendo `mock.ts` pantalla a pantalla.
4. Mantén `npm run check` limpio y verifica claro/oscuro, móvil y escritorio en cada pantalla.
