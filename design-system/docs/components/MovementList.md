# MovementList

Lista de movimientos con la hoja de detalle y el diálogo de anulación incluidos (RF-062, RF-112).

- Importar: `import { MovementList } from '#lib';`
- Archivo: `src/lib/components/capsulas/MovementList.svelte`
- Demo viva: ruta `/componentes#MovementList`

## Cuándo usarlo

Úsala en `/saldos` (5 últimos) y `/historial`. Recibe los elementos ya filtrados y paginados; `onvoided(id, motivo)` es donde iría la petición al servidor.

## Props

```ts
type Props = {
	/** Movimientos a mostrar (ya filtrados y paginados). Al anular, se marca `voided` en el elemento. */
	items: MovementDetail[];
	viewer: Viewer;
	/** Plazo de autoanulación en minutos (RN-032). */
	graceMinutes: number;
	/** Se llama tras confirmar una anulación, con el id y el motivo; aquí iría la petición al servidor. */
	onvoided?: (id: string, reason: string) => void;
	emptyTitle?: string;
	emptyDescription?: string;
};
```

## Accesibilidad

Cada fila es un botón; el detalle es un `Sheet` con foco atrapado.
