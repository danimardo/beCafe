# Modelo de datos: Consumos (F3)

**Plan**: [plan.md](plan.md). F3 no tiene migración: usa las tablas que crea F4 (`specs/003-economia/data-model.md`).

## Tablas del servidor que usa F3

| Tabla | Dueño | Uso en F3 |
| --- | --- | --- |
| `consumo` | `economia` (F4) | Escribe: registro, «Deshacer» y anulación |
| `movimiento` | `economia` (F4) | Escribe `cargo_consumo`; lo marca `vigente = 0` al anular |
| `existencia` | `economia` (F2) | `stock -= 1` al registrar; `stock += 1` al anular (RN-013); el coste medio no cambia |
| `entrada_stock_bajo` | `economia` (F2) | Una fila al entrar en stock bajo (RN-072) |
| `aviso_economia` | `economia` (F4) | `tipo = 'stock_negativo'` si el stock previo era `≤ 0` (RF-017) |
| `sesion_cerrada_por_baja` | `auth` (F4) | Lectura para responder `USUARIO_DE_BAJA` (D9) |

**Anulación por «Deshacer»**: `motivo_anulacion = 'Deshecho por el autor'`, `anulado_por = usuario_id` (RN-031).

## Transiciones del consumo

```text
(toque) ──registrarConsumo──▶ vigente
vigente ──deshacer (autor, en plazo)──▶ anulado («Deshecho por el autor»)
vigente ──anular (autor en plazo | admin; motivo)──▶ anulado
anulado ──cualquier acción──▶ prohibido (YA_ANULADO)
```

## Cola local (IndexedDB, solo en el navegador)

Base de datos `becafe`, almacén `consumos-pendientes`, clave `clienteId`.

| Campo | Tipo | Regla |
| --- | --- | --- |
| `version` | `1` | Versión del elemento y del contrato con que se envía |
| `clienteId` | ULID | Generado en el toque |
| `usuarioId` | ULID | Persona con sesión en el toque; solo se envía con esa sesión (Clarifications 4) |
| `tipoCapsulaId` | ULID | — |
| `invitado` | booleano | — |
| `horaGesto` | `InstanteUtc` | Hora del toque |
| `estado` | `pendiente` o `rechazado` | `rechazado` tras 400, 403 `USUARIO_DE_BAJA` o 409 `TIPO_SIN_COSTE` |
| `codigo` | texto, opcional | Código del rechazo |

Sin nombres, importes ni tokens (constitución V). El esquema está en `lib/shared/contratos/consumos.ts` y se valida al leer.

## Invariantes

| ID | Mecanismo en F3 | Prueba |
| --- | --- | --- |
| INV-04 | `cliente_id` único + búsqueda dentro de `BEGIN IMMEDIATE` | EV-010 con concurrencia |
| INV-05 | `UPDATE … WHERE estado = 'vigente'` | EV-011 con concurrencia |
| INV-06 | Estado de la persona comprobado en la transacción; 403 tras la baja | EV-041 |
| INV-02 | `stock` y `coste_medio` incrementales; `reconstruir` (F4) con consumos reales | EV-030 de F4 ampliado |
