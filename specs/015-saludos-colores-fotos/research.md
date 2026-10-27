# Research: F15

## R1. Qué cuenta como «aviso» para no gastar el mensaje del día

- **Decisión**: el servidor solo considera los avisos que conoce: deuda (saldo por debajo del límite), stock bajo y aguador del mes. Son los mismos datos que el `load` de Inicio ya pasa a `momentoInicio`.
- **Motivo**:
  - El rechazo y los consumos pendientes viven en la cola del navegador y el servidor no los conoce al cargar.
  - Asignar en el servidor es lo que permite funcionar sin JavaScript (XVII) y dar el mismo mensaje en todos los dispositivos (RN-091).
  - Si hay un rechazo o pendientes, el mensaje ya asignado espera en el bocadillo hasta que se resuelven, el mismo día. Se ve igual.
- **Alternativa descartada**: asignar desde el cliente con una *action* tras montar, como el saludo rotativo. No funciona sin JavaScript y añade una petición.

## R2. Colores de referencia de cada tema para el contraste

- **Decisión**: los valores de `wall-raised`, `wall-base`, `ink` y `on-accent` de cada tema se leen de un módulo TypeScript generado desde los mismos tokens que `src/tokens.css` (que ya se regenera con `npm run check`). `color-propio.ts` los importa.
- **Motivo**: si se escriben a mano, divergen al cambiar un token. La constitución XVIII exige medir el contraste sobre el resultado real.
- **Alternativa descartada**: medir el contraste en el navegador con `getComputedStyle`. No sirve en el servidor ni en las pruebas unitarias y no funciona sin JavaScript.

## R3. Orientación EXIF en el navegador y en el servidor

- **Decisión**: el encuadre trabaja sobre la foto orientada.
  - Los navegadores soportados aplican la orientación EXIF por defecto (`image-orientation: from-image`): Safari ≥ 13.1 y Chrome ≥ 81.
  - `sharp().rotate()` hace lo mismo antes del `extract`.
  - Las fracciones (`x` sobre el ancho, `y` sobre el alto, `lado` sobre el lado menor) no dependen de la resolución que muestra el navegador.
- **Prueba**: integración con una JPEG de orientación 6 (girada 90°) y un encuadre arriba a la izquierda.

## R4. Dónde se recorta

- **Decisión**: en el servidor (DEC-137).
- **Motivo**:
  - Sin JavaScript sigue funcionando, con el recorte central.
  - Hay un solo punto de proceso de imágenes (`plataforma/imagenes.ts`, ARCHITECTURE.md §11).
  - El servidor ya vuelve a codificar para quitar metadatos.
- **Alternativa descartada**: recortar en un `canvas` del navegador y subir el resultado. Duplica el proceso, pierde calidad en dos pasos y no funciona sin JavaScript.

## R5. Reutilizar `frase_entregada` o una tabla nueva

- **Decisión**: una tabla nueva `mensaje_dia` con clave primaria `(usuario_id, dia)`.
- **Motivo**:
  - La clave primaria garantiza un solo mensaje por persona y día sin lógica extra, y resuelve la concurrencia con `ON CONFLICT DO NOTHING`.
  - `frase_entregada` tiene un `CHECK` de lista cerrada que en SQLite obliga a reconstruir la tabla para añadir otra lista.
  - Además, `frase_entregada` no guarda el día.
