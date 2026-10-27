# Contrato: restaurar una copia

## `GET /admin/copias/restaurar/[...clave]`

- **Entrada**: `z.strictObject({ clave: z.string().regex(/^becafe\/[\w/.-]+\.tar\.gz$/) })`.
- **Permiso**: administrador (caso de uso). Un miembro recibe 403.
- **Errores**: sin S3, o una clave que no está en el bucket → 404.
- **Datos**: `{ copia: { clave, tamano, fechaMadrid, resguardo } }`.

## `POST /admin/copias/restaurar/[...clave]?/restaurar`

- **Entrada** (formulario): `z.strictObject({ clave, contrasena: z.string().min(1) })`.
- **Éxito**: `redirect(303, '/admin/copias?restauracion=preparada')`. Después, el proceso se reinicia.
- **Rechazos**: `fail(estado, { errores, valores: { clave } })`. `valores` nunca incluye la contraseña.

| Código | Estado | Mensaje (`textos.ts`) |
| --- | --- | --- |
| `CONTRASENA` | 400 | La contraseña no es correcta. |
| `EN_CURSO` | 409 | Ya hay una restauración en curso. |
| `S3_RED`, `S3_RESPUESTA`, `S3_CREDENCIALES`, `S3_LISTADO` | 502 | No se pudo hablar con el bucket. No se ha cambiado nada; inténtalo más tarde. |
| `SUMA`, `INTEGRIDAD` | 422 | La copia está dañada. No se ha cambiado nada; elige otra. |
| `VERSION_NUEVA` | 422 | Esta copia es de una versión más nueva de beCafé. Actualiza la aplicación antes de restaurarla. |
| `INSTANTANEA`, `DISCO` | 500 | No se pudo guardar la copia de resguardo. No se ha cambiado nada. |

## Mientras se restaura

Toda petición que no sea `GET` ni `HEAD` recibe **503**. La cola sin conexión reintenta después.

## Eventos de registro (catálogo de `copias`)

- `copia.restauracion_preparada { duracionMs, tamano }`
- `copia.restauracion_fallida { codigo, estadoHttp? }`
- `copia.restauracion_aplicada { duracionMs }`
- `copia.restauracion_marca_invalida { ruta }`
