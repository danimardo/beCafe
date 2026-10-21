# SelectField

Selector nativo con etiqueta, ayuda y error.

- Importar: `import { SelectField } from '#lib';`
- Archivo: `src/lib/components/ui/SelectField.svelte`
- Demo viva: ruta `/componentes#SelectField`

## Cuándo usarlo

Se usa el `<select>` nativo por fiabilidad en móvil y accesibilidad.

## Props

```ts
type Props = {
	label: string;
	value?: string;
	options: { value: string; label: string }[];
	hint?: string;
	error?: string;
	class?: string;
};
```

## Accesibilidad

Nativo.
