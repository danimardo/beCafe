# ConfirmDialog

Confirmación de acciones con consecuencias (reparto, hucha negativa). Bits UI AlertDialog.

- Importar: `import { ConfirmDialog } from '#lib';`
- Archivo: `src/lib/components/ui/ConfirmDialog.svelte`
- Demo viva: ruta `/componentes#ConfirmDialog`

## Cuándo usarlo

`tone="danger"` para destructivas. `children` para detalle (importe por persona).

## Props

```ts
type Props = {
	open?: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	/** «danger» para acciones destructivas o con consecuencias económicas. */
	tone?: 'primary' | 'danger';
	onconfirm: () => void;
	/** Contenido extra bajo la descripción (p. ej. el importe por persona de un reparto). */
	children?: Snippet;
};
```

## Accesibilidad

Rol alertdialog; foco inicial en cancelar.
