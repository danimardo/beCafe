# Pagination

Navegación entre páginas de una lista: «Página N de M» con «Anterior» y «Siguiente».

- Importar: `import { Pagination } from '#lib';`
- Archivo: `src/lib/components/ui/Pagination.svelte`
- Demo viva: ruta `/componentes#Pagination`

## Cuándo usarlo

`bind:page`. No se pinta con una sola página. El tamaño de página lo decide el servidor (propuesto: 20).

## Props

```ts
type Props = {
	/** Página actual, empezando en 1. */
	page?: number;
	/** Número total de páginas. Con 1 o menos no se pinta nada. */
	pages: number;
	/** Nombre accesible de la navegación (p. ej. «Páginas del historial»). */
	label?: string;
	onchange?: (page: number) => void;
};
```

## Accesibilidad

`nav` con nombre (`label`), contador anunciado (`aria-live`), botones ≥44 px.
