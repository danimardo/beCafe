# SplitBar

Barra proporcional segmentada (cápsulas favoritas).

- Importar: `import { SplitBar } from '#lib';`
- Archivo: `src/lib/components/capsulas/SplitBar.svelte`
- Demo viva: ruta `/componentes#SplitBar`

## Cuándo usarlo

Leyenda con porcentajes en texto.

## Props

```ts
type Props = {
	segments: { label: string; value: number; color: string }[];
	/** Nombre accesible, p. ej. «Tus cápsulas favoritas». */
	title: string;
};
```

## Accesibilidad

No solo color.
