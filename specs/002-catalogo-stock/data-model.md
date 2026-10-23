# Modelo de datos: Catálogo y stock (F2)

**Plan**: [plan.md](plan.md) (decisiones D1 a D9). Migración: `drizzle/0001_f2-catalogo-stock.sql` (solo añade tablas).

## Tablas

### `tipo_capsula` (módulo `catalogo`)

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | TEXT (ULID) | Clave primaria |
| `nombre` | TEXT | 1 a 60 caracteres; sin espacios sobrantes |
| `nombre_normalizado` | TEXT | Nombre en minúsculas, sin espacios sobrantes |
| `marca` | TEXT | 1 a 60 caracteres |
| `intensidad` | INTEGER, nulo | `CHECK (intensidad IS NULL OR intensidad BETWEEN 1 AND 13)` |
| `color` | TEXT | Uno de la paleta `cap-*` |
| `foto_ruta` | TEXT, nulo | Nombre del fichero WebP en `fotos/` |
| `estado` | TEXT | `activo` o `retirado`; `CHECK (estado IN ('activo','retirado'))` |
| `creado_en` / `actualizado_en` | TEXT (ISO 8601 UTC) | — |

**Índice único parcial:** `UNIQUE (nombre_normalizado) WHERE estado = 'activo'` (D7, RF-002).

### `existencia` (módulo `economia`)

| Columna | Tipo | Regla |
| --- | --- | --- |
| `tipo_capsula_id` | TEXT | Clave primaria; referencia a `tipo_capsula.id` |
| `umbral_minimo` | INTEGER | Obligatorio; `CHECK (umbral_minimo >= 0)` |
| `stock` | INTEGER | Entero; sin `CHECK` de signo (puede ser negativo, RN-070) |
| `coste_medio` | INTEGER, nulo | Diezmilésimas de euro (RN-020); nulo si nunca se compró |
| `en_stock_bajo` | INTEGER | 0 o 1; derivado de `stock` y `umbral_minimo` (INV-02) |

**Creación:** cada alta de `tipo_capsula` crea su fila en la misma transacción, con stock 0, coste medio nulo y umbral del formulario (D2).

### `entrada_stock_bajo` (módulo `economia`)

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | TEXT (ULID) | Clave primaria |
| `tipo_capsula_id` | TEXT | Referencia a `tipo_capsula.id` |
| `registrada_en` | TEXT (ISO 8601 UTC) | Instante de la transición |

Una fila por transición de «no» a «sí» (D4). No se borra ni se modifica.

## Relaciones

- `tipo_capsula` 1 — 1 `existencia`.
- `tipo_capsula` 1 — N `entrada_stock_bajo`.
- Los registros futuros de consumos y compras (F3, F4) referencian `tipo_capsula`. El borrado se rechaza si existen (D8).

## Transiciones

**Tipo de cápsula (`estado`)**

```text
activo ──retirar──▶ retirado
retirado ──reactivar──▶ activo   (rechazado con NOMBRE_DUPLICADO si otro activo tiene el mismo nombre)
retirado | activo ──borrar──▶ (eliminado)   solo sin registros (D8)
```

**Stock bajo (`en_stock_bajo`)**

```text
0 ──(stock <= umbral tras la variación)──▶ 1   → inserta entrada_stock_bajo
1 ──(stock > umbral)──▶ 0
1 ──(sigue <= umbral)──▶ 1                     → no inserta nada
```

## Invariantes

| ID | Enunciado | Mecanismo | Prueba |
| --- | --- | --- | --- |
| INV-02 | `en_stock_bajo` coincide con `estaEnStockBajo(stock, umbral)` | Recálculo en la transacción | Integración: comparación tras cada cambio; prueba que intenta violarla (cambiar umbral sin recalcular) |
| RF-002 | Un solo tipo activo por nombre normalizado | Índice único parcial | Integración: alta duplicada, alta simultánea con `worker_threads` |
| RN-071 | Stock bajo si `stock <= umbral` | `dominio/stock.ts` | Unidad (umbral 10: stock 11, 10 y negativo; umbral 0) |
| RN-072 | Una entrada por transición | Inserción solo en la transición | Integración (CA-023) |
| RF-006 | Sin borrado con registros | `hayRegistrosDeTipo` (D8) | Integración; la parte con registro se repite en F3 |
| Integridad de la foto | Un registro con `foto_ruta` tiene su fichero | Escritura del fichero antes de la transacción y borrado si falla | Integración con directorio temporal |

## Datos de prueba

- Constructores en `catalogo/pruebas/constructores.ts` y `economia/pruebas/constructores.ts`.
- Reloj fijo (`reloj` de `plataforma`) para las fechas.
- Estado de stock preparado directamente en `existencia` para CA-020 y CA-023 hasta que existan F3 y F4.
