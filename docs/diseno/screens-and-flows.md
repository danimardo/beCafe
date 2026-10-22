# Pantallas y flujos

La distribución detallada (zonas, medidas, capturas) está en `screen-layouts.md`. Cada pantalla de la plantilla está en `src/routes/`. Los identificadores (HU-xx, RF-xxx, RN-xxx) remiten a `historias.md`, en la raíz del repositorio. Rutas = sección 10.5 de la especificación.

| Pantalla | Ruta | Historias / requisitos | Componentes clave |
| --- | --- | --- | --- |
| Inicio | `/` (demo: `?demo=pendientes`, `rechazado`, `relleno-reciente`, `sin-conexion`, `sin-rellenos`, `sin-aguador`) | HU-01–04, HU-08, HU-17; RF-010–017, RF-019, RF-020–023, RF-170–173, RF-176; RN-054, RN-081, RN-082 | AlertsPanel, **WaterRefillCard**, CapsuleRow, UndoToast (con aviso), Banner (pendientes, rechazado), EmptyState |
| Saldos | `/saldos` | HU-05, HU-07; RF-030–032, RF-110–113; CA-111 | ListRow (solo la fila propia pulsable), Money, MovementList (5 últimos), Sheet + MoneyField (aportación) |
| Historial | `/historial` (`?quien=mios`, `?tipo=rellenos`) | RF-062, RF-111, RF-112; RN-062, RN-083 | BackLink, SegmentedControl (Todo/Míos), SelectField (tipo), Switch, MovementList, Pagination |
| Compras | `/compras` | HU-06; RF-040–046, RN-012 | Sheet (multilínea), MoneyField, PhotoField, Banner + ConfirmDialog (hucha negativa), MovementDetailSheet, RegularizationSummary |
| Estadísticas | `/estadisticas` | HU-10, HU-17; RF-120–123, RF-175 | SegmentedControl (Mías / Equipo y periodo), SelectField (persona, solo admin), KpiTile, BarChart, SplitBar, ranking de rellenos |
| Perfil | `/perfil` | HU-09; RF-100–106 (avisos de administración: RF-101/102) | ThemeToggle, Switch, PasswordField, ConfirmDialog, ListRow |
| Ayuda de instalación | `/ayuda` | RT-005 (PWA) | Glass, Section |
| Privacidad (consulta) | `/privacidad` | RF-160; Anexo A (pendiente de validar) | PrivacyText, BackLink |
| Aceptar privacidad (bloqueante) | `/aceptar-privacidad` | RF-160, RF-161 | PrivacyText, Button; sin navegación |
| Acceso | `/login` (demo: `?estado=bloqueada`) | RF-133, RN-048 | TextField, PasswordField, Button, Banner |
| Definir contraseña | `/acceso/[token]` (demo: `?estado=caducado`, `?estado=usado`) | RF-131, RF-132, RN-052, RN-053 | PasswordField, Banner, EmptyState |
| Errores | `+error.svelte`, `/errores/[tipo]` (demo), `/offline` | RF-122, RF-019 | ErrorPage |
| Avisos (panel) | hoja desde la campana de cualquier pantalla | RF-107 | NotificationBell, NotificationPanel, NotificationItem |
| Administración | `/admin` (+ subrutas) | ver `admin-screens.md` | — |
| Catálogo de componentes | `/componentes` | — | todos |

## Flujos principales

**Registrar un consumo (HU-01).** Toque en la fila entera de la cápsula → se registra +1 al instante (actualización optimista), aparece `UndoToast` 5 s con «Deshacer» (RF-013). El botón de persona de la fila registra «para un invitado» (RF-014): cobra al usuario pero no cuenta en sus estadísticas. Sin conexión: el consumo queda **pendiente** (MovementRow `pending`), con Banner `offline`; se envía al volver la red (idempotente por `clienteId`).

**Deshacer / anular (HU-02, HU-14).** Autor en plazo desde el toast o el historial; el administrador fuera de plazo. Siempre `VoidDialog` con motivo obligatorio y explicación de la consecuencia económica. Lo anulado se oculta por defecto y, si se muestra, va tachado con insignia «Anulado».

**Aportación (HU-05).** Saldos → «Aportar» → Sheet con MoneyField → confirmación con Money del nuevo saldo.

**Compra (HU-06).** Sheet con una o varias líneas (tipo, unidades, precio total), foto opcional del ticket. Si la hucha quedaría negativa: Banner y `ConfirmDialog` explícito antes de guardar (RF-043).

**Avisos (RF-107).** Campana en la cabecera de cada pantalla con contador de nuevos. Al abrir la hoja se marcan todos como leídos (una sola marca `lastSeenAt` por usuario) y se conservan 30 días. Cada aviso con destino es un enlace. Pie: «Ajustar qué avisos recibo» → `/perfil`.

