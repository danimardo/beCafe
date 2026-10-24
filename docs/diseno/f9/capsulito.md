# Capsulito, la mascota de beCafé (F9 · RF-186, RF-187)

## 1. Personaje

Capsulito es una cápsula de café con cara, brazos y zapatillas: marrón café con aro crema, los mismos colores que el sistema Latte. Encaja con la marca sin tocar ningún token.

- **Personalidad**: alegre, servicial y breve. Habla de tú y con frases cortas.
- **Su papel**: orienta («toca tu cápsula»), avisa («quedan pocas») y celebra («¡gracias por el agua!»).
- **Lo que nunca hace**: bromear con el dinero o las deudas, culpar a nadie, señalar a una persona en público, meter prisa, hablar de salud o de cuánto café se toma, ni contar nada que no esté ya en la pantalla.
- **Avisos de deuda**: los dice en primera persona y en privado («Tu saldo está por debajo del límite»), nunca con nombres de otros.

## 2. Ficheros

`static/mascota/capsulito-{pose}-{128|256|512|1024}.webp`: 8 poses × 4 tamaños, 1,2 MB en total (la de 256 px pesa unos 15 KB). Todas comparten **el mismo encuadre cuadrado**: al cambiar de pose el personaje no salta de sitio.

Correspondencia con el pack original (cuyos nombres estaban cambiados):

| Pose (nombre nuevo) | Fichero original | Qué hace |
| --- | --- | --- |
| `saludando` | `capsulito_pensando.png` | Saluda con la mano |
| `senalando` | `capsulito_señalando.png` | Señala a su izquierda |
| `pensando` | `capsulito_añadiendo_capsula.png` | Mano en la barbilla, mira arriba |
| `caminando` | `capsulito_celebrando_2.png` | Camina con el puño adelante |
| `celebrando` | `capsulito_celebrando_1.png` | Brazos arriba, da un paso |
| `saltando` | `capsulito_saludando.png` | Salta con los brazos arriba |
| `recordatorio` | `capsulito_recordatorio.png` | Toca una campana |
| `anadiendo-capsula` | `capsulito_caminando.png` | Levanta una cápsula verde |

Los nombres van sin «ñ» ni tildes para evitar problemas de URL y de sistemas de archivos.

## 3. El componente `<Capsulito>`

Referencia: `referencia/src/lib/components/mascota/Capsulito.svelte` (en el repositorio, `src/lib/ui/Capsulito.svelte`).

```svelte
<Capsulito momento="vacio-compras" />                          <!-- pose y texto del catálogo -->
<Capsulito momento="saludo-manana" nombre="Ana" size="lg" />
<Capsulito momento="sin-conexion" mensaje={null} size="md" fallback={icono} />  <!-- sin bocadillo; icono si la mascota está desactivada -->
```

| Propiedad | Para qué |
| --- | --- |
| `momento` | **Lo normal.** Pide un momento del catálogo (§4): decide la pose, el texto y el tono. |
| `pose` | Solo para casos especiales: fuerza la pose (por ejemplo, en el catálogo `/componentes`). |
| `mensaje` | Sustituye el texto del momento; `null` quita el bocadillo (cuando la pantalla ya tiene título y texto). |
| `nombre` | Sustituye `{nombre}` en el texto. |
| `size` | `xs` 40 · `sm` 64 · `md` 112 · `lg` 160 · `xl` 240 px. |
| `bocadillo` | `derecha` (por defecto) o `arriba` (bienvenida, acceso). |
| `animar` | Animación de entrada (por defecto, sí). |
| `fallback` | Qué pintar si la persona ha desactivado la mascota (normalmente el icono Lucide de siempre). |

