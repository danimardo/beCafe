# Modelo de datos: Economía (F4)

**Plan**: [plan.md](plan.md) (decisiones D1 a D16). Migración: `drizzle/0002_f4-economia.sql` (solo añade tablas e índices). Todas las tablas tienen dueño `economia` (`ARCHITECTURE.md` §3), salvo `sesion_cerrada_por_baja`, de `auth`.

**Convenciones**: claves ULID de texto; instantes UTC ISO 8601; importes en céntimos (`INTEGER`); coste medio en diezmilésimas (`INTEGER`). `usuario_id` y los campos de autor referencian `usuario.id` (tabla exportada por `usuarios` para las claves externas). `tipo_capsula_id` no tiene clave externa, como en F2: `catalogo` no exporta su tabla.

**Campos de anulación** (se repiten en `consumo`, `aportacion`, `compra`, `arqueo` y `linea_recuento`): `estado` (`vigente` o `anulado`), `anulado_por`, `anulado_en`, `motivo_anulacion`.
`CHECK ((estado = 'vigente' AND anulado_por IS NULL AND anulado_en IS NULL AND motivo_anulacion IS NULL) OR (estado = 'anulado' AND anulado_por IS NOT NULL AND anulado_en IS NOT NULL AND motivo_anulacion IS NOT NULL))`.

## Tablas

### `aportacion`

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | TEXT (ULID) | Clave primaria |
| `cliente_id` | TEXT (ULID) | `UNIQUE` (RF-046) |
| `usuario_id` | TEXT | Persona a cuyo nombre se registra |
| `registrada_por` | TEXT | Autor real. Igual que `usuario_id`, salvo el pago de una baja (RN-017) |
| `importe` | INTEGER | `CHECK (importe > 0 AND (importe <= 50000 OR origen = 'baja'))`: máximo de 500 € (RF-032), salvo el pago de una baja, que salda la deuda completa |
| `origen` | TEXT | `directa` o `baja` |
| `registrada_en` | TEXT | Instante del servidor |
| Campos de anulación | — | Ver arriba |

### `compra` y `linea_compra`

| Columna (`compra`) | Tipo | Regla |
| --- | --- | --- |
| `id` | TEXT | Clave primaria |
| `cliente_id` | TEXT | `UNIQUE` |
| `usuario_id` | TEXT | Autor (RF-042) |
| `importe_total` | INTEGER | `> 0`; suma de las líneas (RN-037), comprobada en el caso de uso |
| `foto_ticket_ruta` | TEXT, nulo | Nombre del fichero WebP en `fotos/` |
| `hucha_negativa_confirmada` | INTEGER (0/1) | 1 si se confirmó RN-019 |
| `registrada_en` | TEXT | — |
| Campos de anulación | — | — |

| Columna (`linea_compra`) | Tipo | Regla |
| --- | --- | --- |
| `id` | TEXT | Clave primaria |
| `compra_id` | TEXT | Clave externa a `compra.id`; índice |
| `tipo_capsula_id` | TEXT | Índice (para `hayRegistrosDeTipo` y la reconstrucción) |
| `cantidad` | INTEGER | `CHECK (cantidad > 0)` |
| `importe` | INTEGER | `CHECK (importe > 0)` |

Una compra tiene una línea por tipo como máximo: `UNIQUE (compra_id, tipo_capsula_id)`.

### `consumo` (creada en F4, D3)

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | TEXT | Clave primaria |
| `cliente_id` | TEXT | `UNIQUE` (RF-016, INV-04) |
| `usuario_id` | TEXT | Quien consume y paga (RN-001) |
| `tipo_capsula_id` | TEXT | Índice `(tipo_capsula_id, hora_registro)` |
| `invitado` | INTEGER (0/1) | — |
| `precio_aplicado` | INTEGER | Céntimos (RN-021); `>= 0` |
| `coste_medio_aplicado` | INTEGER | Diezmilésimas vigentes al registrar (RN-002); para la regularización |
| `hora_gesto` | TEXT | Hora del toque en el móvil |
| `hora_registro` | TEXT | Hora de recepción en el servidor (RN-002) |
| Campos de anulación | — | — |

F3 escribe esta tabla. F4 la lee y la prepara en las pruebas.

### `movimiento` (D1)

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | TEXT | Clave primaria |
| `cuenta` | TEXT | `persona` o `hucha` |
| `usuario_id` | TEXT, nulo | `CHECK ((cuenta = 'persona') = (usuario_id IS NOT NULL))` |
| `tipo` | TEXT | Uno de los 12 tipos de D1; `CHECK` con la lista |
| `importe` | INTEGER | Con signo; `CHECK (importe <> 0)` |
| `origen_tipo` | TEXT | `aportacion`, `compra`, `consumo`, `arqueo`, `linea_recuento`, `reparto`, `regularizacion`, `baja` |
| `origen_id` | TEXT | — |
| `creado_en` | TEXT | — |
| `vigente` | INTEGER (0/1) | Pasa de 1 a 0 solo con la anulación de su origen |

Índices: `(usuario_id, vigente)`, `(cuenta, vigente)`, `(origen_tipo, origen_id)`.

### `reparto` (D4)

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | TEXT | Clave primaria |
| `origen_tipo` | TEXT | `arqueo`, `linea_recuento` o `baja` |
| `origen_id` | TEXT | Índice |
| `importe` | INTEGER | Con signo; `<> 0` |
| `miembros` | INTEGER | `> 0` |
| `creado_en` | TEXT | — |

