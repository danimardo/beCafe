# 0007 — Descarga de copias de seguridad por un endpoint GET, con el origen y el tipo en la clave del objeto

- **Estado:** Aceptado
- **Fecha:** 27-10-2026
- **Requisitos relacionados:** principios V, VI, XIV, XVI y XVII; RF-284, RF-285, RF-289; DEC-140; `historias.md` v0.29.0

## Contexto

- La persona usuaria necesita descargar las copias del bucket y saber en qué sistema se hizo cada una.
- La constitución XVII limita `+server.ts` a clientes sin formulario: la cola sin conexión, la suscripción push, el registro del cliente y el endpoint de salud. Una descarga devuelve un archivo y no cabe en una *action*.
- Las fotos ya se sirven por `+server.ts` con sesión (`src/routes/fotos/…`), conforme al principio V.
- La lista S3 no devuelve los metadatos de un objeto. Leerlos exige una petición `HEAD` por copia.

## Decisión

1. **Un único `+server.ts` GET** en `src/routes/(app)/admin/copias/descargar/[...clave]/`. Solo sirve a administradores: el caso de uso `descargarCopia` comprueba sesión y permiso, valida la clave con `esquemaClaveCopia`, abre el objeto en flujo y anota la auditoría antes de entregarlo. La respuesta lleva `Cache-Control: no-store`.
2. **El origen y el tipo viajan en la clave:** `becafe-<instante>__<origen>__<tipo>.tar.gz`. Las claves anteriores siguen siendo válidas y se muestran como «Origen no registrado».
3. **Sin enmienda de la constitución.** El endpoint no sirve a un formulario ni cambia datos: entrega un archivo con la misma garantía que las fotos.

## Alternativas consideradas

- **Enmendar XVII para añadir la descarga a su lista:** una enmienda por un solo endpoint de lectura; el ADR deja el registro sin cambiar el texto de la constitución.
- **Generar una URL firmada de S3 y redirigir:** el navegador hablaría con el bucket y la URL firmada saldría de `subida-s3.ts`, lo que rompe su aislamiento y la auditoría previa.
- **Origen en metadatos `x-amz-meta-*`:** hasta 30 `HEAD` por carga de pantalla.
- **Manifiesto dentro del `.tar.gz`:** obliga a descargar la copia para listarla.

## Consecuencias

- La lista del bucket muestra origen y tipo sin consultas extra, y otro sistema que importe el bucket los ve.
- Hay una ruta nueva que entra en la suite `acceso` (EV-050).
- Un cambio de dominio de producción aparece como otro origen.
- Si hiciera falta más información del origen (versión, commit), se podrá añadir un manifiesto en otra funcionalidad.
