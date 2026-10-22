# Notas de implementación

## Tema claro/oscuro
- `src/app.html` ejecuta un script **antes de pintar** que lee `localStorage['capsulas-tema']` (`auto|claro|oscuro`) y pone `data-theme` en `<html>`; sin valor sigue `prefers-color-scheme`.
- `theme` (`src/lib/theme.svelte.ts`) mantiene el estado. Para guardar la preferencia en la cuenta, asigna `theme.onPersist = (pref) => fetch('/perfil', …)` y al cargar el perfil llama a `theme.set(pref)`.
- Cambios en colores: edita `tokens/tokens.json` y ejecuta `npm run tokens`. Cualquier cambio debe mantener contraste ≥4,5:1 (texto) y ≥3:1 (bordes de campo) sobre cristal en el peor caso.

## Fuentes
Autoalojadas con `@fontsource-variable/inter` y `@fontsource-variable/fraunces` (importadas en `src/routes/+layout.svelte`). Sin peticiones a terceros (privacidad, RF-160).

## PWA
Iconos, icono maskable, apple-touch-icon, insignia push y pantallas de arranque de iOS **ya están generados** (ver [`pwa-assets.md`](pwa-assets.md); salen del logotipo de marca con un script). `static/manifest.webmanifest` y `src/app.html` los enlazan. **Pendiente**: service worker (`src/service-worker.ts`) con caché de la app y página de reserva `/offline`, **cola de consumos sin conexión** (IndexedDB; envío idempotente por `clienteId`, RF-015/016) y suscripción push (RF-100+). La UI ya contempla el estado pendiente (`MovementRow pending`), el `Banner` de pendientes y `ErrorPage kind="sin-conexion"`.

## Estados de demostración
La plantilla no tiene servidor, así que algunos estados se activan con parámetros. **Quítalos al conectar datos reales**: `/?demo=pendientes`, `/?demo=rechazado`, `/login?estado=bloqueada`, `/acceso/x?estado=caducado|usado`, `/errores/{no-encontrada|sin-permiso|servidor|sin-conexion}`, `/?demo=relleno-reciente|sin-conexion|sin-rellenos|sin-aguador` y `/aceptar-privacidad?estado=actualizado`. En usuarios, control y estadísticas los datos se copian a estado local solo para que la demo reaccione; `voidPolicy` (`#lib/movements`) únicamente orienta a la UI, la decisión es del servidor (RNF-007).

## Avisos dentro de la app
`notifications` (`#lib/notifications.svelte`) guarda la lista, `lastSeenAt` y `open`. Sustituye `load()` por una consulta al servidor (últimos 30 días). El contador cuenta los posteriores a `lastSeenAt`; abrir el panel lo actualiza (una marca por usuario).

## Despliegue
`adapter-node` (configurado en `vite.config.ts`). Docker/Coolify: `npm ci && npm run build`, ejecutar `node build`, volumen para `/data` (SQLite y fotos), endpoint `/api/salud`. Detalles en la sección 10.7 de la especificación.

## SvelteKit 3 (diferencias con versiones previas)
Alias de importación `#lib` mediante `package.json → imports` (no `$lib`); `$app/env` en lugar de `$app/environment`; configuración dentro de `vite.config.ts`; TypeScript ^6.

## Datos de ejemplo
`src/lib/mock.ts` alimenta todas las pantallas. Sustituir por `load` de SvelteKit y *form actions* que lean/escriban en SQLite. Los importes del mock están en céntimos.

## Sin implementar (ver `historias.md`)
Autenticación y sesiones (RN-043–050), cálculo de coste medio ponderado (RN-021), repartos de arqueos y recuentos, bajas con liquidación, tareas de resumen mensual y avisos, copias de seguridad, subida y validación de fotos, aviso de privacidad con registro de lectura.

## Relleno de agua y aguador del mes (v0.4.0)
`WaterRefillCard` solo pinta y avisa. En el servidor: `POST /api/rellenos { clienteId }` (idempotente), 409 `RELLENO_RECIENTE` con autor y hora del último, y anulación como los consumos. El rechazo que hace la interfaz con `intervalMinutes` es una ayuda: dos personas pueden pulsar a la vez (INV-07, EV-100). El aguador (`aguador_mes`) se determina el día 1 y se muestra todo el mes; si un administrador anula después un relleno del mes anterior, el título **no se recalcula** (PEND-033, propuesto en la especificación).
