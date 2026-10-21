# ColorField

Selector de color de la cápsula entre presets (`capsulePresets`) o hex.

- Importar: `import { ColorField } from '#lib';`
- Archivo: `src/lib/components/ui/ColorField.svelte`
- Demo viva: ruta `/componentes#ColorField`

## Cuándo usarlo

`bind:value`. Los presets coinciden con los tokens `cap-*`.

## Props

```ts
type Props = {
	label: string;
	/** Color elegido en hexadecimal (bindable). */
	value?: string;
	presets?: { value: string; name: string }[];
	class?: string;
};
```

## Accesibilidad

Cada color tiene nombre accesible.
