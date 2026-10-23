# Modelo de datos: Operación (F7)

**Plan**: [plan.md](plan.md). Migración `NNNN_f7-operacion.sql` (siguiente número libre). Dueño: `copias`. Identificadores ULID; instantes en UTC ISO 8601.

## `copia_seguridad`

| Columna | Tipo | Reglas |
| --- | --- | --- |
| `id` | texto ULID | Clave primaria |
| `iniciada_en` | texto | Instante |
| `finalizada_en` | texto, nulo | Instante |
| `estado` | texto | `en_curso`, `correcta`, `fallida`; `CHECK` |
| `tamano` | entero, nulo | Bytes del `.tar.gz` |
| `sha256` | texto, nulo | Del `.tar.gz` |
| `clave_objeto` | texto, nulo | Ruta en el bucket, sin el endpoint ni credenciales |
| `codigo_error` | texto, nulo | `S3_CREDENCIALES`, `S3_RED`, `S3_RESPUESTA`, `INSTANTANEA`, `DISCO`, `INTERRUMPIDA` |
| `estado_http` | entero, nulo | Solo en fallos de S3 |

`CHECK`: `correcta` exige `tamano`, `sha256` y `clave_objeto`; `fallida` exige `codigo_error`. Índice `(iniciada_en)`.

## `prueba_restauracion`

| Columna | Tipo | Reglas |
| --- | --- | --- |
| `id` | texto ULID | Clave primaria |
| `admin_id` | texto | FK `usuario` |
| `realizada_el` | texto `AAAA-MM-DD` | Fecha de Madrid; no futura (Clarifications 3) |
| `resultado` | texto | `correcta` o `fallida` |
| `notas` | texto, nulo | Hasta 500 caracteres |
| `anotada_en` | texto | Instante |

## `configuracion` (F1, sin cambio de tabla)

Cambian solo los esquemas de valor (D7): `plazo_autoanulacion_min` 1–1440; `limite_deuda_centimos` −10 000 a −100; `intervalo_rellenos_min` 0–1440.

## Contenido del archivo de copia

```text
becafe-<instante>.tar.gz
├─ becafe.db      instantánea de VACUUM INTO
└─ fotos/         copia del directorio de fotos
```

No contiene `logs/`, `tmp/` ni los archivos `-wal` y `-shm`.
