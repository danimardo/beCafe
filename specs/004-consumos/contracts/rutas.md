# Contratos de rutas: Consumos (F3)

Todas exigen sesión; los permisos están en los casos de uso de `economia`. Entran en `acceso` (EV-050) y `a11y`.

## `/` (pantalla principal)

- `load`: `leerTiposRegistrables(actor)` (activos con coste medio, con stock, días estimados y precio), avisos (F2, F4), `leerConsumosRecientesPropios(actor)` (dentro del plazo), un `clienteId` por fila.
- *Action* `consumir`: `esquemaConsumoFormulario` (`clienteId`, `tipoCapsulaId`, `invitado` 0/1, `horaGesto` opcional). Éxito: `{ consumoId, precio, descuadre }`; la página muestra la confirmación (toast con JavaScript, `Banner` con «Deshacer» sin JavaScript). Errores: `TIPO_SIN_COSTE`, `USUARIO_DE_BAJA`.
- *Action* `deshacer`: `consumoId`. Éxito: «Consumo deshecho». Errores: `FUERA_DE_PLAZO`, `YA_ANULADO`.
- Estados: vacío («Todavía no hay cápsulas para registrar…»), sin conexión (`Banner offline`; las filas siguen activas y van a la cola), pendientes (número y aviso RF-019), rechazado (`Banner negative` con «Entendido»), error.

## `/consumos/[consumoId=ulid]`

- `load`: `leerConsumo(actor, id)`: autor, tipo, precio, horas, estado; 404 si no existe o si un miembro pide uno ajeno.
- *Action* `anular`: `motivo` (1–200). Errores: `FUERA_DE_PLAZO`, `SIN_PERMISO` («Pídelo a un administrador»), `YA_ANULADO`, `ESTADO_INCORRECTO`.

## `/historial` (mínimo en F3; F6 lo completa)

- `load` con consulta `z.strictObject({ pagina: z.coerce.number().int().min(1).optional() })`: consumos recientes; un miembro ve los suyos, un administrador los de todos. Cada fila enlaza a `/consumos/[id]`.
- Vacío: «Todavía no hay consumos».

## `POST /api/consumos`

Ver [api-consumos.md](api-consumos.md).
