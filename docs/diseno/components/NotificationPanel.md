# NotificationPanel

Hoja con las notificaciones de los últimos 30 días, agrupadas en «Nuevos» y «Anteriores» (RF-107). Se marcan leídas al abrir.

- Importar: `import { NotificationPanel } from '#lib';`
- Archivo: `src/lib/components/notificaciones/NotificationPanel.svelte`
- Demo viva: ruta `/componentes#NotificationPanel`

## Cuándo usarlo

Ya está montado en `AppShell`; se abre con `notifications.openPanel()`. Pie con enlace a las preferencias del perfil.

## Props

```ts
// sin props
```

## Accesibilidad

Sheet con foco atrapado; estado vacío con `EmptyState`.
