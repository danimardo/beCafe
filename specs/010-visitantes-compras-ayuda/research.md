# Research: F10 — Visitantes, compras rápidas, estadísticas y ayuda

Cada entrada resuelve una pregunta técnica del plan. Ninguna introduce reglas de negocio: las reglas están en `spec.md` y `historias.md` v0.19.0.

## R1. Módulo dueño de los visitantes

- **Decisión**: `auth` posee `enlace_visitante` y `visita` (token, nombre, caducidad). `economia` posee `cafe_visitante`.
- **Motivo**: el enlace es una credencial de acceso con token, como `enlace_acceso`; el café de visitante cambia el stock, que solo escribe `economia`. La arista `economia → auth` ya existe.
- **Alternativas**: módulo `visitantes` nuevo (necesitaría escribir stock o una arista nueva hacia `economia`, y un módulo para tres tablas no se justifica, principio II); todo en `economia` (mezclaría tokens y cookies con el núcleo económico).

## R2. Sesión del visitante

- **Decisión**: cookie propia `becafe_visita` (`HttpOnly`, `SameSite=Lax`, `Secure` en https, `Max-Age` hasta la caducidad del enlace) con un token de 256 bits; en la base solo su SHA-256. Se resuelve en `hooks.server.ts` en `event.locals.visita`.
- **Motivo**: el principio V exige que la sesión viaje solo en una cookie `HttpOnly`. Separarla de la sesión de miembro hace imposible confundir un visitante con un miembro en `exigirSesion`.
- **Alternativas**: reutilizar `sesion` con un rol «visitante» (todos los casos de uso que solo miran el rol quedarían expuestos; RF-194 pide aislamiento total).

## R3. Concurrencia en la aprobación

- **Decisión**: `UPDATE cafe_visitante SET estado = ? WHERE id = ? AND estado = 'pendiente'` dentro de `enTransaccion`; solo si `changes = 1` se toca el stock.
- **Motivo**: SQLite serializa las escrituras; la condición sobre el estado decide un único ganador sin bloqueos explícitos (mismo patrón que las anulaciones de F4).
- **Prueba**: dos `worker_threads` aprueban el mismo café; el stock baja una sola vez (EV-104).

## R4. Generación del QR

- **Decisión**: `uqr` 0.1.x en `plataforma/qr.ts`, que devuelve un SVG con `currentColor` incrustado en la página desde el `load`/la *action*.
- **Motivo**: sin dependencias transitivas, MIT, salida SVG nativa; funciona sin JavaScript y respeta los temas.
- **Alternativas**: `qrcode` (3 dependencias, incluida `yargs`); codificador propio (riesgo de errores en Reed-Solomon sin beneficio).

## R5. Confirmación de hucha negativa sin JavaScript

- **Decisión**: el servidor devuelve `fail(409, { confirmacion, valores })` y la página muestra un panel de confirmación con los mismos campos ocultos y `saldoConfirmado`. Con JavaScript, `ConfirmDialog` se abre antes del envío.
- **Motivo**: XVII exige que la acción funcione sin JavaScript; `saldoConfirmado` evita confirmar un efecto que cambió entre medias (EV-106).

## R6. Evolución de la hucha

- **Decisión**: `economia.leerEvolucionHucha` suma los movimientos vigentes de la cuenta `hucha` agrupados por mes de `Europe/Madrid` y acumula el saldo al cierre de cada mes.
- **Motivo**: los saldos se derivan del libro (IV). Con el volumen esperado (≤ 10 personas, años de datos) la consulta agrupada cabe en el presupuesto de `perf:lectura`.
- **Alternativa**: tabla de cierres mensuales (dato derivado guardado sin necesidad, principio II).

## R7. Gráficos

- **Decisión**: reutilizar `BarChart` (barras horizontales y apiladas) y crear `LineChart` en SVG con los tokens de datos de Latte; cada gráfico acompañado de una tabla en `<details>`.
- **Motivo**: la constitución prohíbe librerías nuevas para el mismo fin sin justificación; los gráficos son pocos y simples. La tabla satisface WCAG 1.1.1.

## R8. Instalación de la PWA

- **Decisión**: `lib/client/instalacion.ts` escucha `beforeinstallprompt` (Chromium) y `appinstalled`; detecta `matchMedia('(display-mode: standalone)')` y `navigator.standalone` (iOS). En iOS Safari muestra instrucciones de «Compartir → Añadir a pantalla de inicio». Donde no hay forma de instalar, la tarjeta no aparece.
- **Motivo**: es una excepción cerrada de XVII. El descarte se guarda en la cuenta (principio V), no en `localStorage`.

## R9. Marcas por cuenta (tour, instalación, oferta de avisos)

- **Decisión**: tabla `preferencia_cuenta` en `usuarios` (`usuario_id`, `clave`, `valor_en`) con `clave` en un conjunto cerrado (`tour_inicio_visto`, `instalacion_descartada`, `oferta_avisos_vista`) y `CHECK`.
- **Motivo**: una fila por marca evita una migración por cada marca futura y mantiene `usuario` estable.
- **Alternativa**: tres columnas en `usuario` (más migraciones; mezcla datos de cuenta con preferencias de interfaz).

## R10. Color estable del avatar

- **Decisión**: FNV-1a de 32 bits del `usuarioId` módulo 6 → `--avatar-1` … `--avatar-6`. Función pura en `lib/shared/avatar.ts`.
- **Motivo**: estable entre dispositivos y sesiones, sin guardar nada; los tokens se validan con contraste ≥ 4,5:1 en los dos temas.

## R11. Límite de frecuencia del visitante

- **Decisión**: `plataforma/limitador` con 10 cafés por visita y minuto.
- **Motivo**: protección técnica contra un enlace filtrado, no un máximo de cafés (la spec no fija máximo y el límite no lo es: 10 por minuto no se alcanza junto a una cafetera). Se documenta como parámetro técnico; si la persona usuaria prefiere otro valor o ninguno, se cambia sin afectar al diseño.
