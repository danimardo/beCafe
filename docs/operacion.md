# Operación de beCafé

Guía para desplegar, configurar, copiar y restaurar beCafé. Está escrita en Español Técnico Simplificado: una acción por frase y sujeto explícito. Los términos siguen el glosario de `historias.md`.

## 1. Despliegue en Coolify

1. Usa la imagen de `ghcr.io` por su **digest** (`sha256:…`), no por la etiqueta `latest`. Así sabes exactamente qué versión se ejecuta.
2. Crea un volumen persistente y móntalo en `/data`. Ahí viven la base de datos (`/data/becafe.db`), las fotos (`/data/fotos`) y los registros (`/data/logs`).
3. Define las variables de entorno de la sección 2.
4. Arranca la aplicación. Revisa que `/api/salud` responde.

Sin un volumen en `/data`, los datos se pierden al actualizar la imagen. No arranques dos instancias sobre el mismo volumen.

## 2. Variables de entorno

Las variables se declaran en `src/env.ts`. Si falta una obligatoria, la aplicación no arranca y registra solo sus nombres.

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `ORIGIN` | Sí | Dirección pública de la aplicación (`https://…`). |
| `DIRECTORIO_DATOS` | Sí | Carpeta de datos. En la imagen es `/data`. |
| `ADMIN_INICIAL_EMAIL` | Sí, en el primer arranque | Correo del primer administrador. Solo se usa si no hay personas dadas de alta. |
| `ADMIN_INICIAL_NOMBRE` | Sí, en el primer arranque | Nombre del primer administrador. |
| `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `PUBLIC_VAPID_KEY` | Sí, para avisos push | Claves de notificaciones (sección 2, abajo). |
| `LOG_LEVEL` | No | Nivel de registro. Valor por defecto: `info`. |
| `S3_ENDPOINT` | Sí, para copias | URL `https` del almacenamiento compatible con S3. |
| `S3_BUCKET` | Sí, para copias | Nombre del bucket de copias. |
| `S3_REGION` | Sí, para copias | Región del bucket. |
| `S3_ACCESS_KEY` | Sí, para copias | Clave de acceso. Es secreta. |
| `S3_SECRET_KEY` | Sí, para copias | Clave secreta. Es secreta y nunca se escribe en el repositorio. |

Las cinco variables S3 van juntas. Si falta una, la aplicación no programa las copias diarias y registra `app.s3_no_configurado`. El panel `/admin/copias` muestra un aviso.

Para generar las claves push (VAPID), ejecuta una vez en tu equipo (no en el servidor):

```bash
npm run vapid:generar
```

Guarda las claves en Coolify como variables secretas.

## 3. Primer administrador

Al arrancar por primera vez, sin personas dadas de alta, la aplicación crea el primer administrador con `ADMIN_INICIAL_EMAIL` y `ADMIN_INICIAL_NOMBRE`. Registra su enlace de acceso **solo en la salida estándar** (RF-139). El fichero de registro recibe `auth.admin_inicial_creado` sin el enlace.

1. Lee la salida estándar del contenedor en Coolify y copia el enlace.
2. Abre el enlace y define la contraseña. Debe tener al menos 15 caracteres (RT-007).
3. Si pierdes el acceso, ejecuta dentro del contenedor `npm run admin:recuperar -- --correo <correo> [--nombre <nombre>]`. El comando crea o recupera la persona administradora con ese correo.

## 4. Copias de seguridad diarias

La aplicación hace una copia cada día a las 03:00 (hora de Madrid):

1. Copia la base de datos con `VACUUM INTO` y comprueba su integridad.
2. Empaqueta la copia y las fotos en un archivo `.tar.gz`.
3. Calcula su SHA-256.
4. Sube el archivo al bucket en `becafe/AAAA/MM/becafe-<instante>.tar.gz`.

Si una copia falla, la aplicación registra `copia.fallida` y avisa a las personas administradoras. Si el reinicio interrumpe una copia, queda como «interrumpida». No se reintenta el mismo día: la siguiente copia es la de mañana.

El panel `/admin/copias` lista las últimas 30 copias con su estado y su código de error. Si pasan 100 días sin una prueba de restauración anotada, el panel muestra un aviso.

### Regla de ciclo de vida del bucket

Configura en el bucket una regla que borre los objetos de `becafe/` a los 30 días (RF-141). Sin esta regla, el bucket crece sin límite.

Ejemplo de regla (formato JSON de lifecycle de S3; sustitúyelo por la sintaxis de tu proveedor):

```json
{
  "Rules": [
    {
      "ID": "borrar-copias-antiguas",
      "Status": "Enabled",
      "Filter": { "Prefix": "becafe/" },
      "Expiration": { "Days": 30 }
    }
  ]
}
```

Compruébala después de aplicarla: sube un objeto de prueba fuera de `becafe/` y otro dentro. Solo el de `becafe/` debe tener caducidad.

## 5. Verificar una copia

Descarga un archivo de copia del bucket y ejecuta:

```bash
npm run copia:verificar -- ruta/a/becafe-2026-10-23T03-00-00.000Z.tar.gz
```

El comando muestra la integridad de SQLite, el número de migraciones aplicadas y el número de personas. No muestra nombres, correos ni importes. Termina con código 0 solo si la copia es válida.

## 6. Restaurar una copia

Haz la restauración en un entorno aparte la primera vez. Repítela cada vez que anotes una prueba de restauración.

1. Descarga el archivo de la copia y verifícalo (sección 5).
2. Detén la aplicación en Coolify.
3. Sustituye el contenido de `/data`: `becafe.db` y la carpeta `fotos/`. Extrae el `.tar.gz` y copia `becafe.db` y `fotos/` en `/data`.
4. Borra los ficheros `becafe.db-wal` y `becafe.db-shm` si existen.
5. Arranca la aplicación.
6. Comprueba que `/api/salud` responde y que los saldos del panel coinciden con los que esperas.
7. Entra en `/admin/copias` y anota la prueba con su fecha, su resultado y una nota. Así desaparece el aviso de 100 días.

## 7. Actualizar la aplicación

1. Publica la nueva imagen y anota su digest.
2. Cambia el digest en Coolify y despliega.
3. Revisa el evento de arranque: versión, commit, versión de Node y nivel de registro.
4. Si algo falla, vuelve al digest anterior. Las migraciones solo avanzan, así que una base migrada no vuelve atrás: restaura la copia de la víspera si hace falta.

## 8. Leer los registros

Los registros están en `/data/logs`, en un fichero diario. Se conservan 30 ficheros. Cada línea es un evento JSON con su código, su nivel, su instante (UTC) y su `operacionId`. Un fallo técnico tiene el mismo `operacionId` que la pantalla de error: úsalo para buscar la traza en el registro.

Los registros no contienen nombres, correos, importes ni tokens. No los copies a las copias de seguridad.

## 9. Puerta de producción

Antes de dar la aplicación por operativa, se cumplen estas comprobaciones:

- La restauración de la sección 6 se ha hecho con un bucket de pruebas y la copia arranca con los mismos saldos (EV-070).
- La imagen se ha probado en local: `/api/salud` responde y un usuario creado sigue tras `docker restart`.
- La regla de ciclo de vida de la sección 4 está aplicada y comprobada.
- Las notificaciones push se han revisado en un móvil Android y en un iPhone (PEND-014).
