# Sheet

Hoja modal: panel inferior en móvil, diálogo centrado en ≥md. Bits UI Dialog.

- Importar: `import { Sheet } from '#lib';`
- Archivo: `src/lib/components/ui/Sheet.svelte`
- Demo viva: ruta `/componentes#Sheet`

## Cuándo usarlo

Formularios y detalles. `footer` fija las acciones abajo. `bind:open`.

## Props

```ts
type Props = {
	open?: boolean;
	title: string;
	description?: string;
	children: Snippet;
	/** Zona fija inferior con las acciones (botón principal). */
	footer?: Snippet;
};
```

## Accesibilidad

Foco atrapado, Esc cierra, devuelve el foco.
