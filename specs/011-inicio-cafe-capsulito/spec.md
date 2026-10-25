# Feature Specification: Inicio centrado en el café, Capsulito gamberro y pulido de la interfaz (F11)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-25

**Status**: Aprobada por la persona usuaria el 2026-10-25. Traspasada a `historias.md` v0.22.0 (CAMBIO-022). Constitución enmendada a 1.8.0 (principios X y XVIII).

**Input**: User description: "Fallos y maquetación detectados al usar la aplicación (compras, navegación, tour, escritorio, saldos, estadísticas, agua), Inicio centrado en registrar un café con todas las cápsulas compradas, Capsulito gamberro con 160 frases sin repetición por persona, Capsulito reactivo en el login, páginas de error con Capsulito, sección Ajustes, avatar ilustrado, foto al dar de alta, texto de privacidad con responsable y microinteracciones."

**Fuente**: decisiones de la persona usuaria en la sesión del 2026-10-25 (Clarifications). Las 160 frases literales están en el anexo [`frases.md`](frases.md), del que esta spec es dueña. Las reglas de `historias.md` que esta funcionalidad modifica están en «Impacto en las fuentes vigentes». Los IDs nuevos (RF-211 a RF-237, RN-088 y RN-089, CA-211 a CA-237, EV-107 a EV-111, DEC-119 a DEC-123) son una propuesta: se fijan al registrar el CAMBIO-022 en `historias.md`.

**Glosario de esta funcionalidad**: «saludo» es la frase con la que Capsulito recibe a la persona al abrir Inicio (RF-214). No se confunde con la «historia de bienvenida» de ocho escenas (RF-188, RF-195), que no cambia. «Frase de registro» es la frase que Capsulito dice al confirmarse un café (RF-213).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar un café desde un Inicio centrado en las cápsulas (Priority: P1)

Una persona abre la aplicación junto a la cafetera. Arriba ve a Capsulito con su mensaje y, justo debajo, todas las cápsulas que el departamento ha comprado alguna vez. Las que no tienen stock aparecen atenuadas con «Sin stock», y las que están en stock bajo llevan una marca de aviso. La hucha, su saldo, el agua y los últimos consumos quedan más abajo (o en una columna estrecha en escritorio).

**Why this priority**: el 95 % de las visitas son para registrar un café (RF-011). Hoy las cápsulas sin stock desaparecen y la persona no sabe si puede registrar la que acaba de coger.

**Independent Test**: con un tipo con stock, uno en stock bajo y otro con stock 0, abrir Inicio, comprobar el orden, las marcas y el registro de cada uno, también sin JavaScript.

**Acceptance Scenarios**:

1. **Given** una persona en Inicio, **When** la pantalla se carga, **Then** el orden es: Capsulito con su mensaje, las cápsulas, y después hucha, saldo, agua y últimos consumos. En escritorio, las cápsulas ocupan la columna principal y el resto una columna estrecha (CA-216).
2. **Given** un tipo activo con coste medio y stock ≤ 0, **When** se muestra Inicio, **Then** su tarjeta aparece atenuada con el texto «Sin stock» y un icono, y un tipo activo nunca comprado sigue sin aparecer (CA-217).
3. **Given** la tarjeta «Sin stock», **When** la persona la toca, **Then** aparece el diálogo «El sistema dice que no quedan. ¿Has cogido una igualmente?» con «Sí, registrar» y «Cancelar»; con «Cancelar» no se registra nada (CA-217).
4. **Given** el diálogo anterior, **When** la persona pulsa «Sí, registrar», **Then** se registra el consumo como con stock ≤ 0 hoy: el stock baja a −1 o menos, se avisa del descuadre al autor y a los administradores, y se ofrece «Deshacer» (CA-017, CA-217).
5. **Given** un tipo con stock por debajo o igual a su umbral y mayor que 0, **When** se muestra Inicio, **Then** su tarjeta lleva una marca con icono y el texto «Quedan pocas», no solo un color, y se registra con un toque (CA-218).
6. **Given** el navegador sin JavaScript, **When** la persona envía la tarjeta «Sin stock», **Then** el servidor muestra una página intermedia con la misma pregunta y los dos botones, y al confirmar se registra el consumo (CA-217, EV-107).

---

### User Story 2 - Corregir los fallos de compras, navegación y tour (Priority: P1)

Una persona administradora registra una compra con varias líneas y se olvida de un importe. La aplicación le marca el campo sin importe y no le pide confirmar la hucha negativa con un importe de 0,00 €. La navegación muestra cada sección una vez. «Repetir el tour» funciona también estando en Inicio.

