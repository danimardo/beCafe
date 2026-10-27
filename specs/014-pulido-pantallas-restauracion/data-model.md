# Data Model: F14

Sin migraciones ni tablas nuevas.

## Copia del bucket (leída, no guardada)

| Campo | Tipo | Regla |
| --- | --- | --- |
| `clave` | texto | Empieza por `becafe/` y termina en `.tar.gz` |
| `tamano` | entero ≥ 0 | Bytes |
| `modificadaEn` | `InstanteUtc` | `LastModified` de S3 |
| `resguardo` | booleano | La clave empieza por `becafe/resguardos/` |

## Restauración pendiente (`/data/restauracion/pendiente.json`)

Se valida con `z.strictObject` al leerla en el arranque. Si no supera el esquema, no se aplica nada.

| Campo | Tipo |
| --- | --- |
| `clave` | clave de la copia restaurada |
| `resguardo` | clave de la copia de resguardo |
| `adminId` | ULID del administrador |
| `instante` | `InstanteUtc` de la confirmación |

Estados: no existe → preparada (existe junto a `preparada/`) → aplicada (se borra al arrancar y queda la auditoría).

## Auditoría (`registro_auditoria`, existente)

`accion = 'copia.restaurada'`, `objetoTipo = 'copia'`, `objetoId = clave`, `actorId = adminId` si existe en la base restaurada (si no, `null`), `detalle` con la clave del resguardo y el instante de la confirmación.

## Tipo comprable (lectura de Compras)

Gana `stock: number` y `stockBajo: boolean` (RF-218).
