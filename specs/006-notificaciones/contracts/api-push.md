# Contrato: suscripción push (F5)

Endpoint JSON permitido por la constitución XVII (suscripción push). Esquemas en `lib/shared/contratos/push.ts`. Exige sesión; entra en `acceso` (EV-050).

## `POST /api/push/suscripcion`

Cuerpo (`z.strictObject`):

```ts
{
  version: 1,
  endpoint: z.url({ protocol: /^https$/ }).max(1000),
  claves: z.strictObject({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) })
}
```

| Caso | Respuesta |
| --- | --- |
| Alta o *upsert* del mismo endpoint | `201` sin cuerpo |
| Endpoint de otra persona (dispositivo compartido) | `201`; pasa a la persona con sesión |
| Sin sesión | `401` |
| Cuerpo no válido o clave extra | `400` `{ codigo: 'ENTRADA_INVALIDA' }`, sin el valor recibido |
| Cuerpo de más de 4 KB | `413` |

## `DELETE /api/push/suscripcion`

Cuerpo: `z.strictObject({ version: 1, endpoint })`. Borra la suscripción si es de la persona con sesión. `204` siempre que la entrada sea válida (no revela si el endpoint existía).

## Mensaje push (servidor → service worker)

```ts
z.strictObject({ version: 1, tipo: tipoNotificacion, titulo: z.string(), texto: z.string(), enlace: z.string().startsWith('/') })
```

El service worker lo valida antes de mostrarlo y descarta lo que no cumple el esquema.
