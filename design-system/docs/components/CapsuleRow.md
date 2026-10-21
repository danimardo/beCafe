# CapsuleRow

Fila de la pantalla principal: toda la fila registra +1; botón aparte para invitado (RF-014).

- Importar: `import { CapsuleRow } from '#lib';`
- Archivo: `src/lib/components/capsulas/CapsuleRow.svelte`
- Demo viva: ruta `/componentes#CapsuleRow`

## Cuándo usarlo

Dos botones hermanos (no anidados). Muestra stock, umbral, coste medio y días restantes.

## Props

```ts
type Props = {
	name: string;
	brand?: string;
	/** Intensidad 1–13, opcional (RF-001). */
	intensity?: number | null;
	/** Stock registrado; puede ser ≤ 0 (RN-070). */
	stock: number;
	/** Umbral mínimo del tipo (RN-071). */
	threshold: number;
	/** Coste medio redondeado al céntimo, en céntimos (RN-021). */
	avgCostCents: number;
	color: string;
	photoUrl?: string | null;
	/** Días estimados restantes (RN-073); null = «sin datos» (RF-022). */
	daysLeft?: number | null;
	/** Un toque en la fila registra un consumo (RF-011). */
	onregister: () => void;
	/** El botón de persona registra el consumo «para un invitado» (RF-014). */
	onregisterGuest: () => void;
	disabled?: boolean;
	class?: string;
};
```

## Accesibilidad

Dos objetivos ≥44 px con etiquetas distintas.
