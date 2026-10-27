# Research: F14

## R1. Sustituir la base de datos: en caliente o al arrancar

- **Decision**: preparar la copia comprobada en `/data/restauracion/preparada/` y sustituirla al arrancar, antes de abrir la base.
- **Rationale**: con la base abierta, sustituir el archivo deja conexiones apuntando al archivo anterior y el WAL a medias. Al arrancar no hay conexiones, `rename` en el mismo volumen es atómico y un fallo se deshace devolviendo los archivos.
- **Alternatives considered**: la API de copia de `better-sqlite3` (`backup`) hacia la base abierta. Escribe página a página sobre una base viva mientras otras peticiones leen. Descartada.

## R2. Reinicio del proceso

- **Decision**: `plataforma/reinicio.ts` cierra la base y termina con `process.exit(0)` 1 s después de responder. Docker o Coolify vuelven a arrancar el contenedor.
- **Rationale**: es una sola instancia sin supervisor dentro del contenedor. Salir es la forma más simple y que Coolify ya maneja (política `unless-stopped`).
- **Alternatives considered**: reabrir la base sin salir. Obliga a reconstruir el `Ambiente`, los limitadores y el planificador en caliente. Descartada por complejidad (II).

## R3. Listado del bucket sin dependencias nuevas

- **Decision**: `ListObjectsV2` firmado con `aws4fetch`, y extracción de `Key`, `Size` y `LastModified` con expresiones acotadas a `<Contents>…</Contents>`, validadas con Zod.
- **Rationale**: la respuesta de S3 y de Backblaze B2 (API compatible con S3) es XML simple y estable. Un analizador XML sería una dependencia nueva (constitución II).
- **Alternatives considered**: `fast-xml-parser`. Descartado.

## R4. Dónde se guarda la última restauración

- **Decision**: solo en `registro_auditoria` (`accion = 'copia.restaurada'`). La pantalla de copias lee la más reciente con una función pública de `usuarios`.
- **Rationale**: no hace falta ninguna tabla ni migración nueva. La auditoría es el registro de negocio de las acciones de administración (XVI).
- **Alternatives considered**: una columna `tipo` en `copia_seguridad`. Exige una migración sin necesidad.

## R5. Comprobación de versión de la copia

- **Decision**: comparar el número de migraciones aplicadas de la copia con el del journal de la aplicación (`verificarCopia`). Si la copia tiene más, `VERSION_NUEVA`.
- **Rationale**: las migraciones solo avanzan (XIV). Una copia con más migraciones viene de una versión más nueva y no se puede abrir con garantías.

## R6. Restaurar sin JavaScript

- **Decision**: una ruta propia `/admin/copias/restaurar?clave=…` con el efecto y un formulario con contraseña, en lugar de un diálogo.
- **Rationale**: XVII exige que toda acción con formulario funcione sin JavaScript. Una pantalla de confirmación también da más espacio al efecto (X).

## R7. Orden de la visita

- **Decision**: capturar los identificadores del primer `data.tipos` con `untrack` y derivar la lista con una función pura.
- **Rationale**: SvelteKit vuelve a ejecutar el `load` tras la *action*. Sin captura, la lista se reordena en cuanto llega el `data` nuevo. El componente se monta de nuevo al volver a entrar, así que el orden se recalcula sin código adicional. No guarda nada en el navegador (V).

## R8. Medio segundo en los gestos

- **Decision**: el contador de reposo avanza cada 0,5 s.
- **Rationale**: los instantes 9,5 y 20,5 s no son enteros. Un temporizador de 500 ms tiene un coste despreciable y se pausa con la pestaña oculta.
