# Contratos de rutas: Notificaciones (F5)

Todas exigen sesión, entran en `acceso` (EV-050) y en `a11y` (claro y oscuro).

## `/perfil` (amplía F1)

- `load`: añade `preferencias` (tipos visibles según el rol, con su estado) y `esAdministrador`.
- *Action* `preferencia`: `z.strictObject({ tipo: tipoDesactivable, activada: z.enum(['si','no']) })`. Rechaza `deuda` y, para un miembro, los tipos de administración: `fail(403)` con mensaje «No puedes cambiar este aviso.».
- Sección «Notificaciones»: estado del dispositivo (D5), botón «Activar notificaciones» o «Desactivar en este dispositivo» (solo con JavaScript), interruptores (D4). El de deuda: activado y deshabilitado, «Siempre activado».

## `/avisos`

- `load`: `notificaciones.leerPanel(actor)`: avisos de 30 días con `nuevo` (sin ver antes de esta apertura).
- *Action* `abrir`: marca como vistos los avisos de la persona; sin JavaScript redirige (303) a `/avisos`; con JavaScript devuelve los avisos para el `NotificationPanel`.
- Estados: vacío («No tienes avisos de los últimos 30 días»), cargando, error, sin conexión.

## `/ayuda`

- `load`: sin datos (solo sesión).
- Contenido de D11. El botón «Activar notificaciones» solo con JavaScript.

## Campana en `(app)/+layout.server.ts`

- `load`: añade `avisosNuevos` (número) con `depends('app:avisos')`. Tras una *action* que registra algo, SvelteKit vuelve a cargar y el contador se actualiza.
