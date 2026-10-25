# Contratos de formularios y acciones: F11

Todas las entradas se validan con `z.strictObject` en `src/lib/shared/contratos/` (constitución VI). Los rechazos usan `fallo(estado, errorZod, valores)` o `falloDeNegocio(codigo, valores)`.

## Inicio `/` (`src/routes/(app)/+page.server.ts`)

### `?/consumir` (amplía F3)

| Campo | Esquema | Nuevo |
| --- | --- | --- |
| `tipoCapsulaId`, `clienteId`, `invitado`, `horaGesto` | como hoy | — |
| `sinStock` | `z.literal('1').optional()` — la tarjeta se cargó con stock ≤ 0 | sí |
| `confirmarSinStock` | `z.literal('si').optional()` | sí |
| `mascota` | `z.literal('si').optional()` — el dispositivo muestra a Capsulito | sí |

Respuestas:

- Éxito: `{ consumo: { id, tipoCapsulaId, invitado, precio, descuadre }, fraseId: string | null }`.
- `fail(409, { confirmarSinStock: { tipoCapsulaId, nombre, clienteId } })`: stock real ≤ 0, `sinStock=1` y sin `confirmarSinStock`. La página pinta la pregunta de RF-217 como paso intermedio.
- Resto de errores: como hoy.

### `?/saludo` (nueva)

Sin campos. Respuesta: `{ saludo: { fraseId } }` o `{ saludo: null }` si no han pasado 2 horas (RN-089). Solo la envía `use:enhance`.

### `?/rellenar` (sin cambios de contrato)

La página muestra en el bocadillo de Capsulito el texto de la variante elegida (RF-219).

## API `/api/consumos` (cola sin conexión)

Sin cambios (constitución XIV). El cliente pide la confirmación de stock 0 antes de encolar.

## Compras `/compras` (`?/registrar`, amplía F10)

El esquema de compra (`src/lib/shared/contratos/economia.ts`) añade la regla: para cada índice con `cantidad > 0`, `importe` > 0 o error `{ campo: 'importe.<i>', codigo: 'IMPORTE_OBLIGATORIO', mensaje: 'Escribe lo que costó esta línea en el ticket.' }`. La comprobación ocurre antes de calcular la hucha negativa.

## Ajustes `/ajustes` (nueva)

- `load`: `{ avisos: PreferenciasAvisos, instalacionDescartada }` con `exigirSesion` en el caso de uso.
- `?/preferencia`: el mismo contrato que hoy tiene Perfil (`esquemaPreferenciaAviso`). Perfil conserva `?/preferencia` una versión respondiendo `redirect(308, '/ajustes')`.

## Alta de usuario `/admin/usuarios` (`?/alta`, amplía F1)

Formulario `multipart/form-data`. Campo nuevo `foto`: `File` opcional validado con el esquema de foto de F10 (tipo real, ≤ 5 MB). `valores` no incluye el archivo (constitución XVII); sin JavaScript, la página avisa de que hay que volver a adjuntarlo.

## Entrada `/login` (sin cambios de contrato)

La animación solo lee eventos del formulario (foco, posición del cursor, resultado). No envía datos nuevos.

## Errores

`+error.svelte` recibe `page.status` y `page.error.codigo`. Correspondencia: 400–499 salvo 403 y 404 → `peticion`; 403 → `sin-permiso`; 404 → `no-encontrada`; ≥ 500 → `servidor`.

## Códigos de registro técnico nuevos (`plataforma/registro.ts`, XVI)

| Código | Nivel | Campos |
| --- | --- | --- |
| `frase.entregada` | debug | `usuarioId`, `lista`, `fraseId`, `ciclo` |
| `frase.ciclo_reiniciado` | info | `usuarioId`, `lista`, `ciclo` |
| `frase.fallo` | error | `usuarioId`, `lista`, error serializado |
| `consumo.confirmacion_sin_stock` | info | `tipoCapsulaId` |

Ningún evento contiene el texto de la frase.
