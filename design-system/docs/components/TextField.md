# TextField

Campo de texto (o área de texto con `rows`) con etiqueta visible, ayuda y error.

- Importar: `import { TextField } from '#lib';`
- Archivo: `src/lib/components/ui/TextField.svelte`
- Demo viva: ruta `/componentes#TextField`

## Cuándo usarlo

Hereda atributos de `<input>`. `error` marca `aria-invalid` y enlaza el mensaje.

## Props

```ts
type Props = Omit<HTMLInputAttributes, 'value' | 'class'> & {
	label: string;
	value?: string;
	/** Ayuda bajo el campo. */
	hint?: string;
	/** Mensaje de error; marca el campo como inválido. */
	error?: string;
	/** Si se indica, el campo es un área de texto de esas filas (p. ej. motivo de anulación). */
	rows?: number;
	class?: string;
};
```

## Accesibilidad

Etiqueta siempre visible; borde ≥3:1.
