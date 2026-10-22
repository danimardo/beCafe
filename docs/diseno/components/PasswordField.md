# PasswordField

Campo de contraseña con botón mostrar/ocultar y contador de mínimo 15 caracteres (RT-007/RN-047).

- Importar: `import { PasswordField } from '#lib';`
- Archivo: `src/lib/components/ui/PasswordField.svelte`
- Demo viva: ruta `/componentes#PasswordField`

## Cuándo usarlo

Usa `autocomplete` correcto (`current-password` o `new-password`).

## Props

```ts
type Props = {
	label?: string;
	value?: string;
	hint?: string;
	error?: string;
	autocomplete?: 'current-password' | 'new-password';
	/** RT-007 / RN-047: mínimo 15 caracteres. */
	minlength?: number;
	class?: string;
};
```

## Accesibilidad

Botón mostrar/ocultar con etiqueta.
