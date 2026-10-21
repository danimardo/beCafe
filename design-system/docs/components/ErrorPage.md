# ErrorPage

Página de error con icono, texto y acciones: no encontrada, sin permiso, error del servidor y sin conexión.

- Importar: `import { ErrorPage } from '#lib';`
- Archivo: `src/lib/components/layout/ErrorPage.svelte`
- Demo viva: ruta `/componentes#ErrorPage`

## Cuándo usarlo

Úsala desde `+error.svelte`, `/offline` y `/errores/[tipo]`. «Reintentar» solo en servidor y sin conexión. Los mensajes nunca muestran códigos técnicos como texto principal.

## Props

```ts
type Props = {
	kind: ErrorKind;
	/** Código técnico opcional (p. ej. «404»); se muestra pequeño bajo el texto. */
	code?: string | number;
	/** Sustituye el texto del cuerpo si el servidor da uno más concreto (p. ej. «Solo un administrador puede ver esto»). */
	message?: string;
	/** Para «Reintentar» (servidor y sin conexión). Si no se pasa, se recarga la página. */
	onretry?: () => void;
};
```

## Accesibilidad

Un `h1`; iconos decorativos; sin trampas de foco.