**Why this priority**: son fallos que restablecen el comportamiento aprobado en F10 (RF-197, RF-198, RF-204). El usuario creyó haber registrado una compra que no se guardó.

**Independent Test**: enviar una compra con una línea con cantidad y sin importe con la hucha en negativo; contar los enlaces de la navegación; pulsar «Repetir el tour» desde la ayuda de Inicio.

**Acceptance Scenarios**:

1. **Given** una compra con una línea con cantidad mayor que 0 y sin importe, **When** la persona pulsa «Registrar compra», **Then** el campo de importe de esa línea muestra un error de campo y no se abre el diálogo de hucha negativa, con o sin JavaScript (CA-211).
2. **Given** el diálogo de confirmación de hucha negativa abierto, **When** el envío falla por cualquier error, **Then** el error se ve en primer plano (el diálogo se cierra y el foco va al resumen de errores, o el error aparece dentro del diálogo); nunca queda tapado (CA-212).
3. **Given** cualquier pantalla autenticada, **When** se muestra la navegación lateral o inferior, **Then** cada destino aparece una sola vez (CA-229).
4. **Given** el panel de ayuda abierto en Inicio, **When** la persona pulsa «Repetir el tour», **Then** el panel se cierra y empieza el tour desde el primer paso, también sin JavaScript (CA-228).

---

### User Story 3 - Capsulito comenta cada café y saluda sin repetirse (Priority: P2)

Cada vez que una persona registra un café, propio o de invitado, Capsulito muestra en pantalla y dice, si la voz está activa, una de las 80 frases de registro. Al abrir Inicio, si han pasado al menos 2 horas desde su último saludo, Capsulito la recibe con una de las 80 frases de saludo. Una persona no oye la misma frase de una lista hasta haberlas oído todas.

**Why this priority**: da personalidad a la acción más repetida sin añadir pasos (constitución X, XVIII). No es imprescindible para registrar.

**Independent Test**: registrar 81 cafés con la misma cuenta desde dos dispositivos y comprobar que las 80 primeras frases son distintas; abrir Inicio dos veces seguidas y otra 2 horas después con un reloj falso.

**Acceptance Scenarios**:

1. **Given** una persona que registra un café propio o de invitado, **When** el servidor confirma el registro, **Then** Capsulito muestra una frase de registro de `frases.md` junto a la confirmación y, con la voz activa, la dice (CA-213).
2. **Given** un café en la cola sin conexión, **When** se muestra «Pendiente de enviar», **Then** no se muestra ninguna frase de registro ni se gasta del ciclo (CA-213).
3. **Given** una persona cuyo último saludo fue hace 2 horas o más (o que nunca tuvo uno), **When** abre Inicio, **Then** Capsulito muestra un saludo de `frases.md`; si también hay tipos en stock bajo, el aviso de stock bajo se muestra después del saludo (CA-214).
4. **Given** una persona cuyo último saludo fue hace menos de 2 horas, **When** abre Inicio, **Then** no recibe saludo y Capsulito muestra el aviso que corresponda o su estado de reposo (CA-214).
5. **Given** una persona que ha oído 79 de las 80 frases de una lista, **When** recibe la siguiente, **Then** es la única que le faltaba; con la siguiente empieza un ciclo nuevo en orden aleatorio, en cualquier dispositivo (CA-215).
6. **Given** la mascota desactivada en el dispositivo, **When** se registra un café, **Then** se muestra la confirmación de siempre sin frase ni voz (CA-213).
7. **Given** el catálogo de locuciones, **When** se comprueba, **Then** contiene las 160 frases con su texto visible idéntico al de `frases.md` y un texto de voz con etiquetas de ElevenLabs v3 que conserva las mismas palabras (CA-237).

---

### User Story 4 - Ajustes personales, Perfil, avatar, foto al dar de alta y privacidad (Priority: P2)

Cada persona encuentra en «Ajustes» la apariencia, Capsulito y su voz, las notificaciones y la instalación de la app. Perfil se queda con sus datos, su foto, la contraseña y las sesiones, en dos columnas en escritorio. Quien no tiene foto ve un avatar ilustrado. Un administrador puede poner la foto al dar de alta a alguien. El texto de privacidad nombra al responsable y al gestor.

**Why this priority**: ordena pantallas que hoy obligan a hacer mucho desplazamiento y completa el trabajo de fotos de F10.

**Independent Test**: abrir Ajustes con una cuenta normal y una administradora; dar de alta una persona con foto; ver a una persona sin foto en Saldos; abrir el texto de privacidad.

**Acceptance Scenarios**:

