# Glass

Superficie de cristal translúcido. Base de toda tarjeta, panel o tile.

- Importar: `import { Glass } from '#lib';`
- Archivo: `src/lib/components/ui/Glass.svelte`
- Demo viva: ruta `/componentes#Glass`

## Cuándo usarlo

Úsalo en lugar de repetir `glass` + radios a mano. `strong` solo para lo que flota sobre otro contenido (nav, toasts, hojas). El texto pequeño va siempre sobre cristal, nunca sobre el fondo.

## Props

```ts
type Props = HTMLAttributes<HTMLElement> & {
	/** Etiqueta HTML a renderizar. */
	as?: keyof HTMLElementTagNameMap;
	/** Cristal más opaco, para lo que flota encima de otro contenido. */
	strong?: boolean;
	radius?: 'chip' | 'tile' | 'panel' | 'sheet' | 'full';
	/** Relleno interior de 16 px. Desactívalo si el contenido gestiona su propio relleno. */
	padded?: boolean;
	children?: Snippet;
};
```

## Accesibilidad

Con `prefers-reduced-transparency` pasa a color sólido automáticamente.
