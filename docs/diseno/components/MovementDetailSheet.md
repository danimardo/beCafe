# MovementDetailSheet

Detalle de un movimiento con el botón «Anular» o el texto que explica por qué no se puede (RF-111, RF-112, RF-062).

- Importar: `import { MovementDetailSheet } from '#lib';`
- Archivo: `src/lib/components/capsulas/MovementDetailSheet.svelte`
- Demo viva: ruta `/componentes#MovementDetailSheet`

## Cuándo usarlo

Se abre al tocar una fila de `MovementRow` con `onclick`. La decisión real la toma el servidor; `voidPolicy` en `#lib/movements` solo da la pista a la interfaz.

## Props

```ts
type Props = {
	open?: boolean;
	movement: MovementDetail | null;
	viewer: Viewer;
	/** Plazo de autoanulación en minutos (RN-032, configurable). */
	graceMinutes: number;
	/** El usuario pulsa «Anular»: abre el diálogo de motivo (VoidDialog) en la pantalla. */
	onvoid: (m: MovementDetail) => void;
	/** El usuario quita de la cola un consumo aún no enviado (RF-063). */
	ondequeue?: (m: MovementDetail) => void;
};
```

## Accesibilidad

Sheet con foco atrapado; el motivo de «no se puede» está en texto.
