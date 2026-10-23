# Modelo de datos: Saldos y estadísticas (F6)

**Plan**: [plan.md](plan.md). F6 no crea tablas. Lee las de F3 y F4. Puede añadir la migración `0003` solo con índices si la medición de D9 lo exige.

## Consultas (API pública de `economia`)

| Función | Devuelve | Filtros | Permiso |
| --- | --- | --- | --- |
| `leerSaldos(actor)` | Hucha; por persona activa: id, nombre, saldo (céntimos), `esPropia` | — | Miembro |
| `leerHistorial(actor, filtros)` | Página de entradas `{ tipo, id, fecha, autor, importe, estado, anulacion? }` y total | `quien`, `tipo`, `anulados`, `pagina` | Miembro; consumos ajenos solo administradores |
| `leerMovimientosPropios(actor, filtros)` | Página de movimientos `{ id, tipo, importe, origenTipo, origenId, fecha, vigente }` | `anulados`, `pagina` | La propia persona |
| `leerRegistroDeControl(actor, id)` | Arqueo o línea de recuento con su reparto y anulación | — | Miembro |
| `contarConsumos(db, { desde, hasta, usuarioId? })` | Filas `{ tipoCapsulaId, horaGesto, invitado, precioAplicado }` de consumos vigentes | Intervalo UTC | Interna: la llama `estadisticas`, que comprueba el permiso |

## Composición en `estadisticas`

| Función | Devuelve |
| --- | --- |
| `leerPersonales(actor, usuarioId, periodo)` | KPI (cafés, invitados, gastado), serie por mes con ceros, reparto por tipo |
| `leerEquipo(actor, periodo)` | KPI (miembros, invitados), serie por mes con ceros, reparto por tipo, invitados aparte |

**Entrada de la consulta** (`z.strictObject`): `periodo` (`mes` | `anio` | `todo`, por defecto `mes`), `mes` (`Mes`, opcional), `anio` (entero de 2026 en adelante, opcional).

## Entrada del historial

| Tipo | Origen | Importe mostrado | Visible en «Todo» |
| --- | --- | --- | --- |
| `aportacion` | `aportacion` | `+importe` | Sí |
| `compra` | `compra` | `−importe_total` | Sí |
| `arqueo` | `arqueo` | `diferencia` | Sí |
| `recuento` | `linea_recuento` | Valor del faltante (o 0) | Sí |
| `reparto` | `reparto` | `importe` | Sí |
| `regularizacion` | `regularizacion` | `importe` | Sí |
| `consumo` | `consumo` | `−precio_aplicado` | Solo administradores (D10-1) |

## Índices candidatos (solo si D9 lo exige)

- `consumo (hora_gesto)`, `consumo (usuario_id, hora_gesto)`.
- `aportacion (registrada_en)`, `compra (registrada_en)`.
