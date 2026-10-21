# PageHeader

Antetítulo + título (serif) + acciones.

- Importar: `import { PageHeader } from '#lib';`
- Archivo: `src/lib/components/layout/PageHeader.svelte`
- Demo viva: ruta `/componentes#PageHeader`

## Cuándo usarlo

Un `h1` por pantalla.

## Props

```ts
type Props = {
	/** Antetítulo en mayúsculas, p. ej. la fecha o la sección. */
	eyebrow?: string;
	title: string;
	/** Acciones a la derecha (avatar, botón). */
	actions?: Snippet;
	/** Campana de avisos (RF-107). Visible en todas las pantallas de la app; desactívala solo en catálogos o pantallas sin sesión. */
	bell?: boolean;
};
```

## Accesibilidad

Un único h1.
