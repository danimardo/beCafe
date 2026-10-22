# BarChart

Gráfico de barras simple en SVG/HTML sin librería.

- Importar: `import { BarChart } from '#lib';`
- Archivo: `src/lib/components/capsulas/BarChart.svelte`
- Demo viva: ruta `/componentes#BarChart`

## Cuándo usarlo

`title` como nombre accesible; resaltar última barra.

## Props

```ts
type Props = {
	data: { label: string; value: number }[];
	/** Qué mide, p. ej. «Cafés por semana». Se usa como nombre accesible. */
	title: string;
	/** Resalta la última barra (el periodo actual). */
	highlightLast?: boolean;
	unit?: string;
	class?: string;
};
```

## Accesibilidad

Valores en texto accesible.
