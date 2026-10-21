# NotificationItem

Una notificación del panel: icono por tipo, título, texto, tiempo relativo y marca «nuevo».

- Importar: `import { NotificationItem } from '#lib';`
- Archivo: `src/lib/components/notificaciones/NotificationItem.svelte`
- Demo viva: ruta `/componentes#NotificationItem`

## Cuándo usarlo

Si lleva destino, la fila entera es un enlace. «Nuevo» se muestra con texto, no solo con color.

## Props

```ts
type Props = {
	notification: AppNotification;
	/** Resalta el aviso como «nuevo» (llegó desde la última vez que se abrió el panel). */
	isNew?: boolean;
	onclick?: () => void;
};
```

## Accesibilidad

Enlace o texto estático según destino; estado «nuevo» en texto.
