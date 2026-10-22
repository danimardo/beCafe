# Sistema de diseño Latte

Referencia visual de beCafé: principios, componentes, distribución de pantallas y reglas de interfaz. Se traslada desde `design-system/` en F1 (`docs/adr` y `specs/001-scaffold-acceso/research.md` R1).

## Recuperar las pantallas de ejemplo

La plantilla con datos de ejemplo se retiró de `src/` en el traslado. Sigue en el historial de Git, en el commit `312ef0af9a9c89a94becb5eaddb208a9af24678a`:

```bash
git show 312ef0af9a9c89a94becb5eaddb208a9af24678a:design-system/src/routes/<ruta>/+page.svelte
```

Cada funcionalidad recupera sus pantallas cuando las implementa.

## Reglas obligatorias

1. **Usa los componentes**, no clases Tailwind sueltas para reproducirlos. Si falta uno, créalo en `src/lib/ui/` siguiendo el patrón de los existentes y exporta en `src/lib/ui/index.ts`.
2. **Solo tokens.** Colores como `bg-accent`, `text-ink-muted`, `border-hairline`; nunca hex ni `dark:` con colores propios. El tema oscuro se resuelve porque los tokens cambian bajo `[data-theme="oscuro"]`.
3. **Dinero en céntimos enteros** (RN-020). Muéstralo con `<Money>` o `formatMoney` (signo U+2212, formato es-ES). Para entrada, `<MoneyField bind:cents>`.
4. **Todo el texto en español (es-ES)**, tuteo, frases cortas. Sin i18n en v1.
5. **Accesibilidad WCAG 2.2 AA** (RNF-001): objetivos ≥ 44 px, foco visible, texto ≥ 4,5:1, el color nunca es la única señal, etiquetas visibles, `prefers-reduced-motion` y `prefers-reduced-transparency` respetados.
6. **Cristal con criterio**: `glass` para tarjetas, `glass-strong` para lo que flota. El texto pequeño nunca va directamente sobre el fondo de color.
7. **Una acción primaria por pantalla** (`<Button variant="primary">`).
8. **Toda lista define** sus estados vacío, cargando, error y sin conexión (ver [`screens-and-flows.md`](screens-and-flows.md)).
9. **Las acciones de servidor se validan en servidor**; la interfaz solo avisa pronto (permisos, contraseñas, tamaños, plazos).
10. Svelte 5: `$state`, `$derived`, `$props`, snippets (`{#snippet}` / `{@render}`). No uses `export let`, `$:` ni stores antiguos.
11. Importa con los alias `#lib/...` definidos en `package.json` → `imports`.

## Mapa

| Ruta | Contenido |
| --- | --- |
| `tokens/tokens.json` | Fuente única de color, tipografía, radios, sombras y desenfoque (temas `claro` y `oscuro`). |
| `scripts/generate-tokens.mjs` | Genera `src/tokens.css` (`npm run tokens`). No edites `src/tokens.css` a mano. |
| `src/app.css` | Tailwind, estilos base y utilidades `glass`, `glass-strong`, `wall-blobs` y animaciones. |
| `src/app.html` | Script que fija el tema antes de pintar. |
| `src/lib/ui/` | Componentes, exportados desde `src/lib/ui/index.ts`. |
| `docs/diseno/recursos/design/` | Fuentes de marca y de iconos. No forman parte del flujo npm. |
| `docs/diseno/recursos/generate-pwa-assets.py` | Regenera los iconos desde el logotipo de marca. |

## Documentación

- [`design-principles.md`](design-principles.md): principios visuales, tokens, tipografía, cristal, claro y oscuro.
- [`components/README.md`](components/README.md): un documento por componente (props, uso, accesibilidad).
- [`screen-layouts.md`](screen-layouts.md): distribución de cada pantalla, en móvil y escritorio.
- [`screens-and-flows.md`](screens-and-flows.md): pantallas, historias de usuario, rutas, componentes y estados.
- [`pwa-assets.md`](pwa-assets.md): iconos de la aplicación (web, PWA, iOS, Android, macOS, Windows).
- [`admin-screens.md`](admin-screens.md): diseño de administración (**propuesto**).
- [`implementation-notes.md`](implementation-notes.md): tema, fuentes, PWA, sin conexión, despliegue y lo pendiente.
- [`../../historias.md`](../../historias.md): especificación completa.