1. **Given** cualquier persona con sesión, **When** abre «Ajustes», **Then** encuentra tema, «Reducir transparencia», «Mostrar a Capsulito», la voz, las notificaciones y la instalación; esos controles ya no están en Perfil y se siguen guardando en el dispositivo o en la cuenta como hoy (CA-220).
2. **Given** una persona que no es administradora, **When** mira la navegación, **Then** ve «Ajustes» y no ve «Configuración» (CA-220).
3. **Given** Perfil en escritorio, **When** se muestra, **Then** datos y foto ocupan una columna y contraseña y sesiones la otra; en móvil, una sola columna (CA-221).
4. **Given** una persona sin foto, **When** aparece su avatar, **Then** se muestra una ilustración (taza, cápsula, grano…) sobre su color cálido estable, con contraste de 3:1 como mínimo en claro y oscuro y el nombre de la persona como nombre accesible (CA-222).
5. **Given** un administrador en el alta de usuario, **When** adjunta una foto válida, **Then** la persona se crea con esa foto; una foto no válida (RF-005) se rechaza con un error de campo y no crea la persona (CA-223).
6. **Given** el texto de privacidad, **When** se muestra, **Then** nombra a «Mardomingo Software» como responsable y a «Daniel Diez Mardomingo» como gestor, «contacta con él en persona o por el canal interno del departamento», sin correo ni teléfono; al ser una versión nueva, cada persona la vuelve a ver al entrar (RF-160, CA-224).

---

### User Story 5 - Capsulito reacciona en el inicio de sesión (Priority: P2)

En la pantalla de entrada, Capsulito mira el correo mientras se escribe, se tapa los ojos al escribir la contraseña, se entristece si la entrada falla y celebra si acierta.

**Why this priority**: es la primera impresión de la aplicación; no afecta a ningún dato.

**Independent Test**: entrar con una contraseña errónea y después con la correcta, con y sin movimiento reducido, y sin JavaScript.

**Acceptance Scenarios**:

1. **Given** la pantalla de entrada con JavaScript y sin movimiento reducido, **When** la persona escribe el correo, **Then** Capsulito mira hacia la posición del texto; **When** pasa a la contraseña, **Then** se tapa los ojos (CA-225).
2. **Given** una entrada fallida, **When** se muestra el error, **Then** Capsulito pone cara triste; el mensaje de error es el de siempre y se anuncia sin depender de la animación (CA-225).
3. **Given** una entrada correcta con JavaScript, **When** la sesión empieza, **Then** Capsulito celebra sin retrasar la navegación a Inicio más de lo que tarda hoy (CA-225).
4. **Given** `prefers-reduced-motion: reduce`, sin JavaScript o si la animación no carga, **When** se muestra la pantalla, **Then** aparece la imagen estática de Capsulito y el formulario funciona igual (CA-225).

---

### User Story 6 - Pantallas que aprovechan el escritorio y dicen lo que pasa (Priority: P2)

En escritorio, la ficha de cápsula y el detalle de compra se reparten en columnas con campos de un ancho razonable. Saldos alinea sus filas y separa la columna derecha. Estadísticas muestra sus datos sin desplegar nada. Al registrar el agua, Capsulito también lo dice en pantalla.

**Why this priority**: mejora la lectura y el uso sin cambiar reglas.

**Independent Test**: abrir cada pantalla a 1440 px y a 390 px de ancho y comparar con las capturas de referencia; pulsar «He rellenado el agua».

**Acceptance Scenarios**:

1. **Given** la ficha de una cápsula a 1024 px o más, **When** se muestra, **Then** los campos se reparten en dos columnas; a menos ancho, en una (CA-230).
2. **Given** el detalle de una compra a 1024 px o más, **When** se muestra, **Then** el motivo de anulación y su botón tienen un ancho acotado y las líneas y el resumen se reparten en columnas (CA-230).
3. **Given** Saldos, **When** se muestra, **Then** las filas de cada columna están alineadas y la columna derecha está sobre un panel con borde y un fondo de superficie más clara de los tokens (CA-231).
4. **Given** Estadísticas, **When** se carga, **Then** cada «Ver datos» está abierto por defecto y se puede cerrar (CA-232).
5. **Given** una persona que pulsa «He rellenado el agua», **When** el servidor lo registra, **Then** Capsulito muestra en pantalla el mismo mensaje que dice con la voz, y se anuncia al lector de pantalla (CA-219).

---

### User Story 7 - Capsulito narra el tour y la ayuda, y da la cara en los errores (Priority: P3)

En el tour de Inicio y en el panel de ayuda, Capsulito aparece junto al texto de cada paso y lo dice con la voz activa. Las páginas de error 400, 403, 404 y 500 muestran a Capsulito con una pose y un texto gamberro por tipo; la 500 muestra además el código de incidencia.

