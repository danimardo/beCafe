# Contratos de rutas: Operación (F7)

Todas exigen rol administrador en el caso de uso, entran en `acceso` (EV-050) y en `a11y` (claro y oscuro).

## `/admin/configuracion`

- `load`: valores vigentes, rangos, tramos del límite vigente, último cambio de cada parámetro (autor y fecha).
- *Action* `guardar`: `z.strictObject({ plazoAutoanulacionMin: z.coerce.number().int().min(1).max(1440), limiteDeuda: esquemaImporteEuros (100 a 10 000 céntimos, se guarda en negativo), intervaloRellenosMin: z.coerce.number().int().min(0).max(1440) })`.
  - Sin reautenticación reciente: `fail(401, { codigo: 'REAUTENTICACION_REQUERIDA', valores })` y `ReauthDialog` (sin JavaScript, el formulario de contraseña aparece en la página).
  - Fuera de rango: `fail(400, { errores, valores })` con el rango en el mensaje.
  - Éxito: «Configuración guardada.», anunciado.
- Estados: cargando, error, sin conexión (no disponible, EXC-007).

## `/admin/copias`

- `load`: últimas 30 copias, pruebas de restauración, estado del aviso de 100 días, `s3Configurado`.
- *Action* `anotarPrueba`: `z.strictObject({ realizadaEl: esquemaFechaMadrid, resultado: z.enum(['correcta','fallida']), notas: z.string().trim().max(500).optional() })`. Fecha futura: `fail(400)` «La fecha no puede ser posterior a hoy.».
- Estados: sin copias («Todavía no hay copias»), S3 sin configurar (`Banner`), cargando, error, sin conexión.

## `/admin` (amplía F1)

- `load`: añade el aviso de restauración (D6).

## `GET /api/salud` (F1, sin cambios)

Lo usa el `HEALTHCHECK` de la imagen y Coolify.
