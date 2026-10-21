# AppNav

Navegación: píldora flotante inferior en móvil; barra lateral de cristal en ≥md con grupo Administración.

- Importar: `import { AppNav } from '#lib';`
- Archivo: `src/lib/components/layout/AppNav.svelte`
- Demo viva: ruta `/componentes#AppNav`

## Cuándo usarlo

Se monta desde `AppShell`.

## Props

```ts
type Props = {
	items: NavItem[];
	/** Solo para administradores: se muestra en la barra lateral (escritorio). En móvil se entra desde Perfil. */
	adminItems?: NavItem[];
	user: { name: string; role: 'miembro' | 'administrador' };
};
```

## Accesibilidad

`nav` con `aria-current`.