**Why this priority**: refuerza la identidad, pero las pantallas ya funcionan sin ello.

**Independent Test**: recorrer el tour; abrir una ruta inexistente, una prohibida, una petición mal formada y forzar un error interno.

**Acceptance Scenarios**:

1. **Given** el tour de Inicio o el panel de ayuda, **When** se muestra un paso, **Then** Capsulito aparece junto al texto con la pose del catálogo para ese paso y, con la voz activa, lo dice; el texto contiene siempre el mensaje completo (CA-227).
2. **Given** una ruta inexistente, prohibida o una petición mal formada, **When** se muestra el error, **Then** la página 404, 403 o 400 muestra a Capsulito, un texto propio, qué ha pasado y qué puede hacer la persona, y un enlace a Inicio (CA-226).
3. **Given** un fallo técnico, **When** se muestra la página 500, **Then** incluye el identificador de operación como código de incidencia y ningún detalle interno (constitución XIII, CA-226).

---

### User Story 8 - Microinteracciones que confirman y orientan (Priority: P3)

Los campos muestran un haz al recibir el foco, una sacudida breve con error y una entrada suave del mensaje. Casillas e interruptores responden al cambiar, el selector de tema y las pestañas tienen un indicador que se desliza, las tarjetas brillan en el borde bajo el puntero, los botones de guardar muestran un check cuando el servidor confirma, y las cifras de saldo y hucha se animan al cambiar.

**Why this priority**: es estética (último lugar del orden de prioridad de la constitución) y no debe costar nada a lo anterior.

**Independent Test**: recorrer cada componente con y sin `prefers-reduced-motion`; medir que el registro de un café no se retrasa.

**Acceptance Scenarios**:

1. **Given** un campo con error tras un envío, **When** se muestra el error, **Then** el campo se sacude una vez y el mensaje entra suavemente; con movimiento reducido, el error aparece sin movimiento (CA-233).
2. **Given** el selector de tema o un grupo de pestañas, **When** cambia la opción, **Then** el indicador se desliza hasta la opción elegida y sigue siendo correcto al cambiar el tamaño de la ventana (CA-234).
3. **Given** un dispositivo con puntero fino, **When** el puntero pasa sobre una tarjeta, **Then** su borde brilla alrededor del puntero; en pantallas táctiles no hay brillo (CA-235).
4. **Given** un botón de guardar, **When** el servidor confirma el guardado, **Then** el botón muestra un check durante un momento; si el servidor rechaza, no aparece (CA-236).
5. **Given** una cifra de saldo o de hucha que cambia, **When** se actualiza, **Then** el número pasa del valor anterior al nuevo en menos de 300 ms y el lector de pantalla recibe solo el valor final (CA-236).

---

### Edge Cases

- Dos dispositivos de la misma persona piden una frase a la vez: cada uno recibe una frase distinta y ninguna se pierde del ciclo (EV-108).
- El catálogo de frases cambia (se quita o añade una): las frases que ya no existen se ignoran en el ciclo y las nuevas entran como no oídas.
- Falta el audio de una frase: Capsulito la muestra sin voz y no se produce ningún error visible.
- La persona toca una cápsula «Sin stock» sin conexión: se muestra el mismo diálogo; al confirmar, el consumo entra en la cola como «Pendiente de enviar» (RF-017 se aplica al enviarse).
- El stock cambia entre la carga de Inicio y el toque (otra persona compra o consume): el servidor decide con el stock real; si ya hay stock, la confirmación no se pide en el servidor, y si ya no lo hay, el consumo confirmado con un toque normal se registra igual que hoy (RF-017).
- El café de invitado sobre un tipo «Sin stock» pide la misma confirmación.
- «Deshacer» un café que mostró frase: la frase cuenta como oída igualmente.
- Un saludo y el aviso de stock bajo coinciden: primero el saludo, después el aviso. Si la persona registra un café antes, la frase de registro sustituye a los dos.
- Una persona abre Inicio en dos pestañas en menos de 2 horas: solo la primera recibe saludo.
- Un error 500 en la propia página de error: se muestra la página mínima del servidor, sin Capsulito.
- Un administrador quita la foto a una persona: vuelve su avatar ilustrado.
- Al dar de alta una persona con foto, el alta falla por otro campo: sin JavaScript la foto se debe volver a adjuntar (constitución XVII: `valores` no contiene archivos) y el formulario lo indica.

## Requirements *(mandatory)*

### Functional Requirements

**Fallos de compras, navegación y tour (restablecen F10)**

