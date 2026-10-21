# CopyField

Campo de solo lectura con botón «Copiar» para enlaces de invitación y de recuperación (RF-131).

- Importar: `import { CopyField } from '#lib';`
- Archivo: `src/lib/components/ui/CopyField.svelte`
- Demo viva: ruta `/componentes#CopyField`

## Cuándo usarlo

Muestra el enlace completo y copia al portapapeles; si el navegador lo impide, avisa para copiarlo a mano. Recuerda al usuario cuándo caduca (RN-052) en el texto que lo acompaña.

## Props

```ts
type Props = {
	label: string;
	/** Texto que se muestra y se copia (p. ej. el enlace de invitación o de recuperación, RF-131). */
	value: string;
	hint?: string;
	class?: string;
};
```

## Accesibilidad

Botón con estado anunciado («Enlace copiado»); campo seleccionable.
