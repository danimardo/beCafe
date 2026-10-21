# IconButton

Botón solo de icono (editar, borrar, cerrar).

- Importar: `import { IconButton } from '#lib';`
- Archivo: `src/lib/components/ui/IconButton.svelte`
- Demo viva: ruta `/componentes#IconButton`

## Cuándo usarlo

`label` es obligatorio y se usa como `aria-label`. Iconos de Lucide con `aria-hidden`.

## Props

```ts
type Props = Omit<HTMLButtonAttributes, 'aria-label'> & {
	/** Obligatorio: el botón no tiene texto visible. */
	label: string;
	variant?: 'glass' | 'ghost' | 'accent';
	children: Snippet;
};
```

## Accesibilidad

Objetivo ≥44 px.
