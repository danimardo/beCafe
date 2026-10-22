# BrandMark

Logotipo y nombre «beCafé» (RT-011). Tamaños `sm` (barra lateral), `md` (privacidad bloqueante) y `lg` (acceso).

- Importar: `import { BrandMark } from '#lib';`
- Archivo: `src/lib/components/layout/BrandMark.svelte`
- Demo viva: ruta `/componentes#BrandMark`

## Cuándo usarlo

Úsalo siempre que haga falta la marca: no pegues el nombre a mano. El logotipo (taza con gota de agua) es **propuesto**; su fuente es `design/pwa/icon.svg`.

## Props

```ts
type Props = {
	/** «sm» 36 px (barra lateral), «md» 40 px (pantalla bloqueante), «lg» 64 px (acceso). */
	size?: 'sm' | 'md' | 'lg';
	/** Muestra «beCafé» al lado (en serif). Sin él, solo el icono. */
	wordmark?: boolean;
	class?: string;
};
```

## Accesibilidad

El icono es decorativo; sin nombre visible se añade «beCafé» solo para lectores de pantalla.
