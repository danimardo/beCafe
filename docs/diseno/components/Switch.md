# Switch

Interruptor on/off con etiqueta y descripción (preferencias de avisos).

- Importar: `import { Switch } from '#lib';`
- Archivo: `src/lib/components/ui/Switch.svelte`
- Demo viva: ruta `/componentes#Switch`

## Cuándo usarlo

`disabled` + `checked` para ajustes bloqueados (aviso de deuda, RF-102). Basado en Bits UI Switch.

## Props

```ts
type Props = {
	checked?: boolean;
	label: string;
	description?: string;
	/** Bloqueado y activado, p. ej. el aviso de deuda, que no se puede desactivar (RF-102). */
	disabled?: boolean;
	onchange?: (checked: boolean) => void;
	class?: string;
};
```

## Accesibilidad

Estado visible por posición y borde, no solo color.