Sus movimientos tienen `origen_tipo = 'reparto'` y `origen_id = reparto.id`. INV-01: la suma de esos movimientos es `importe`.

### `regularizacion` (D7)

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | TEXT | Clave primaria |
| `compra_id` | TEXT | Compra anulada que la origina; índice |
| `consumo_id` | TEXT | Consumo afectado |
| `usuario_id` | TEXT | Persona regularizada |
| `importe` | INTEGER | Precio aplicado − precio debido; `<> 0` |
| `creada_en` | TEXT | — |

`UNIQUE (compra_id, consumo_id)`: una compra anulada regulariza cada consumo una sola vez.

### `arqueo`

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | TEXT | Clave primaria |
| `admin_id` | TEXT | — |
| `realizado_en` | TEXT | Índice |
| `saldo_teorico` | INTEGER | — |
| `contado` | INTEGER | `>= 0` |
| `diferencia` | INTEGER | `CHECK (diferencia = contado - saldo_teorico)` |
| Campos de anulación | — | — |

### `recuento` y `linea_recuento`

| Columna (`recuento`) | Tipo | Regla |
| --- | --- | --- |
| `id` | TEXT | Clave primaria |
| `admin_id` | TEXT | — |
| `realizado_en` | TEXT | — |

| Columna (`linea_recuento`) | Tipo | Regla |
| --- | --- | --- |
| `id` | TEXT | Clave primaria |
| `recuento_id` | TEXT | Clave externa a `recuento.id` |
| `tipo_capsula_id` | TEXT | Índice `(tipo_capsula_id, estado)` |
| `registrado` | INTEGER | Stock guardado al contar |
| `contado` | INTEGER | `>= 0` |
| `diferencia` | INTEGER | `CHECK (diferencia = contado - registrado)` |
| `coste_medio_aplicado` | INTEGER, nulo | Diezmilésimas; nulo si el tipo no tiene coste (Clarifications 6) |
| Campos de anulación | — | Anulación por tipo (RN-036, D8) |

`UNIQUE (recuento_id, tipo_capsula_id)`.

### `aviso_economia` (D9)

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | TEXT | Clave primaria |
| `tipo` | TEXT | `hucha_negativa` (F4) o `stock_negativo` (F3) |
| `origen_tipo` | TEXT | `compra`, `baja` o `consumo` |
| `origen_id` | TEXT | — |
| `registrado_en` | TEXT | — |

F5 entrega estos avisos a los administradores. No se borran.

### `sesion_cerrada_por_baja` (módulo `auth`, D11)

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id_hash` | TEXT | Clave primaria; hash de la sesión borrada por la baja |
| `usuario_id` | TEXT | Índice |
| `cerrada_en` | TEXT | — |

`reactivarPersona` borra las filas de la persona. No guarda el token, solo su hash (como `sesion`).

## Relaciones

- `compra` 1 — N `linea_compra`; `recuento` 1 — N `linea_recuento`.
- Cada registro económico 1 — N `movimiento` (por `origen_tipo`, `origen_id`).
- `reparto` 1 — N `movimiento`; `arqueo`, `linea_recuento` y la baja 1 — 0..1 `reparto`.
- `compra` (anulada) 1 — N `regularizacion` 1 — 1 `movimiento`.
- `existencia` (F2) se actualiza con compras, consumos (F3), recuentos y sus anulaciones.

## Transiciones

**Registro económico** (`aportacion`, `compra`, `consumo`, `arqueo`, `linea_recuento`)

```text
vigente ──anular (autor en plazo | admin; D6, D8)──▶ anulado
anulado ──cualquier acción──▶ prohibido (YA_ANULADO, INV-05)
```

**Movimiento**: `vigente = 1 ──anulación del origen──▶ vigente = 0`. Nunca vuelve a 1.

**Usuario** (F1 + F4): `activo ──darDeBaja (saldo liquidado a 0, no último admin)──▶ baja`.

## Invariantes

| ID | Enunciado | Mecanismo | Prueba |
| --- | --- | --- | --- |
| INV-01 | La suma de un reparto es su importe | `dominio/repartos.ts`; una transacción | Propiedades (EV-020) + integración |
| INV-02 | `existencia.stock` y `coste_medio` coinciden con `reconstruir` | Actualización incremental en la transacción; comprobación al anular compras | Propiedades (EV-030) |
| INV-03 | Siempre hay un administrador activo | Recuento dentro de `BEGIN IMMEDIATE` en `usuarios.marcarBaja` y `cambiarRol` | Integración + concurrencia (EV-040) |
| INV-05 | Un registro anulado no vuelve a estar vigente | `UPDATE … WHERE estado = 'vigente'`; `CHECK` de campos de anulación | Integración + concurrencia (EV-011) |
| INV-06 | Tras la baja, el saldo es 0 | Comprobación al final de `darDeBaja`; D16-3 | Integración |
| RNF-010 | Sin efectos parciales | Una transacción por registro | Integración con fallo provocado |

## Datos de prueba

- Constructores en `economia/pruebas/constructores.ts`: compra con líneas, consumo preparado (con `precio_aplicado` y `coste_medio_aplicado`), aportación, miembros activos.
- Azar fijo (`plataforma/azar.ts`) y reloj fijo para repartos y plazos.
