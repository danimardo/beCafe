# Contratos de rutas: Economía (F4)

Todas las rutas exigen sesión. Cada `load` y cada *action* llaman a un caso de uso de `economia` que comprueba el permiso (RNF-007). Todas entran en la suite `acceso` (EV-050) y en `a11y` en claro y oscuro. Los textos están en `lib/shared/textos.ts`.

**Estados comunes**: cargando (esqueleto de `Skeleton`), error («No se ha podido cargar. Vuelve a intentarlo.»), sin conexión («Necesitas conexión para registrar aportaciones, compras y operaciones de administración», EXC-007).

## `/` (panel de avisos, amplía F2)

| Elemento | Dato | Vacío |
| --- | --- | --- |
| Stock bajo | `leerAvisosStock` (F2) | Sin sección |
| Hucha | `leerSaldoHucha(actor)`; negativa con signo «−» y texto «La hucha está en negativo» | Siempre visible |
| Deudores | `leerPersonasBajoLimite(actor)`: nombre y saldo de quien tiene `saldo < límite` | Sin sección |

## `/saldos`

- `load`: `leerSaldoPropio(actor)`, `leerSaldoHucha(actor)`, `leerAportacionesPropias(actor, 10)`, `clienteId` nuevo.
- *Action* `aportar`: `esquemaAportacion` (`clienteId` ULID, `importe` texto → céntimos, `> 0` y `<= 500 €`). Éxito: mensaje «Aportación registrada» anunciado y saldo nuevo. Error: campo `importe`.
- Vacío: «Todavía no has registrado aportaciones».

## `/saldos/aportaciones/[aportacionId=ulid]`

- `load`: `leerAportacion(actor, id)`; 404 si no existe.
- *Action* `anular`: `esquemaAnulacion` (`motivo` 1–200). Errores: `FUERA_DE_PLAZO`, `SIN_PERMISO` («Pídelo a un administrador»), `YA_ANULADO`, `ESTADO_INCORRECTO` (persona dada de baja, D16-3).

## `/compras`

- `load`: `leerComprasRecientes(actor, 20)`, `leerTiposComprables(actor)` (activos), `leerSaldoHucha(actor)`, `clienteId`.
- *Action* `registrar` (multipart): `esquemaCompra` (`clienteId`; `lineas` como lista normalizada de `{tipoCapsulaId, cantidad (> 0), importe (> 0)}`; `foto` opcional ≤ 5 MB; `confirmoHuchaNegativa` opcional). Éxito: redirección 303 a `/compras/[id]` con confirmación. Errores: por línea (`lineas.N.cantidad`), `TIPO_NO_DISPONIBLE`, `FOTO_NO_VALIDA`, `CONFIRMACION_REQUERIDA` (devuelve `saldoTeorico` y muestra «La hucha debería tener X €» con el botón «Registrar igualmente»).
- *Actions* `anadirLinea` y `quitarLinea`: sin JavaScript, devuelven los valores con una línea más o menos.
- Con una línea: un solo campo de importe. Con varias: total calculado visible (CA-040).
- Vacío: «Todavía no hay compras».

## `/compras/[compraId=ulid]`

- `load`: `leerCompra(actor, id)` con líneas, autor, foto y estado; 404 si no existe.
- *Action* `anular`: `motivo`. Éxito: resumen de regularizaciones agrupado por persona (`RegularizationSummary`, RF-045). Errores como en las aportaciones.

## `/admin/control` (administrador)

- `load`: `leerControl(actor)`: saldo teórico, tipos con stock y coste, último arqueo vigente, última línea de recuento vigente por tipo, `necesitaReautenticacion`.
- *Actions*:
  - `previsualizarArqueo` (`contado` → céntimos `>= 0`): devuelve teórico, diferencia, personas y parte mínima y máxima.
  - `confirmarArqueo` (`contado`, `saldoTeoricoPrevisto`, `contrasenaActual` si hace falta): `CAMBIO_CONCURRENTE` si el teórico cambió.
  - `previsualizarRecuento` (lista `{tipoCapsulaId, contado >= 0}`): devuelve por tipo registrado, diferencia, valor del faltante y reparto.
  - `confirmarRecuento` (lista + `registradoPrevisto` por tipo + `contrasenaActual`).
  - `anularArqueo` y `anularRecuento` (`id`, `motivo`, `contrasenaActual`): `NO_ES_EL_ULTIMO`, `YA_ANULADO`.
- Errores de reautenticación: `REAUTENTICACION_REQUERIDA` muestra el campo de contraseña; `CREDENCIALES_INCORRECTAS` en ese campo.
- Vacío: «Todavía no hay arqueos» / «Todavía no hay recuentos».

## `/admin/usuarios/[usuarioId=ulid]/baja` (administrador)

- `load`: `leerLiquidacion(actor, usuarioId)`: saldo, modos posibles según el signo, saldo teórico, `necesitaReautenticacion`. 404 si no existe; `ESTADO_INCORRECTO` si ya está de baja.
- *Actions*: `previsualizar` (`modo`) devuelve el efecto (importe, reparto previsto, hucha resultante); `confirmar` (`modo`, `saldoPrevisto`, `confirmoHuchaNegativa`, `contrasenaActual`). Éxito: redirección a `/admin/usuarios/[usuarioId]` con «Baja registrada».
- Errores: `ULTIMO_ADMIN`, `CAMBIO_CONCURRENTE`, `CONFIRMACION_REQUERIDA`, `REAUTENTICACION_REQUERIDA`.

## `/fotos/compras/[compraId=ulid]` (`+server.ts`, GET)

- Sesión comprobada en `leerFotoTicket(actor, id)`. 404 sin foto. `image/webp`, `cache-control: private, max-age=3600`.

## Esquemas (`lib/shared/contratos/economia.ts`)

| Esquema | Campos |
| --- | --- |
| `esquemaImporte` | Texto con `parseMoney` → céntimos enteros; rechaza más de dos decimales y no numéricos (RN-020) |
| `esquemaAportacion` | `clienteId`, `importe` (1 a 50 000 céntimos) |
| `esquemaLineaCompra` | `tipoCapsulaId`, `cantidad` (`z.coerce.number().int().positive()`), `importe` |
| `esquemaCompra` | `clienteId`, `lineas` (1 o más), `foto`, `confirmoHuchaNegativa` |
| `esquemaAnulacion` | `motivo` (1–200, sin espacios sobrantes) |
| `esquemaArqueo` | `contado` (`>= 0`), `saldoTeoricoPrevisto`, `contrasenaActual` (secreto) |
| `esquemaRecuento` | `lineas` de `{tipoCapsulaId, contado}`, `registradoPrevisto`, `contrasenaActual` |
| `esquemaBaja` | `modo` (`ninguna`, `pago`, `devolucion`, `incobrable`), `saldoPrevisto`, `confirmoHuchaNegativa`, `contrasenaActual` |

`contrasenaActual` y `foto` se marcan como secretos: `fallo()` no los copia a `valores`.
