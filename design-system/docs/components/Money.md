# Money

Importe en euros formateado es-ES con signo (U+2212) y cifras tabulares. Recibe céntimos enteros.

- Importar: `import { Money } from '#lib';`
- Archivo: `src/lib/components/ui/Money.svelte`
- Demo viva: ruta `/componentes#Money`

## Cuándo usarlo

Úsalo para TODO importe mostrado. Con `signed` añade «+»; con `tone` colorea. Usa `srSuffix` («a favor», «debe») para lectores de pantalla.

## Props

```ts
type Props = {
	/** Importe en céntimos enteros (RN-020). */
	cents: number;
	/** Añade «+» a los importes positivos. Úsalo en saldos y movimientos. */
	signed?: boolean;
	/** Colorea: verde si es positivo, rojo si es negativo. El signo siempre se muestra, el color no es la única señal. */
	tone?: boolean;
	/** Texto solo para lector de pantalla tras el importe, p. ej. «a favor» o «debe». */
	srSuffix?: string;
	class?: string;
};
```

## Accesibilidad

Signo + color; nunca solo color.
