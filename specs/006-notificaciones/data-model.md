# Modelo de datos: Notificaciones (F5)

**Plan**: [plan.md](plan.md). Migración `0004_f5-notificaciones.sql` (o `0003` si F6 no crea la suya). Identificadores ULID; instantes en UTC ISO 8601.

## `notificacion` (dueño `notificaciones`)

| Columna | Tipo | Reglas |
| --- | --- | --- |
| `id` | texto ULID | Clave primaria |
| `usuario_id` | texto | Destinatario; FK `usuario` |
| `tipo` | texto | Uno del catálogo (D1); `CHECK` |
| `datos` | texto JSON | Validado con el esquema del tipo al escribir y al leer |
| `origen_id` | texto, nulo | Id del registro que lo originó (`entrada_stock_bajo`, `aviso_economia`, consumo, compra…) |
| `creada_en` | texto | Instante |
| `vista_en` | texto, nulo | Instante en que la persona abrió el panel (D9) |

Índices: `(usuario_id, creada_en)`; `(usuario_id, tipo, creada_en)` para el último aviso de deuda.

## `entrega_push`

| Columna | Tipo | Reglas |
| --- | --- | --- |
| `id` | texto ULID | Clave primaria |
| `notificacion_id` | texto | FK `notificacion`, borrado en cascada |
| `suscripcion_id` | texto | FK `suscripcion_push`, borrado en cascada |
| `estado` | texto | `pendiente`, `enviada`, `agotada`, `caducada` |
| `intentos` | entero ≥ 0 | |
| `proximo_intento` | texto | Instante |
| `ultimo_codigo` | entero, nulo | Código HTTP del último intento |

Índice: `(estado, proximo_intento)`. Única: `(notificacion_id, suscripcion_id)`.

## `suscripcion_push`

| Columna | Tipo | Reglas |
| --- | --- | --- |
| `id` | texto ULID | Clave primaria |
| `usuario_id` | texto | FK `usuario` |
| `endpoint` | texto | Único. Nunca en el log |
| `clave_p256dh`, `clave_auth` | texto | Nunca en el log |
| `creada_en`, `actualizada_en` | texto | Instantes |

## `preferencia_notificacion`

| Columna | Tipo | Reglas |
| --- | --- | --- |
| `usuario_id` | texto | Clave primaria compuesta con `tipo` |
| `tipo` | texto | Tipo desactivable del catálogo (no `deuda`) |
| `activada` | entero 0/1 | Sin fila: activada (D14-1) |

## `ejecucion_tarea` (dueño `plataforma`, planificador)

| Columna | Tipo | Reglas |
| --- | --- | --- |
| `tarea` | texto | Nombre estable (`resumen_mensual`, `recordatorio_deuda`) |
| `periodo` | texto | `AAAA-MM` o `AAAA-MM-DD` de Madrid |
| `ejecutada_en` | texto | Instante |

Clave primaria `(tarea, periodo)`: impide la doble ejecución (Clarifications 2).

## Estados de una entrega

```text
pendiente ──2xx──▶ enviada
pendiente ──error, intentos < 5──▶ pendiente (proximo_intento + espera)
pendiente ──error, intentos = 5──▶ agotada
pendiente ──404/410──▶ (suscripción borrada, entrega borrada en cascada)
pendiente ──más de 24 h──▶ caducada
```

## Datos por tipo (esquemas en `notificaciones/catalogo.ts`)

| Tipo | Datos |
| --- | --- |
| `stock_bajo` | `tipoCapsulaId`, `nombreTipo`, `stock` |
| `stock_negativo` | `tipoCapsulaId`, `nombreTipo`, `stock` |
| `hucha_negativa` | `saldoHucha` (céntimos) |
| `deuda` | `saldo`, `limite` (céntimos) |
| `resumen_mensual` | `mes`, `cafes`, `invitados`, `saldo`, `aguadores?` (F8) |
| `fallo_copia` | `copiaId` |
