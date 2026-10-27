# Data Model: F15

## Tabla nueva `mensaje_dia` (módulo `usuarios`, migración `0009_f15-mensaje-dia.sql`)

| Columna | Tipo | Reglas |
| --- | --- | --- |
| `usuario_id` | text | FK `usuario.id`, no nulo |
| `dia` | text | `FechaMadrid` (`AAAA-MM-DD`), no nulo |
| `mensaje_id` | text | Id del catálogo `MENSAJES_DIA` (`dia_NN`), no nulo |
| `vuelta` | integer | ≥ 1, no nulo |
| `asignado_en` | text | `InstanteUtc`, no nulo |

- Clave primaria `(usuario_id, dia)`: un mensaje por persona y día (RN-091).
- Índice `(usuario_id, vuelta)` para leer los vistos de la vuelta actual.
- `CHECK (vuelta >= 1)` y `CHECK (length(dia) = 10)`.
- Al abrir una vuelta nueva se borran las filas de vueltas anteriores a la previa (como `frase_entregada`). Los datos se conservan mientras la persona exista. La baja no los borra, como RN-046.
- Al restaurar una copia (F14), la tabla viaja con la base.

## `tipo_capsula.color` (módulo `catalogo`, sin migración)

| Valor | Significado |
| --- | --- |
| `cap-ristretto`, `cap-lungo`, `cap-decaf`, `cap-colombia`, `cap-vainilla`, `cap-azul`, `cap-intenso` | Colores fijos elegibles |
| `cap-rosa` | Color heredado: se conserva y no se puede elegir de nuevo (RF-269) |
| `#rrggbb` (minúsculas) | Color propio (RF-271) |

Un valor leído que no encaja en ninguno de los tres se registra según XVI (`dato.no_valido`, origen `tipo_capsula.color`) y se pinta con `cap-intenso`.

## Zona de encuadre (no se guarda)

| Campo | Rango | Unidad |
| --- | --- | --- |
| `encuadreX` | 0–1 | Fracción del ancho de la foto orientada |
| `encuadreY` | 0–1 | Fracción del alto de la foto orientada |
| `encuadreLado` | > 0–1 | Fracción del lado menor de la foto orientada |

Se envían los tres o ninguno. El servidor comprueba que `x·ancho + lado·min ≤ ancho + 1` y `y·alto + lado·min ≤ alto + 1`.
