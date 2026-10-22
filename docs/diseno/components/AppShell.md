# AppShell

Estructura de página: fondo, skip link, navegación, contenido, avisos.

- Importar: `import { AppShell } from '#lib';`
- Archivo: `src/lib/components/layout/AppShell.svelte`
- Demo viva: ruta `/componentes#AppShell`

## Cuándo usarlo

Una vez por grupo de rutas (`(app)/+layout.svelte`). `width="wide"` para administración.

## Props

```ts
type Props = {
	nav: NavItem[];
	adminNav?: NavItem[];
	user: { name: string; role: 'miembro' | 'administrador' };
	/** Ancho de contenido: «normal» (pantallas de miembro) o «wide» (administración y tablas). */
	width?: 'normal' | 'wide';
	children: Snippet;
};
```

## Accesibilidad

Skip link, landmarks.
