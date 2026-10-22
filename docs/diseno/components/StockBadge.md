# StockBadge

Insignia «Stock bajo» (≤ umbral) o «Agotada» (≤0).

- Importar: `import { StockBadge } from '#lib';`
- Archivo: `src/lib/components/capsulas/StockBadge.svelte`
- Demo viva: ruta `/componentes#StockBadge`

## Cuándo usarlo

Icono + texto.

## Props

```ts
type Props = {
	/** «low»: stock ≤ umbral (RN-071). «out»: stock ≤ 0 (RN-070, puede ser negativo). */
	level: 'low' | 'out';
};
```

## Accesibilidad

No solo color.