- **RF-211** (aclara RF-197 y RF-198): Una línea de compra con cantidad mayor que 0 y sin importe, o con importe 0, deberá rechazarse con un error en el campo de importe de esa línea. La comprobación se hace antes de evaluar la hucha negativa: con una línea así no se abre el diálogo de confirmación.
- **RF-212**: Ningún error de envío deberá quedar tapado por un diálogo. Si el envío desde un diálogo falla, el diálogo se cierra y el foco va al resumen de errores, o el error se muestra dentro del diálogo.
- **RF-228** (restablece RF-204): «Repetir el tour» deberá empezar el tour de Inicio desde el primer paso desde cualquier pantalla, también estando ya en Inicio y sin JavaScript.
- **RF-229**: La navegación deberá mostrar cada destino una sola vez para cada rol.

**Inicio**

- **RF-216**: Inicio deberá mostrar, en este orden: Capsulito con su mensaje; las cápsulas; la hucha, el saldo propio, el agua y los últimos consumos. A 1024 px o más, las cápsulas ocupan la columna principal y el resto, una columna lateral estrecha.
- **RF-217** (modifica RF-011 y RN-006 en Inicio): Inicio deberá mostrar todos los tipos activos con coste medio, también los de stock ≤ 0. Un tipo con stock ≤ 0 se muestra atenuado con icono y el texto «Sin stock». Al tocarlo, el sistema deberá preguntar «El sistema dice que no quedan. ¿Has cogido una igualmente?» con «Sí, registrar» y «Cancelar». Al confirmar, se aplica RF-017. Sin JavaScript, la pregunta es una página intermedia. Los tipos activos sin coste medio siguen sin mostrarse. Para los tipos con stock mayor que 0, RF-011 no cambia: un solo toque.
- **RF-218**: Un tipo con stock mayor que 0 y menor o igual que su umbral (RF-002) deberá llevar una marca con icono y el texto «Quedan pocas».
- **RF-219**: Al registrar el relleno del agua, Capsulito deberá mostrar en pantalla el mismo mensaje que dice con la voz, anunciado al lector de pantalla.

**Frases de Capsulito**

- **RF-213** (sustituye las frases de «café apuntado» y «café de invitado» de RF-187): Cuando el servidor confirma un café propio o de invitado, Capsulito deberá mostrar y, con la voz activa, decir una frase de registro de `frases.md`. Un café pendiente de enviar no muestra frase. Con la mascota desactivada no hay frase.
- **RF-214**: Al abrir Inicio, si la persona no ha recibido ningún saludo o el último se mostró hace 2 horas o más, Capsulito deberá mostrar y, con la voz activa, decir un saludo de `frases.md`. El saludo tiene prioridad sobre el aviso de stock bajo, que se muestra después.
- **RF-215**: El servidor deberá elegir cada frase de registro y cada saludo según RN-088, guardando el ciclo de cada lista en la cuenta de la persona.
- **RF-237** (amplía RF-187 y DEC-115): El catálogo de locuciones deberá incluir las 160 frases, con el texto visible literal de `frases.md` y el texto de voz con etiquetas de expresión de ElevenLabs v3. La persona usuaria genera los audios con `./voces.sh` o `./voces.ps1`.
- **RN-088**: Para cada persona y cada lista (registro, saludo), una frase no se repite hasta que la persona ha recibido todas las de la lista. Cada frase se elige al azar entre las no recibidas del ciclo actual. Cuando no queda ninguna, empieza un ciclo nuevo con todas. Una frase cuenta como recibida cuando el servidor la entrega, aunque después se deshaga el café.
- **RN-089**: El instante del último saludo se guarda en UTC en la cuenta; el intervalo de 2 horas se mide sobre el instante del servidor.

**Ajustes, Perfil, personas y privacidad**

- **RF-220** (modifica RF-187, RF-102 y RF-206 en su ubicación): Toda persona con sesión deberá tener una sección «Ajustes» con: tema, «Reducir transparencia», «Mostrar a Capsulito», la voz, las notificaciones y la instalación de la app. Cada ajuste se guarda donde se guarda hoy (dispositivo o cuenta). «Configuración» sigue siendo solo para administradores.
- **RF-221**: Perfil deberá contener los datos de la persona, su foto, el cambio de contraseña y las sesiones, en dos columnas a 1024 px o más.
- **RF-222** (modifica RF-209): Una persona sin foto deberá mostrarse con una ilustración de un catálogo (taza, cápsula, grano y otras), elegida de forma estable a partir de su identificador, sobre su color cálido estable de los tokens, con contraste de 3:1 como mínimo en claro y oscuro. El nombre accesible es el nombre de la persona.
- **RF-223** (amplía RF-208): El alta de usuario deberá permitir adjuntar una foto opcional con las validaciones de RF-005. Una foto no válida rechaza el alta con un error de campo.
- **RF-224** (modifica el Anexo A): El texto de privacidad deberá nombrar como responsable a «Mardomingo Software» y como gestor a «Daniel Diez Mardomingo», con la indicación «contacta con él en persona o por el canal interno del departamento», sin correo ni teléfono. Entre los datos guardados, deberá incluir «Las frases de Capsulito que ya te ha dicho y la hora de su último saludo, para no repetírtelas» (RN-088, RN-089). Es una versión nueva del texto (RF-160).

