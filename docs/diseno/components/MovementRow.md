# MovementRow

Fila de movimiento (consumo, aportación, compra, arqueo, recuento, reparto, regularización, baja y **relleno de agua**, que no tiene importe) con estados anulado y pendiente.

- Importar: `import { MovementRow } from '#lib';`
- Archivo: `src/lib/components/capsulas/MovementRow.svelte`
- Demo viva: ruta `/componentes#MovementRow`

## Cuándo usarlo

Anulado: tachado + insignia (RN-062). Pendiente: consumo sin conexión (RF-015).

## Props

```ts
type Props = {
	kind: MovementKind;
	title: string;
	/** Línea secundaria: fecha, autor, motivo. */
	subtitle?: string;
	/** Importe con signo, en céntimos. Omite si el registro no tiene importe (p. ej. un recuento sin faltante). */
	cents?: number;
	/** Anulado (RN-035): se oculta por defecto y, si se muestra, va tachado con la insignia «Anulado» (RN-062). */
	voided?: boolean;
	/** Consumo guardado en el móvil sin conexión, aún sin enviar (RF-015). */
	pending?: boolean;
	/** Si se indica, la fila entera es un botón que abre el detalle (RF-112, RF-062). */
	onclick?: () => void;
	class?: string;
};
```

## Accesibilidad

Estados en texto.
