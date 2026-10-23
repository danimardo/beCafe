# Modelo de datos: Relleno de agua y aguador del mes (F8)

**Plan**: [plan.md](plan.md). Migración `NNNN_f8-rellenos.sql` (siguiente número libre). Identificadores ULID; instantes en UTC ISO 8601. Dueño de las dos tablas: `rellenos`.

## `relleno_agua`

| Columna | Tipo | Reglas |
| --- | --- | --- |
| `id` | texto ULID | Clave primaria |
| `cliente_id` | texto ULID | Único (idempotencia) |
| `usuario_id` | texto | Autor; FK `usuario`. Siempre el actor (RN-080) |
| `registrado_en` | texto | Instante del servidor |
| `estado` | texto | `vigente` o `anulado`; `CHECK` |
| `anulado_por` | texto, nulo | FK `usuario` |
| `anulado_en` | texto, nulo | Instante |
| `motivo_anulacion` | texto, nulo | 1 a 200 caracteres; «Deshecho por el autor» en «Deshacer» |

`CHECK`: los tres campos de anulación son nulos si y solo si `estado = 'vigente'`. Índice `(estado, registrado_en)` (`historias.md` §10.4) y `(usuario_id, registrado_en)`.

**Transiciones:** `vigente → anulado`. Nunca al revés (`historias.md` §6, ciclo de vida).

**Invariante INV-07:** entre dos rellenos vigentes consecutivos, `registrado_en` difiere al menos en el intervalo vigente al registrar el segundo. La garantiza `registrarRelleno` dentro de `BEGIN IMMEDIATE`.

## `aguador_mes`

| Columna | Tipo | Reglas |
| --- | --- | --- |
| `mes` | texto `AAAA-MM` | Mes natural de Madrid |
| `usuario_id` | texto | FK `usuario` |
| `rellenos` | entero > 0 | Rellenos vigentes al determinarlo |
| `determinado_en` | texto | Instante |

Clave primaria `(mes, usuario_id)`. Varias filas por mes en caso de empate; ninguna si no hubo rellenos. No se actualiza ni se borra (Clarifications 1). La ejecución única la marca `ejecucion_tarea ('aguador_mes', mes)` de F5.

## Consultas públicas

| Función | Devuelve |
| --- | --- |
| `leerEstadoAgua(db, actor, ahora)` | Último relleno vigente (autor, instante, `esPropio`) y aguadores del mes anterior |
| `leerRellenos(db, actor, { quien, anulados, limite })` | Rellenos ordenados por fecha descendente, para el historial |
| `contarRellenos(db, { desde, hasta, usuarioId? })` | Filas `{ usuarioId, registradoEn }` vigentes, para el ranking y el KPI |
| `leerAguador(db, mes)` | Personas con el título de ese mes |