**Inicio de sesión y errores**

- **RF-225**: La pantalla de entrada deberá mostrar a Capsulito animado, que mira hacia el texto del correo mientras se escribe, se tapa los ojos con el foco en la contraseña, pone cara triste tras una entrada fallida y celebra tras una correcta. La animación es un archivo Rive nuevo con respaldo SVG estático inmediato, y se queda estática con `prefers-reduced-motion: reduce` o sin JavaScript.
- **RF-226**: Las respuestas de error 400, 403, 404 y 500 deberán mostrar una página con Capsulito, una pose y un texto propios de cada tipo del catálogo de la mascota, qué ha pasado, qué puede hacer la persona y un enlace a Inicio. La 500 muestra el identificador de operación como código de incidencia (constitución XIII). Otros códigos usan la página del tipo más cercano (4xx → 400, 5xx → 500).
- **RF-227** (amplía RF-203 y RF-204): En el tour de Inicio y en el panel de ayuda, Capsulito deberá aparecer junto al texto de cada paso, con la pose del catálogo para ese paso, y decirlo con la voz activa.

**Maquetación**

- **RF-230**: A 1024 px o más, la ficha de cápsula deberá repartir sus campos en dos columnas, y el detalle de compra deberá acotar el ancho del motivo de anulación y de su botón y repartir las líneas y el resumen en columnas.
- **RF-231**: Saldos deberá alinear las filas de sus columnas y mostrar la columna derecha sobre un panel con borde y fondo de una superficie más clara de los tokens.
- **RF-232**: En Estadísticas, cada «Ver datos» deberá estar abierto por defecto.

**Microinteracciones**

- **RF-233**: Los campos deberán mostrar un haz al recibir el foco, una sacudida única al mostrarse su error y una entrada suave del mensaje de error.
- **RF-234**: Casillas, botones de opción e interruptores deberán responder con un movimiento breve al cambiar. El selector de tema y los grupos de pestañas deberán tener un indicador que se desliza hasta la opción elegida.
- **RF-235**: Con un puntero fino, las tarjetas deberán mostrar un brillo de borde alrededor del puntero. Las tarjetas sobre cristal no lo duplican.
- **RF-236**: Un botón de guardar deberá mostrar un check breve solo cuando el servidor confirma el guardado. Las cifras de saldo y de hucha deberán pasar del valor anterior al nuevo en 300 ms o menos, y el lector de pantalla recibe solo el valor final.

### Non-Functional Requirements

- **Rapidez (RNF-002, constitución X)**: la frase de registro no retrasa la confirmación de un café: el consumo se confirma en 1 s o menos en el percentil 95 con red, con frase incluida. Ninguna microinteracción retrasa una respuesta.
- **Movimiento (constitución XI y XVIII)**: todas las microinteracciones, la animación del login y las poses de Capsulito se desactivan o quedan estáticas con `prefers-reduced-motion: reduce`. Cada movimiento confirma (sacudida, check), orienta (haz de foco, indicador, brillo bajo el puntero) o explica un cambio (cifras).
- **Accesibilidad (RT-008, constitución XI)**: Inicio, Ajustes, Perfil, el alta de usuario, la pantalla de entrada y las cuatro páginas de error superan axe en claro y oscuro. «Sin stock» y «Quedan pocas» no dependen solo del color. El diálogo de stock 0 recibe el foco y lo devuelve al cerrarse.
- **Contraste**: la tarjeta atenuada mantiene 4,5:1 en su texto; el avatar ilustrado, 3:1 en la ilustración sobre su color.
- **Privacidad (constitución V, VI y XVI)**: el ciclo de frases y el último saludo se guardan en el servidor, no en el navegador. Los logs no contienen el texto de las frases. El texto de privacidad no contiene correos ni teléfonos (repositorio público).
- **Mejora progresiva (constitución XVII)**: la confirmación de stock 0, la compra con error de importe, «Repetir el tour» y el alta con foto funcionan sin JavaScript.
- **Tono (DEC-119)**: las frases contienen tacos y se muestran tal cual a todas las personas, sin ajuste para suavizarlas.

