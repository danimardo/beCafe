# Contratos de rutas: Relleno de agua (F8)

Todas exigen sesión, entran en `acceso` (EV-050) y en `a11y`.

## `/` (amplía F2, F3 y F4)

- `load`: añade `agua` con `rellenos.leerEstadoAgua(actor)` y un `clienteId` para el formulario sin JavaScript.
- *Action* `rellenar`: `z.strictObject({ clienteId: esquemaUlid })`.
  - Éxito: `{ relleno: { id }, duplicado }`; con JavaScript, `UndoToast` de 5 s; sin JavaScript, `Banner` con «Deshacer».
  - `fail(409, { codigo: 'RELLENO_RECIENTE', autor, esPropio, hace })`.
- *Action* `deshacerRelleno`: `z.strictObject({ rellenoId: esquemaUlid })`. Fuera de plazo: `fail(409, { codigo: 'FUERA_DE_PLAZO' })`.

## `/rellenos/[rellenoId=ulid]`

- `load`: detalle (autor, fecha, estado, anulación) y `puedeAnular` calculado por el caso de uso.
- *Action* `anular`: `z.strictObject({ motivo: z.string().trim().min(1).max(200) })`. Sin permiso: `error(403)`; ya anulado: `fail(409, { codigo: 'YA_ANULADO' })`; fuera de plazo: `fail(409, { codigo: 'FUERA_DE_PLAZO' })`.
- Inexistente: 404.

## `/historial` (amplía F6)

- Consulta: `tipo` admite `rellenos`. El `load` llama a `estadisticas.leerHistorial`.

## `/estadisticas` (amplía F6)

- Equipo: `ranking` de rellenos del periodo. Mías: `rellenos` en los KPI.
