# Data Model: F12

Sin tablas nuevas ni migraciones. `notificacion.tipo` y `preferencia_notificacion.tipo` son `text` sin `CHECK` en SQLite (`drizzle/0004_f5-notificaciones.sql`). El tipo nuevo solo cambia la lista de TypeScript.

## Tipo de aviso nuevo `recuento` (módulo `notificaciones`)

| Campo de `datos` | Tipo | Regla |
| --- | --- | --- |
| `recuentoId` | ULID | Recuento de origen. También va en `origenId`. |
| `accion` | `'registrado' \| 'anulado'` | `anulado` se emite al anular una línea (RN-036). |
| `fecha` | `FechaMadrid` | Día del recuento en Madrid. El texto lo muestra como `dd/mm`. |
| `lineas` | `{ nombreTipo: string(1..80), diferencia: int ≠ 0 }[]`, de 1 a 50 elementos | Una diferencia negativa son cápsulas que faltaban; una positiva, cápsulas que sobraban. |
| `importe` | `int ≥ 0` (céntimos) | Suma de los repartos del recuento. Vale 0 si solo hay sobrantes. |
| `personas` | `int ≥ 0` | Personas activas que entran en el reparto. Vale 0 si `importe = 0`. |
| `minimo`, `maximo` | `int ≥ 0` (céntimos) | Cargo total mínimo y máximo por persona. |

- **Destinatarios** (`CATALOGO`): todas las personas activas en el momento del recuento. Una persona dada de alta después no recibe el aviso. Es desactivable: desactivarlo solo quita la entrega push.
- **Sin aviso**: un recuento sin ninguna diferencia, y la anulación de una línea con diferencia 0.
- **Privacidad**: los datos no llevan nombres de personas, correos ni identificadores de personas (XVI). El evento de log `aviso.registrado` ya existe y solo registra `tipo` y el número de destinatarios.
- **Texto** (`construirMensaje`, en `textos.ts`). Para un recuento registrado con faltantes:
  - Título: «Recuento del 26/10».
  - Texto: «Faltaban 3 Ristretto; 1,05 € repartidos entre 8 personas (0,13 € cada una)». Si `minimo ≠ maximo`, el final cambia a «(entre 0,13 y 0,14 € cada una)».
  - Si solo hay sobrantes: «Sobraban 2 Lungo; sin cargos».
  - Si hay faltantes y sobrantes: las dos partes, separadas por «. ».
  - Si se anula: «Se anuló el recuento de Ristretto del 26/10; sus cargos ya no cuentan».
  - Enlace: `/saldos`.

## Funciones nuevas o cambiadas

| Función | Módulo | Cambio |
| --- | --- | --- |
| `ordenarTiposInicio(tipos, propios, departamento)` | `economia/dominio/orden-inicio.ts` | Nueva y pura (RN-090). Recibe los dos recuentos como `ReadonlyMap<string, number>`. |
| `leerTiposInicio(db, actor, ahora)` | `economia/consumos.ts` | Nueva. Devuelve los tipos registrables ordenados. |
| `repartirEnPersonas` | `economia/control.ts` | Devuelve `Parte[]`, que hoy descarta. |
| `confirmarRecuento`, `anularLineaRecuento` | `economia/control.ts` | Registran el aviso `recuento` en su transacción. |
| `leerAvisoRecuentoPendiente(db, persona, ahora)` | `notificaciones/panel.ts` | Nueva. Devuelve el último `recuento` no visto en la ventana de 30 días, con su mensaje. |
| `marcarVisto(ambiente, persona, avisoId)` | `notificaciones/panel.ts` | Nueva. Marca solo un aviso de la persona. Repetirla no cambia nada. |
| `inicioDeVentanaDias(ahora, dias)` | `lib/shared/fechas/meses.ts` | Nueva. Devuelve las 00:00 de Madrid del día `hoy − (dias − 1)` en UTC. |

## Catálogos tipados (sin base de datos)

- `lib/shared/mascota/reposo.ts`: `GESTOS_REPOSO`, con los gestos a los 6, 12, 16 y 21 s y su duración, y `gestoEn(segundos)`.
- `lib/shared/mascota/bienvenida.ts`: `intro_09` en la posición 5, con lo que pasan a ser 9 escenas.
- `lib/shared/mascota/momentos.ts`: el momento `intro_09` y la duración de cada pose Rive (`duracionPose`).
- `scripts/generar-voces.mjs`: la locución `intro_09`.

## Datos del navegador

Sin claves nuevas (constitución V). La celebración y los gestos usan las preferencias que ya existen: voz, «Mostrar a Capsulito» y movimiento del sistema.

## Archivos estáticos nuevos

- `static/mascota/sonidos/celebracion.mp3`, de 30 KB como máximo.
- `static/mascota/riv/capsulito-reposo.riv`, con su fuente en `docs/diseno/f12/rive/reposo/`.
- `static/mascota/voces/intro_09.mp3` y `.json`, que genera la persona usuaria.