### Out of Scope

- Generar los audios: los genera la persona usuaria con `./voces.sh` cuando el catálogo esté listo.
- Un ajuste para filtrar o suavizar las frases.
- Mostrar en Inicio los tipos que nunca se han comprado.
- Sincronizar entre dispositivos las preferencias que hoy se guardan en el dispositivo.
- Cambiar la historia de bienvenida de ocho escenas (RF-188).
- Rive en las microinteracciones: son solo CSS.

### Key Entities

- **Ciclo de frases** (por cuenta y lista): frases ya recibidas en el ciclo actual. Se reinicia al completarse.
- **Último saludo** (por cuenta): instante UTC del último saludo mostrado.
- **Catálogo de frases**: 80 de registro y 80 de saludo, con identificador estable, texto visible, texto de voz y pose.
- **Catálogo de avatares**: ilustraciones SVG para personas sin foto.
- **Catálogo de páginas de error**: pose y textos de 400, 403, 404 y 500.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona registra un café de un tipo con stock en un toque desde que se carga Inicio, sin desplazar la pantalla en un móvil de 390 × 664 px con hasta 8 tipos.
- **SC-002**: Una persona registra un café de un tipo «Sin stock» en dos toques (tarjeta y «Sí, registrar»).
- **SC-003**: En 80 frases seguidas de una lista, una persona no recibe ninguna repetida, con independencia del dispositivo.
- **SC-004**: Ninguna compra con una línea sin importe llega al diálogo de hucha negativa.
- **SC-005**: Perfil y Ajustes se leen sin desplazamiento vertical en una pantalla de 1440 × 900 px.
- **CA-211 a CA-237 y EV-107 a EV-111**: cada criterio tiene al menos una prueba que lo nombra y pasa. La verificación completa y la suite E2E pasan, y se mantienen los umbrales de cobertura de la constitución (VIII).

### Escenarios de verificación propuestos

- **EV-107**: Sin JavaScript, la confirmación de stock 0, la compra con un importe vacío, «Repetir el tour» desde Inicio y el alta con foto funcionan (proyecto `sin-js`).
- **EV-108**: Dos peticiones simultáneas de frase de la misma persona reciben frases distintas y el ciclo no pierde ni duplica ninguna (concurrencia con SQLite real).
- **EV-109**: Ajustes, Perfil, Inicio con los tres estados de stock, la pantalla de entrada y las páginas 400, 403, 404 y 500 no tienen infracciones de axe en claro y oscuro.
- **EV-110**: Con `prefers-reduced-motion: reduce`, ninguna microinteracción ni Capsulito anima nada (sin animaciones infinitas ni transiciones de movimiento).
- **EV-111**: La ruta de Ajustes entra en la suite `acceso` (EV-050): sin sesión redirige a la entrada y con sesión la abre cualquier rol.

## Impacto en las fuentes vigentes

**Constitución**. Enmienda MENOR aprobada y aplicada con `/speckit-constitution` (versión 1.8.0, 2026-10-25):

- **Principio X**: hoy dice «Registrar un consumo DEBE requerir un solo toque, sin pasos adicionales (RF-011)». RF-217 añade un paso cuando el stock es ≤ 0. Propuesta: «… un solo toque, sin pasos adicionales, salvo cuando el sistema indica que no queda stock, en que DEBE pedir una confirmación».
- **Principio XVIII**: la mascota «PUEDE aparecer en bienvenidas, estados vacíos, avisos y confirmaciones». RF-225 (pantalla de entrada), RF-226 (páginas de error) y RF-227 (narración) amplían esos lugares. Propuesta: añadir «la pantalla de entrada, las páginas de error y la ayuda».

Sin esta enmienda, las alternativas compatibles son: no pedir confirmación con stock 0 (registrar con un toque como hoy, con la tarjeta atenuada y el aviso tras el registro), y dejar a Capsulito fuera de la entrada y de los errores.

**`historias.md`**. Antes del plan, necesita un CAMBIO-022 autorizado, con respaldo, que recoja:

