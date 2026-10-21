# RegularizationSummary

Resumen de regularizaciones tras anular una compra (RN-012, RF-045): qué cargos y abonos se han recalculado.

- Importar: `import { RegularizationSummary } from '#lib';`
- Archivo: `src/lib/components/capsulas/RegularizationSummary.svelte`
- Demo viva: ruta `/componentes#RegularizationSummary`

## Cuándo usarlo

Se muestra tras confirmar la anulación de una compra con consumos posteriores. Exporta los tipos `Regularization` y `RegularizationResult`.

## Props

```ts
type Props = {
	open?: boolean;
	result: RegularizationResult | null;
	onclose?: () => void;
};
```

## Accesibilidad

Importes con signo y texto; lista semántica.
