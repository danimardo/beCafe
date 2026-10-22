# WaterRefillCard

Tarjeta de Inicio para registrar un relleno de agua (HU-17): último relleno, acción «He rellenado el agua», aguador del mes y enlace a los rellenos recientes.

- Importar: `import { WaterRefillCard } from '#lib';`
- Archivo: `src/lib/components/capsulas/WaterRefillCard.svelte`
- Demo viva: ruta `/componentes#WaterRefillCard`

## Cuándo usarlo

Va encima de las cápsulas. Estados: normal, rechazado por intervalo (RF-172), sin conexión (RF-173) y sin rellenos. El rechazo en pantalla es solo un aviso temprano: decide el servidor (409 `RELLENO_RECIENTE`). El botón es `soft`, no primario.

## Props

```ts
type Props = {
	/** Último relleno vigente de cualquiera (RF-170). `null`: «Sin rellenos registrados». */
	last: { name: string; minutesAgo: number } | null;
	/** Intervalo mínimo entre rellenos, en minutos (RN-082). Solo sirve para el aviso temprano; decide el servidor. */
	intervalMinutes: number;
	/** Sin conexión: la acción se desactiva con una explicación (RN-081, RF-173). */
	offline?: boolean;
	/** Aguador del mes anterior (RF-176). `null` o sin nombres: no se muestra (no hay título). */
	aguador?: { month: string; names: string[]; meIncluded?: boolean } | null;
	/** Quien pulsa. Tras registrar, es el nuevo «último». */
	meName: string;
	/** Pulsar la acción (con conexión y fuera del intervalo): aquí iría POST /api/rellenos con `clienteId`. Si el servidor responde 409, la tarjeta pasa a mostrar el rechazo. */
	onrefill: () => void;
	class?: string;
};
```

## Accesibilidad

El rechazo usa `role=alert`; la explicación sin conexión está enlazada al botón con `aria-describedby`; el aguador lleva trofeo y texto.
