# ReauthDialog

Pide la contraseña de nuevo antes de acciones sensibles (RN-050).

- Importar: `import { ReauthDialog } from '#lib';`
- Archivo: `src/lib/components/ui/ReauthDialog.svelte`
- Demo viva: ruta `/componentes#ReauthDialog`

## Cuándo usarlo

`onsubmit` debe validar en el SERVIDOR y devolver true/false.

## Props

```ts
type Props = {
	open?: boolean;
	/** Devuelve true si la contraseña es correcta. Debe validarse en el servidor. */
	onsubmit: (password: string) => Promise<boolean> | boolean;
	onsuccess?: () => void;
};
```

## Accesibilidad

Campo de contraseña con autocomplete correcto.
