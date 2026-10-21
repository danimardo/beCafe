# VoidDialog

Anulación con motivo obligatorio (RN-030) y explicación de la consecuencia económica.

- Importar: `import { VoidDialog } from '#lib';`
- Archivo: `src/lib/components/ui/VoidDialog.svelte`
- Demo viva: ruta `/componentes#VoidDialog`

## Cuándo usarlo

Un único componente para anular consumos, aportaciones, compras, arqueos.

## Props

```ts
type Props = {
	open?: boolean;
	/** Qué se anula, p. ej. «Consumo de Ristretto · 18 oct». */
	subject: string;
	/** Consecuencia económica que se explicará al usuario antes de confirmar. */
	consequence?: string;
	onconfirm: (reason: string) => void;
};
```

## Accesibilidad

Error en línea si falta el motivo.
