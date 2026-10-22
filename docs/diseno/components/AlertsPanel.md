# AlertsPanel

Panel de inicio con saldo de la hucha, tu saldo y avisos de stock/deuda.

- Importar: `import { AlertsPanel } from '#lib';`
- Archivo: `src/lib/components/capsulas/AlertsPanel.svelte`
- Demo viva: ruta `/componentes#AlertsPanel`

## Cuándo usarlo

Datos calculados por el servidor.

## Props

```ts
type Props = {
	/** Saldo teórico de la hucha, en céntimos (RN-011). */
	huchaCents: number;
	/** Saldo de la persona que usa la app, en céntimos (RN-010). */
	myBalanceCents: number;
	/** Nombres de los tipos en stock bajo (RN-071). */
	lowStock?: string[];
	/** Personas por debajo del límite de deuda (RN-074). */
	debtors?: { name: string; cents: number }[];
};
```

## Accesibilidad

Estructura de lista.
