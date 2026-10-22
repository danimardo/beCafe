# Banner

Aviso en línea persistente: info, warning, negative, offline.

- Importar: `import { Banner } from '#lib';`
- Archivo: `src/lib/components/ui/Banner.svelte`
- Demo viva: ruta `/componentes#Banner`

## Cuándo usarlo

Para estados que no desaparecen (sin conexión, prueba de restauración pendiente, hucha negativa).

## Props

```ts
type Props = {
	tone?: 'info' | 'warning' | 'negative' | 'offline';
	title?: string;
	class?: string;
	/** Acciones (botones o enlaces) bajo el texto. */
	actions?: Snippet;
	children?: Snippet;
};
```

## Accesibilidad

Icono + texto; color no único.
