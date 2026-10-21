# ListRow

Fila genérica: leading + título/subtítulo + trailing. Enlace, botón o estática.

- Importar: `import { ListRow } from '#lib';`
- Archivo: `src/lib/components/ui/ListRow.svelte`
- Demo viva: ruta `/componentes#ListRow`

## Cuándo usarlo

Dentro de `<ul class="divide-y divide-hairline">`. `stackTrailing` apila acciones bajo el texto en móvil.

## Props

```ts
type Props = {
	title: string;
	subtitle?: string;
	leading?: Snippet;
	trailing?: Snippet;
	/** Si se indica, la fila entera es un enlace. */
	href?: string;
	/** Si se indica (y no hay href), la fila entera es un botón. */
	onclick?: () => void;
	/** Registro anulado: texto tachado y atenuado (RN-062). */
	voided?: boolean;
	/** En móvil, el contenido de la derecha pasa a una segunda línea (útil con acciones). */
	stackTrailing?: boolean;
	class?: string;
};
```

## Accesibilidad

Fila entera clicable con foco visible.
