# CapsuleImage

Foto de la cápsula con aro de color; si no hay foto, dibujo de cápsula con `color`.

- Importar: `import { CapsuleImage } from '#lib';`
- Archivo: `src/lib/components/capsulas/CapsuleImage.svelte`
- Demo viva: ruta `/componentes#CapsuleImage`

## Cuándo usarlo

Siempre pasar `color` (RF-001).

## Props

```ts
type Props = {
	name: string;
	/** Color del tipo de cápsula (hex), elegido por el administrador (RF-001). */
	color: string;
	/** Foto subida por el administrador (RF-005). Si falta, se dibuja la cápsula con `color`. */
	photoUrl?: string | null;
	size?: 'sm' | 'md' | 'lg';
	class?: string;
};
```

## Accesibilidad

Decorativa junto al nombre.
