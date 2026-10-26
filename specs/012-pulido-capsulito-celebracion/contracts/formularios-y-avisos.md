# Contratos de F12

## Acciones de formulario

| Ruta y acción | Entrada (`z.strictObject`) | Respuesta | Cambio |
| --- | --- | --- | --- |
| `/admin/usuarios?/alta` | Sin cambios | Añade `origen: 'alta'` | RF-239 |
| `/admin/usuarios/[usuarioId]?/generarEnlace` | Sin cambios | Añade `origen: 'generarEnlace'` | RF-239 |
| `/admin/usuarios/[usuarioId]?/reactivar` | Sin cambios | Añade `origen: 'reactivar'` | RF-239 |
| `/?/verAviso` (nueva) | `{ avisoId: ULID }` | `{ avisoVisto: true }`. Sin sesión: `SIN_SESION`. Con un aviso de otra persona o inexistente, la respuesta es la misma pero no cambia nada, para no revelar que existe. | RF-246 |
| `/?/consumir`, `/?/rellenar` | Sin cambios | Sin cambios. La celebración se decide en el cliente con la respuesta actual. | RF-243 |
| `/acceso/[token]` | Sin cambios | Sin cambios | RF-241 |

`/api/consumos` (la cola sin conexión) no cambia (constitución XIV).

## Datos de `load`

- `/` añade `avisoRecuento: { id, titulo, texto } | null`, y `tipos` llega ordenado según RN-090.
- `/admin/usuarios` añade `fotoUrl: string | null` a cada persona.

## Catálogo de avisos

`TIPOS_NOTIFICACION` y `TIPOS_DESACTIVABLES` (`lib/shared/contratos/push.ts`) añaden `'recuento'`. Su esquema de datos está en `data-model.md`. Ajustes muestra el interruptor «Recuentos de stock».

## Registro técnico (catálogo de códigos)

| Código | Nivel | Campos | Cuándo |
| --- | --- | --- | --- |
| `aviso.registrado` (existe) | info | `tipo`, `destinatarios` | Al avisar de un recuento |
| `aviso.visto` (nuevo) | info | `avisoId` | Al pulsar «Entendido» en Inicio |

En el cliente no hay códigos nuevos. Un fallo al reproducir el sonido se ignora sin registrarlo, igual que la voz.

## Componentes de `lib/ui`

| Componente | Propiedades nuevas |
| --- | --- |
| `CopyField` | `anunciar?: boolean`. Desplaza la vista, anuncia el enlace y pone `autofocus`. |
| `Capsulito` | `callado?: boolean`. Fija la boca en 0 y para el reposo. |
| `CapsuleTile`, `CapsuleRow`, `WaterRefillCard` | `celebrar?: number`. Un contador: cada incremento lanza el confeti. |
| `Avatar` | `decorativo?: boolean`. Pone `aria-hidden="true"` y quita el nombre accesible. |
| `movimiento/Confeti.svelte` (nuevo) | `disparo: number` |

El contexto de la mascota añade `celebrar(fraseId: string | null): void`.

## Rive: `capsulito-reposo.riv`

Artboard `Reposo`, de 1185 × 1185 y sin fondo. Máquina de estados `Reposo`:

| Entrada | Tipo | Efecto |
| --- | --- | --- |
| `mirarLados` | disparador | Las pupilas y la cabeza miran a la izquierda y a la derecha (1,2 s). |
| `pie` | disparador | Golpea el suelo 3 veces con la zapatilla derecha (1,2 s). |
| `reloj` | disparador | Sube el brazo izquierdo y mira la muñeca (1,6 s). |
| `bostezo` | disparador | Abre la boca, cierra los ojos y estira los brazos (2 s). |
| `cancelar` | disparador | Vuelve al reposo en 150 ms. |
| `reducedMotion` | booleano | Para el parpadeo y los gestos. |

La capa `Parpadeo` es un bucle de 3 s que no se ejecuta durante el bostezo.