Lo que hace por dentro:
- `<img>` con `srcset` (128–1024 px), `width`/`height` fijos (no mueve el diseño al cargar), carga diferida salvo `lg`/`xl`, y `alt=""` con `aria-hidden` porque es **decorativa**.
- **Halo**: un círculo de luz suave detrás. En oscuro es imprescindible: el marrón de Capsulito se perdía sobre el fondo marrón.
- **Cristal**: el bocadillo es `glass-strong`, permitido por la enmienda de la constitución XVIII (DEC-113). Con «Reducir transparencia» pasa a opaco.
- **Bocadillo**: `glass-strong` con pico, 15 px, ancho máximo de 272 px, con borde `warning` o `negative` según el tono.
- **Animación**: «entrada» (aparece y rebota, 0,45 s) o, para celebraciones, «salto» (0,7 s), **una sola vez**. Nada en bucle. Sin animación si `prefers-reduced-motion` o `animar={false}`.
- `data-momento` y `data-pose` para pruebas y analítica.

Estado: **contexto** (constitución XVII, F1 R3): `crearContextoMascota()` en el layout raíz, que llama a `iniciar()` en `onMount`, y `usarMascota()` en los componentes. Expone `visible`, `animar`, `bienvenidaVista`, `setVisible()`, `marcarBienvenidaVista()` y `repetirBienvenida()`. Preferencia en el dispositivo: `becafe-mascota` = `visible` | `oculta`, aplicada como `data-mascota` por el script de `app.html` (F1 R4). Referencia: `referencia/src/lib/mascota.svelte.ts`.

## 4. Catálogo de momentos (`momentos.ts`; las frases, en `textos.ts`)

| Momento | Pose | Tono | Texto | Dónde |
| --- | --- | --- | --- | --- |
| `bienvenida-hola` | saludando | neutro | ¡Hola, {nombre}! Soy Capsulito. | Bienvenida, paso 1 |
| `bienvenida-cafe` | anadiendo-capsula | neutro | Toca tu cápsula y ya está apuntado. | Bienvenida, paso 2 |
| `bienvenida-hucha` | senalando | neutro | Aquí ves la hucha y lo que te toca. | Bienvenida, paso 3 |
| `bienvenida-agua` | celebrando | neutro | ¿Rellenas el agua? ¡Dilo y te lo apunto! | Bienvenida, paso 4 |
| `acceso-hola` | saludando | neutro | ¡Hola! Entra y apunta tu café. | `/login` |
| `acceso-contrasena` | senalando | neutro | Elige una contraseña larga y fácil de recordar. | `/acceso/[token]` |
| `saludo-manana` / `saludo-tarde` | saludando | neutro | ¡Buenos días / Buenas tardes, {nombre}! … | Inicio (solo en escritorio) |
| `aguador-tu` | celebrando | celebración | ¡Eres aguador del mes! Gracias. | Inicio, todo el mes del título |
| `relleno-registrado` | celebrando | celebración | ¡Gracias por el agua! | Aviso flotante |
| `aportacion-registrada` | celebrando | celebración | ¡Aportación guardada! | Aviso flotante |
| `compra-registrada` | anadiendo-capsula | celebración | ¡Cápsulas a la despensa! | Aviso flotante |
| `deuda-saldada` | saltando | celebración | ¡Cuentas al día! | Aviso flotante |
| `primer-cafe` | saltando | celebración | ¡Tu primer café en beCafé! | Aviso flotante, si `esPrimerConsumo` |
| `aviso-stock-bajo` | recordatorio | aviso | Quedan pocas de algunas cápsulas. | Inicio |
| `aviso-deuda` | recordatorio | aviso | Tu saldo está por debajo del límite. | Inicio y Saldos (solo a la persona afectada) |
| `aviso-pendientes` | caminando | aviso | Tengo cafés guardados para enviar. | Inicio, sin conexión |
| `consumo-rechazado` | pensando | problema | Ese café no se ha podido apuntar. | Inicio (con su `Banner`) |
| `vacio-capsulas` · `vacio-movimientos` · `vacio-compras` · `vacio-estadisticas` · `vacio-avisos` | pensando · caminando · anadiendo-capsula · pensando · saludando | neutro | (ver código) | `EmptyState` |
| `sin-conexion` · `no-encontrada` · `sin-permiso` · `servidor` | caminando · senalando · pensando · pensando | problema | (ver código) | `ErrorPage` |

