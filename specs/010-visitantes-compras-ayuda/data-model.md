# Data Model: F10

Migración `drizzle/0007_f10-visitantes.sql`: solo añade tablas, índices y una columna anulable (constitución XIV). Identificadores ULID; instantes en UTC ISO 8601.

## `auth.enlace_visitante` (RF-189, RF-190)

| Columna | Tipo | Reglas |
| --- | --- | --- |
| `id` | text PK | ULID |
| `token_hash` | text | único; SHA-256 del token del enlace |
| `creado_por` | text → `usuario.id` | miembro activo |
| `creado_en` | text | |
| `expira_en` | text | `creado_en` + 24 h |
| `revocado_en` | text? | |
| `revocado_por` | text? → `usuario.id` | creador o administrador |

Estado derivado: **vigente** si `revocado_en` es nulo y `ahora < expira_en`; si no, **caducado** o **revocado**.

## `auth.visita` (RF-190, RF-210)

| Columna | Tipo | Reglas |
| --- | --- | --- |
| `id` | text PK | ULID |
| `enlace_id` | text → `enlace_visitante.id` | |
| `token_hash` | text | único; SHA-256 de la cookie `becafe_visita` |
| `nombre` | text? | 1–60 caracteres sin espacios en los extremos; nulo tras RF-210 |
| `nombre_eliminado_en` | text? | |
| `creada_en` | text | |

Una visita se resuelve solo mientras su enlace está vigente. El nombre se muestra como «Visitante» cuando es nulo.

## `economia.cafe_visitante` (RF-191, RF-193, RN-086)

| Columna | Tipo | Reglas |
| --- | --- | --- |
| `id` | text PK | ULID |
| `cliente_id` | text | único (idempotencia) |
| `visita_id` | text | identificador de `auth.visita` (sin FK entre módulos) |
| `tipo_capsula_id` | text | tipo activo con coste medio al registrar |
| `hora_gesto`, `hora_registro` | text | |
| `estado` | text | `CHECK IN ('pendiente','aprobado','rechazado','anulado')` |
| `revisado_por`, `revisado_en` | text? | administrador |
| `coste_medio_aplicado` | integer? | diezmilésimas; solo informativo al aprobar |
| `anulado_por`, `anulado_en`, `motivo_anulacion` | text? | |

Índice por `(estado, hora_registro)`.

```text
pendiente ──aprobar──▶ aprobado ──anular──▶ anulado
    │
    └──rechazar──▶ rechazado
```

Efectos: `aprobado` → stock − 1 (INV-02 incluye los aprobados vigentes); `anulado` → stock + 1. Ningún estado genera movimientos ni cambia el coste medio.

## `economia.aportacion` (RF-199, RF-200)

Sin cambios de esquema. `usuario_id` es la persona beneficiaria y `registrada_por` quien la registró; ya existen desde F4.

## `usuarios.usuario`

Columna nueva `foto_ruta` text? (nombre del archivo en `/data/fotos/usuarios/`).

## `usuarios.preferencia_cuenta` (RF-204, RF-206, RF-207)

| Columna | Tipo | Reglas |
| --- | --- | --- |
| `usuario_id` | text → `usuario.id` | PK compuesta |
| `clave` | text | PK compuesta; `CHECK IN ('tour_inicio_visto','instalacion_descartada','oferta_avisos_vista')` |
| `valor_en` | text | instante en que se marcó |

## `notificaciones` (RF-192, RF-200)

Tipos nuevos en `TIPOS_NOTIFICACION`: `cafe_visitante_pendiente` (solo administradores, desactivable) y `aportacion_en_tu_nombre` (desactivable). Los datos del aviso no contienen el nombre del visitante: la pantalla lo lee al mostrarse.

## Datos derivados de lectura

- `EstadisticasDeConsumo` añade `visitantes`, `porMes[].visitantes` y `porPersona[]`.
- `EvolucionHucha`: `{ mes: Mes; saldo: number }[]`, saldo al cierre de cada mes en céntimos.
- `FilaSaldo` añade `totalAportado` (céntimos).
