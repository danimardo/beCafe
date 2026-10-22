# SegmentedControl

Selector de 2–4 opciones excluyentes (periodo, tipo de registro). Basado en Bits UI RadioGroup.

- Importar: `import { SegmentedControl } from '#lib';`
- Archivo: `src/lib/components/ui/SegmentedControl.svelte`
- Demo viva: ruta `/componentes#SegmentedControl`

## Cuándo usarlo

`bind:value`. `label` es el nombre accesible del grupo.

## Props

```ts
type Props = {
	/** Valor seleccionado (bindable). */
	value: T;
	options: { value: T; label: string }[];
	/** Nombre accesible del grupo, p. ej. «Periodo». */
	label: string;
	onchange?: (value: T) => void;
	class?: string;
};
```

## Accesibilidad

Navegable con flechas.