**Añadir un momento**: una entrada en `MOMENTOS` con pose, tono y texto (≤ 60 caracteres, tuteo, sin emojis ni jerga). No se crean poses nuevas en la fase 1.

## 5. Reglas de uso

1. **Uno por pantalla** como mucho, más el aviso flotante momentáneo.
2. **Decorativo**: el bocadillo nunca es la única fuente de información. Si dice algo importante («Tu saldo está por debajo del límite»), eso también está en la pantalla (en `AlertsPanel`).
3. **Frecuencia**: no aparece en acciones repetitivas (cada café). Sí en lo que pasa pocas veces (agua, aportación, compra, deuda saldada, primer café).
4. **Dónde no va**: hojas con formularios, diálogos de confirmación, textos legales, avisos de seguridad (bloqueo, enlaces caducados), tablas de administración y estados de carga.
5. **Tamaños**: `xs`/`sm` en avisos y líneas; `md` en vacíos y errores; `lg` en el panel de escritorio; `xl` en la bienvenida y en el acceso de escritorio.
6. **Móvil**: en Inicio solo aparece si tiene algo que decir (tono distinto de «neutro»). En escritorio puede quedarse saludando, porque hay sitio.
7. **Oscuro**: siempre con halo (ya lo pone el componente). No pongas a Capsulito sobre `accent` ni sobre fotos.
8. **Desactivado** (Perfil): todo `<Capsulito>` que sustituye a un icono recibe ese icono en `fallback`; el resto desaparece sin dejar hueco.

## 6. Accesibilidad

- Imagen decorativa (`alt=""`, `aria-hidden`). El bocadillo es texto real (se puede seleccionar, ampliar y traducir).
- Los avisos flotantes con mascota siguen en la región viva (`role="status"`); se anuncia el título y el detalle, no la imagen.
- Contraste: el bocadillo es `glass-strong` con `ink` (≥ 4,5:1 en los dos temas). El contorno de la mascota supera 3:1 contra el fondo gracias al halo.
- Movimiento: animación única de ≤ 0,7 s, nada en bucle ni parpadeante; desactivada con `prefers-reduced-motion`.
- La bienvenida es un diálogo con foco atrapado, cierre con Esc y «Saltar» siempre visible.

## 7. Preparar la fase 2 (animación, vídeo e interacción)

**Contrato que no debe cambiar**: `<Capsulito momento size mensaje bocadillo fallback>`. En la fase 2:

1. `momentos.ts` añade a cada momento un recurso animado opcional, por ejemplo `anim: { rive: 'capsulito.riv', estado: 'celebrar' }` o `video: 'celebrar.webm'`.
2. `Capsulito.svelte` elige el reproductor: animación si existe, se puede animar y la mascota está visible; si no, la imagen fija de la fase 1, que queda como **póster y reserva**.
3. Las pantallas no cambian.

Recomendaciones para la fase 2:
- **Rive** para las interacciones: una sola `.riv` con una máquina de estados (entradas `pose`, `hablar`, `celebrar`, `mirar`), ligera y con un solo dibujo. **Lottie** si el ilustrador trabaja en After Effects. Vídeo (WebM VP9 con alfa, más HEVC con alfa para Safari) solo para las «lecciones».
- Los vídeos: sin sonido automático, con subtítulos (WebVTT), botón de pausa visible, ≤ 20 s, y con la transcripción en texto al lado.
- Interacción («Capsulito te enseña»): siempre se puede cerrar y nunca bloquea registrar un café.

## 8. Redibujo vectorial

Lo encarga Daniel aparte (PEND-038). No forma parte de F9: en F9 se usan los WebP de `static/mascota/`.