- **RF-011, CA-017 y RN-006 en Inicio**: tipos con stock ≤ 0 visibles y confirmación (RF-217). DEC-120.
- **RF-187**: frases de registro y saludo, ciclo sin repetición en el servidor y ubicación de los ajustes en «Ajustes» (RF-213 a RF-215, RF-220, RF-237). DEC-119 (tono), DEC-121 (ciclo en la cuenta).
- **RF-204**: narración y «Repetir el tour» (RF-227, RF-228).
- **RF-208 y RF-209**: foto al dar de alta y avatar ilustrado (RF-222, RF-223).
- **Anexo A**: responsable y gestor del tratamiento (RF-224).
- **Glosario**: «saludo» y «frase de registro».
- **Reglas nuevas**: RF-211 a RF-237 (excepto las modificaciones citadas), RN-088, RN-089, CA y EV correspondientes, DEC-122 (sección Ajustes separada de Configuración) y DEC-123 (animación de entrada construida con el CLI de Rive).

Comprobación con el resto de la constitución:

- **Principio IV**: el consumo con stock ≤ 0 sigue las reglas actuales (RF-017); el ciclo de frases no es un dato económico.
- **Principio V**: el ciclo y el último saludo van en la cuenta, no en el navegador. Los ajustes movidos a «Ajustes» siguen en el mismo almacén que hoy.
- **Principio XVI**: el registro técnico no incluye el texto de las frases ni los nombres; solo identificadores de frase.

## Assumptions

- El umbral de stock bajo es el de RF-002 por tipo; «Quedan pocas» y el aviso de Capsulito usan el mismo umbral.
- Si la persona tiene la mascota desactivada, no hay saludo ni frase, y no se gasta del ciclo.
- Las frases de registro sustituyen a las de «café apuntado» y «café de invitado»; las demás frases de Capsulito (stock, agua, compras…) no cambian.
- La pose de cada frase la elige el agente entre las existentes según el tono de la frase; la persona usuaria la revisa.
- Las ilustraciones del avatar y la animación de entrada las crea el agente; la persona usuaria revisa capturas antes de integrarlas.
- La página 403 sustituye a los mensajes genéricos de permiso denegado que hoy usan `error(403)`.
- El cambio de texto de privacidad es material (cambia el responsable), así que pide de nuevo la lectura a todas las personas (RF-160).
- La revisión manual con VoiceOver y TalkBack (constitución XI) se hace con un Android; la persona usuaria no tiene iPhone, como en F10.

## Clarifications

### Session 2026-10-25

Decisiones de la persona usuaria antes de redactar esta propuesta:

1. **Organización**: todo en F11, también los fallos.
2. **Stock ≤ 0 en Inicio**: tarjeta atenuada con «Sin stock» y confirmación «El sistema dice que no quedan. ¿Has cogido una igualmente?»; al confirmar, se registra como hoy. Sin JavaScript, paso intermedio.
3. **Qué cápsulas se muestran**: solo las que tienen precio (compradas alguna vez).
4. **Stock bajo**: marca de aviso con icono y texto.
5. **Tono de las frases**: tal cual para todas las personas, con tacos y sin ajuste.
6. **Cuándo se dicen las frases de registro**: en cada café, también de invitado; sustituyen a las actuales.
7. **Saludo**: al abrir Inicio, si han pasado 2 horas desde el último saludo mostrado. Tiene prioridad sobre el aviso de stock bajo, que va después.
8. **Sin repetición**: en el servidor, por cuenta, válido en todos los dispositivos.
9. **Voz**: las 160 frases con voz; la persona usuaria genera los audios con `./voces.sh`.
10. **Inicio**: Capsulito grande arriba, luego las cápsulas, luego hucha, saldo, agua y últimos consumos; en escritorio, cápsulas a la izquierda.
11. **Ajustes**: sección personal nueva para todas las personas; Perfil se queda con datos, foto, contraseña y sesiones; «Configuración» sigue siendo de administración.
12. **Avatar**: ilustración SVG creada por el agente sobre el color cálido de cada persona, en vez de iniciales.
13. **Foto en el alta de usuario**: sí, con las validaciones de RF-005.
14. **Privacidad**: responsable «Mardomingo Software»; gestor «Daniel Diez Mardomingo», con contacto en persona o por el canal interno; sin correo ni teléfono.
15. **Login**: Capsulito reactivo construido por el agente con el CLI de Rive, con capturas para revisar antes de integrarlo.
16. **Microinteracciones**: los cuatro bloques (campos y errores, selección y navegación, tarjetas con brillo, botón de éxito y cifras), solo CSS y desactivadas con movimiento reducido.
17. **Páginas de error**: una por tipo: 400, 403, 404 y 500.
18. **Narración**: Capsulito narra el tour de Inicio y el panel de ayuda.
19. **Privacidad del ciclo de frases**: la persona usuaria pidió añadir al texto de privacidad las frases ya dichas y el último saludo.
20. **Aprobación**: la persona usuaria aprobó la spec, la enmienda de la constitución (X y XVIII) y el CAMBIO-022 el 2026-10-25.
