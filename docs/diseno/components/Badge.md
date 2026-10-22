# Badge

Etiqueta corta de estado (Administrador, Correcta, Fallida…).

- Importar: `import { Badge } from '#lib';`
- Archivo: `src/lib/components/ui/Badge.svelte`
- Demo viva: ruta `/componentes#Badge`

## Cuándo usarlo

El significado debe estar en el texto; el color solo refuerza.

## Props

```ts
type Props = {
	tone?: 'neutral' | 'accent' | 'positive' | 'negative' | 'warning';
	/** Icono opcional (componente de Lucide). Decorativo: el significado debe estar en el texto. */
	icon?: Snippet;
	class?: string;
	children: Snippet;
};
```

## Accesibilidad

Color nunca es la única señal.
