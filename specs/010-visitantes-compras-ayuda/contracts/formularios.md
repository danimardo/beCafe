# Contratos de formularios y rutas: F10

Todas las entradas se validan con `z.strictObject` en `lib/shared/contratos/` (constitución VI). Los rechazos usan `fallo(estado, errorZod, datos)` y los códigos del conjunto cerrado.

## Visitantes

| Ruta | Acción | Campos | Resultado |
| --- | --- | --- | --- |
| `/visitantes` | `crear` | — | `{ enlace: { id, url, qrSvg, expiraEn } }` |
| `/visitantes` | `revocar` | `enlaceId` (ULID) | 303 a `/visitantes`; `SIN_PERMISO` si no es el creador ni administrador |
| `/visita/[token]` | `entrar` | `nombre` (1–60), `privacidad=si` | Cookie y 303 a `/visita`; `ENLACE_NO_VALIDO` (410) si caducado o revocado |
| `/visita` | `registrar` | `clienteId` (ULID), `tipoCapsulaId` (ULID), `horaGesto` | `{ cafe: { id, estado: 'pendiente' } }`; `LIMITE_SUPERADO` (429), `TIPO_NO_DISPONIBLE` (409) |
| `/admin/visitantes` | `revisar` | `ids[]` (1–100 ULID), `decision` (`aprobar`/`rechazar`) | `{ aprobados, rechazados, yaRevisados }` |
| `/admin/visitantes` | `anular` | `id`, `motivo` (1–200) | 303; `NO_ANULABLE` (409) |
| `/admin/visitantes` | `eliminarNombre` | `visitaId`, `confirmar=si` | 303 |

## Compras (RF-197, RF-198)

`/compras` acción `registrar`, compatible con el formato actual:

| Campo | Regla |
| --- | --- |
| `clienteId` | ULID |
| `tipoCapsulaId[]`, `cantidad[]`, `importe[]` | listas paralelas; las líneas con cantidad 0 se descartan; ≥ 1 línea |
| `fotoTicket` | opcional, RF-005 |
| `confirmarHuchaNegativa` | `si` opcional |
| `saldoConfirmado` | entero en céntimos, obligatorio si `confirmarHuchaNegativa=si` |

Respuesta de confirmación pendiente: `fail(409, { confirmacion: { saldo, importe, resultado }, valores })`. `valores` no incluye el archivo.

## Aportaciones (RF-199, RN-087)

`/saldos` acción `aportar`: `clienteId`, `importe`, `beneficiarioId` (ULID opcional). Un miembro que envía `beneficiarioId` distinto del suyo recibe `SIN_PERMISO` (403).

## Estadísticas (RF-201)

`/estadisticas` `GET` con `periodo` ∈ `mes | ultimos3 | ultimos12 | anio | todo`, `mes` y `anio` opcionales (`<form method="get">`).

## Marcas de cuenta

Acciones en el layout `(app)` o en Inicio/Perfil: `tourVisto`, `descartarInstalacion`, `ofertaAvisosVista`. Sin campos; idempotentes.

## Fotos de persona (RF-208)

| Ruta | Acción | Campos |
| --- | --- | --- |
| `/perfil` | `foto` | `foto` (archivo, RF-005) o `quitar=si` |
| `/admin/usuarios/[usuarioId]` | `foto` | igual, con permiso de administrador |
| `/fotos/usuarios/[usuarioId=ulid]` | `GET` | sesión de miembro; 404 sin foto; `Cache-Control: private, max-age=300` |

## API de la cola sin conexión

`/api/consumos` no cambia (constitución XIV). Los visitantes no usan la cola.
