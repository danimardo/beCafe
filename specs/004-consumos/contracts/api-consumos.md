# Contrato: `POST /api/consumos` (cola sin conexión)

Único cliente: `lib/client/cola-consumos` (excepción cerrada del principio XVII). Esquema en `lib/shared/contratos/consumos.ts`.

## Petición

- Cabeceras: `content-type: application/json`; cookie de sesión.
- Tamaño máximo del cuerpo: 2 KB (413 si se supera).
- Cuerpo v1:

```json
{ "version": 1, "clienteId": "01J…", "tipoCapsulaId": "01J…", "invitado": false, "horaGesto": "2026-10-22T08:15:03.000Z" }
```

- Validación: `z.discriminatedUnion('version', [esquemaConsumoV1])`, cada versión con `z.strictObject`. Una clave desconocida o una versión desconocida responden 400 `VALIDACION`.

## Respuestas

| Estado | Cuándo | Cuerpo |
| --- | --- | --- |
| 201 | Consumo nuevo | `{ "id", "precio", "descuadre" }` (`precio` en céntimos) |
| 200 | `clienteId` ya recibido (EV-010) | El consumo original, mismo formato |
| 400 | Cuerpo no válido | `{ "codigo": "VALIDACION", "mensaje" }` |
| 401 | Sin sesión válida | `{ "codigo": "SIN_SESION", "mensaje" }` |
| 403 | Sesión cerrada por una baja (D9) | `{ "codigo": "USUARIO_DE_BAJA", "mensaje" }` |
| 403 | Privacidad pendiente (`hooks.server.ts`) | `{ "codigo": "PRIVACIDAD_PENDIENTE", "mensaje" }` — el cliente conserva el elemento |
| 409 | Tipo sin coste medio (RN-006) | `{ "codigo": "TIPO_SIN_COSTE", "mensaje" }` |
| 413 | Cuerpo de más de 2 KB | `{ "codigo": "VALIDACION", "mensaje" }` |

El mensaje no incluye el valor recibido (constitución VI).

## Compatibilidad (principio XIV)

- Una versión 2 del contrato se añade a la unión; la versión 1 se acepta mientras pueda haber elementos en una cola (como mínimo, hasta que pase el plazo de vida de la caché del service worker de la versión anterior).
- `e2e/api/consumos.spec.ts` guarda un cuerpo de ejemplo de cada versión aceptada y comprueba que sigue respondiendo 201 o 200.

## Comportamiento del cliente por respuesta

| Respuesta | Acción en la cola | Pantalla |
| --- | --- | --- |
| 201, 200 | Borra el elemento | Deja de mostrarse como pendiente |
| 401 | Conserva | «Inicia sesión para enviar tus consumos pendientes» |
| 403 `USUARIO_DE_BAJA`, 409, 400 | Marca `rechazado` | `Banner negative` con «Entendido» |
| 403 `PRIVACIDAD_PENDIENTE`, 5xx, red | Conserva y reintenta (30 s → 10 min) | Sigue «pendiente de enviar» |
