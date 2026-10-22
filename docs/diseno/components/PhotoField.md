# PhotoField

Elegir/hacer una foto con vista previa (RF-005).

- Importar: `import { PhotoField } from '#lib';`
- Archivo: `src/lib/components/ui/PhotoField.svelte`
- Demo viva: ruta `/componentes#PhotoField`

## Cuándo usarlo

La validación real (tipo, 5 MB) es del servidor; esto es un aviso temprano.

## Props

```ts
type Props = {
	label: string;
	/** Archivo elegido (bindable). */
	file?: File | null;
	hint?: string;
	/** RF-005: el servidor valida de verdad (tipo real, 5 MB). Esto es solo un aviso temprano. */
	maxBytes?: number;
	class?: string;
};
```

## Accesibilidad

Botón con etiqueta; `capture` en móvil.
