# NotificationBell

Campana con contador de avisos nuevos que abre el panel (RF-107). Va en `PageHeader` de todas las pantallas.

- Importar: `import { NotificationBell } from '#lib';`
- Archivo: `src/lib/components/notificaciones/NotificationBell.svelte`
- Demo viva: ruta `/componentes#NotificationBell`

## Cuándo usarlo

El contador sale de `notifications.unreadCount`. Se monta sola desde `PageHeader` (`bell={false}` para ocultarla).

## Props

```ts
type Props = { class?: string };
```

## Accesibilidad

`aria-label` con el número («Avisos, 3 nuevos»); contador no es solo color.