**Historial y anulación por el miembro (RF-111, RF-112, RF-062).** *(Desde la v0.4.0 vive en `/historial`; `/saldos` solo muestra los 5 últimos y `/saldos/mio` ya no existe.)* Tocar una fila abre `MovementDetailSheet`. Si el usuario puede anular (autor y dentro de plazo, o administrador), el pie lleva «Anular» y se abre `VoidDialog` con motivo. Si no, el pie explica el motivo: «Ya pasó el plazo: pídeselo a un administrador» o «Lo ha registrado otra persona». La UI solo orienta (`voidPolicy`, `#lib/movements`); decide el servidor. Los anulados quedan ocultos y se ven con el interruptor «Mostrar anulados» (RN-062).

**Anular una compra (RF-045, RN-012).** `VoidDialog` → al confirmar, `RegularizationSummary` lista los ajustes generados (a quién y cuánto) y el nuevo saldo de la hucha.

**Consumo con casos especiales.** Stock ≤ 0 (RF-017): se registra igualmente y el `UndoToast` lleva una línea de aviso («No constaba stock…») y dura 9 s. Pendientes de enviar (RF-019): `Banner offline` con el número y la advertencia de que se pierden si se borran los datos del navegador. Rechazado por baja (RN-054): `Banner negative` con «Entendido».

**Privacidad bloqueante (RF-160/161).** Si el usuario no ha aceptado la versión vigente, el servidor debe redirigir todo el grupo `(app)` a `/aceptar-privacidad` (la plantilla solo trae la pantalla; la redirección es lógica de servidor): sin barra de navegación ni campana. Acción primaria «He leído el texto» (barra fija inferior) y secundaria «Cerrar sesión».

**Gestionar usuario (RF-134, RF-131, RF-136).** Fila → «Gestionar» → hoja con cambio de rol (reautenticación, RN-050), enlace de recuperación (1 h, un solo uso, anula los anteriores; `CopyField`) y «Dar de baja…». Un usuario dado de baja muestra «Reactivar» (solo con saldo 0,00 €), que genera un enlace nuevo de 1 h. Si fuera a quedar sin administradores, error en línea (RN-041, código `ULTIMO_ADMIN`).

**Recuentos y arqueos (RN-036).** «Último arqueo» con «Anular», y «Recuentos por tipo»: cada tipo muestra «Anular este recuento» solo en su último recuento vigente.

**Estadísticas (RF-120, RF-123).** Conmutador «Mías / Equipo». Equipo: cafés por mes y por tipo de **miembros**; los **invitados van aparte** y nunca se suman. Administradores: selector «Persona» sobre «Mías» (**propuesto** como ubicación; un miembro nunca lo ve y el servidor deniega la URL directa, RF-122, con `ErrorPage kind="sin-permiso"`).

**Acceso bloqueado y enlaces (RN-048, RN-052, RN-053).** Tras 5 fallos, `Banner warning` «Demasiados intentos… 15 minutos» (**propuesto**: mensaje genérico, igual exista o no el correo, para respetar RF-133). Enlace caducado o usado: `EmptyState` con «Ir a entrar». Contraseña común: `Banner negative` «Contraseña demasiado común» y botón desactivado.

**Relleno de agua (HU-17).** En Inicio, un toque en «He rellenado el agua» registra un relleno a nombre de la persona (no mueve dinero, RN-080) y muestra `UndoToast` 5 s con «Deshacer» (RN-083). Si hay otro relleno vigente de cualquiera dentro del intervalo mínimo (RN-082), se rechaza con «{Nombre} la rellenó hace N min» (RF-172). Sin conexión la acción está desactivada (RN-081, no entra en la cola). Quien rellena más en un mes natural es el **aguador del mes** (RN-084): se muestra en la tarjeta durante todo el mes siguiente. Los rellenos se ven (todos) y se anulan desde `/historial` (autor con motivo en plazo; administrador siempre).

**Baja de usuario (HU-13).** Stepper de pasos (resumen → liquidación → confirmar) y `ReauthDialog` (RN-050).

## Estados que toda pantalla debe cubrir

| Estado | Cómo |
| --- | --- |
| Vacío | `EmptyState` con acción (p. ej. «Registrar la primera compra») |
| Cargando | `Skeleton` con la forma del contenido; nunca spinner a pantalla completa |
| Error | `Banner tone="negative"` con texto claro y acción «Reintentar» |
| Sin conexión | `Banner tone="offline"`; las acciones de escritura permitidas offline (consumo) siguen funcionando y se marcan pendientes |
| Éxito | `UndoToast`/aviso en `ToastRegion` (región viva) |
| Sin permiso | `ErrorPage kind="sin-permiso"` (código `SIN_PERMISO`) |
| Página no encontrada / error del servidor / sin conexión | `ErrorPage` (`+error.svelte`, `/offline`) |

## Rutas de servidor y errores

Ver la tabla 10.5 de la especificación (rutas `/api/consumos`, `/aportaciones`, `/compras`, `/historial`, `/admin/*`…). Errores JSON `{codigo, mensaje}` en español: `SIN_SESION`, `SIN_PERMISO`, `FUERA_DE_PLAZO`, `YA_ANULADO`, `VALIDACION`, `REAUTENTICACION_REQUERIDA`, `ULTIMO_ADMIN`. Muéstralos con `Banner`/`TextField error`, nunca como códigos.
