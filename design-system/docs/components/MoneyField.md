# MoneyField

Campo de importe: el usuario escribe «2,45» y el componente expone céntimos enteros (`bind:cents`).

- Importar: `import { MoneyField } from '#lib';`
- Archivo: `src/lib/components/ui/MoneyField.svelte`
- Demo viva: ruta `/componentes#MoneyField`

## Cuándo usarlo

Nunca uses `number` flotante para dinero (RN-020). Acepta coma o punto.

## Props

```ts
type Props = {
	label: string;
	/** Importe en céntimos (bindable). null si está vacío o no es válido. */
	cents?: number | null;
	hint?: string;
	error?: string;
	required?: boolean;
	/** Si cambias `cents` desde fuera, cambia también esta clave para refrescar el texto. */
	class?: string;
};
```

## Accesibilidad

Teclado decimal en móvil.
