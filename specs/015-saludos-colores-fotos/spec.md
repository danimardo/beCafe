# Feature Specification: Mensaje del día de Capsulito, colores y fotos de cápsula, encuadre de fotos y copias más claras (F15)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-27

**Status**: Aprobada por la persona usuaria el 2026-10-27. Traspasada a `historias.md` v0.27.0 (CAMBIO-027).

**Input**: User description: "Unos 40 mensajes de Capsulito distintos, uno al día sin repetir hasta verlos todos; quitar el rosa y añadir un selector de color libre; poder quitar la foto de una cápsula; encuadrar las fotos al elegirlas; copias de seguridad con secciones de colores."

**Fuente**: decisiones de la persona usuaria en la sesión del 2026-10-27 (apartado «Clarifications»). Las reglas de `historias.md` que esta funcionalidad modifica se citan por su ID y se traspasan con el CAMBIO-027, autorizado por la persona usuaria el 2026-10-27 y pendiente de que apruebe esta especificación (apartado «Impacto en las fuentes vigentes»).

**Glosario de esta funcionalidad**:

- **Saludo rotativo**: frase de Capsulito al abrir Inicio, como máximo una cada 2 horas y durante 6 s, elegida entre 80 con voz (RF-214, RN-088, RN-089). No cambia en esta funcionalidad.
- **Mensaje del día**: texto que muestra el bocadillo de Capsulito en Inicio cuando no hay un saludo rotativo, un evento ni un aviso. Hoy son los momentos «saludo de mañana» y «saludo de tarde», que muestran siempre el mismo texto. Pasa a ser uno por persona y día, elegido de un catálogo de unos 40.
- **Color propio**: color de una cápsula elegido con el selector libre, fuera de los colores fijos del sistema de diseño.
- **Encuadre**: zona cuadrada de una foto que la persona elige antes de guardarla.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capsulito no dice siempre lo mismo (Priority: P1)

Ana abre Inicio por la mañana y Capsulito le dice «¡Hola, Ana! Hoy huele a lunes, pero tranquila, que el café no lo sabe». Vuelve por la tarde y ve el mismo mensaje. Al día siguiente ve otro distinto. No vuelve a ver ninguno hasta que ha visto todos.

**Why this priority**: el bocadillo de Inicio está a la vista todo el día y hoy muestra siempre la misma frase («¿Qué cápsula compilamos hoy?»). La persona usuaria lo percibe como que Capsulito solo sabe decir eso.

**Independent Test**: con el reloj simulado, abrir Inicio varios días seguidos y comprobar que cada día hay un mensaje, que es el mismo durante el día y que no se repite ninguno hasta agotar el catálogo.

**Acceptance Scenarios**:

1. **Given** una persona sin avisos que abre Inicio, **When** se muestra el bocadillo sin saludo rotativo ni evento, **Then** muestra el mensaje del día de esa persona.
2. **Given** el mensaje del día ya asignado, **When** la persona vuelve a Inicio el mismo día (Madrid), en el mismo dispositivo o en otro, **Then** ve el mismo mensaje.
3. **Given** un día nuevo, **When** la persona abre Inicio, **Then** ve un mensaje elegido al azar entre los que no ha visto en la vuelta actual.
4. **Given** que la persona ya ha visto todos los mensajes del catálogo, **When** empieza un día nuevo, **Then** empieza una vuelta nueva con todos.
5. **Given** un día en que el bocadillo muestra un aviso (rechazo, pendientes, deuda, stock bajo o aguador del mes), **When** la persona abre Inicio, **Then** no se le asigna mensaje del día y no se gasta ninguno.
6. **Given** el mensaje del día, **When** se muestra, **Then** no se oye ninguna voz (solo texto) y el saludo rotativo, si toca, sigue saliendo como hasta ahora durante 6 s antes de dar paso al mensaje del día.

---

### User Story 2 - Elegir el color exacto de una cápsula (Priority: P2)

Un administrador da de alta «Ristretto Italiano». Ve 7 colores fijos y, como octava opción, un selector de color. Elige un verde que se parece al de la caja. La tarjeta se ve en ese verde, con el texto legible en tema claro y oscuro.

**Why this priority**: los 8 colores fijos no coinciden con las cápsulas reales y el rosa no se usa.

**Independent Test**: dar de alta una cápsula con un color propio muy claro y otra con uno muy oscuro, y comprobar en claro y oscuro que el texto y el borde de su tarjeta cumplen el contraste.

**Acceptance Scenarios**:

1. **Given** el formulario de alta o edición de una cápsula, **When** se ve el campo de color, **Then** ofrece 7 colores fijos (sin el rosa) y una octava opción «Otro color» con un selector.
2. **Given** «Otro color», **When** el administrador elige un color y guarda, **Then** la cápsula se muestra con ese color en todas las pantallas.
3. **Given** una cápsula con color propio, **When** se ve su tarjeta o su ilustración en tema claro u oscuro, **Then** el texto sobre el color tiene un contraste de al menos 4,5:1 y su borde o límite, de al menos 3:1.
4. **Given** una cápsula que ya tenía el color rosa, **When** se edita, **Then** el campo muestra el rosa como su color actual; al cambiarlo por otro, el rosa ya no se puede volver a elegir.
5. **Given** un color propio con formato no válido enviado al servidor, **When** se guarda, **Then** se rechaza con un mensaje en el campo de color.

---

### User Story 3 - Quitar la foto de una cápsula (Priority: P2)

Un administrador subió una foto borrosa de una cápsula. En la edición pulsa «Quitar foto». La cápsula vuelve a mostrarse con su ilustración de color.

**Why this priority**: hoy una foto guardada no se puede quitar, solo sustituir.

**Independent Test**: editar una cápsula con foto, quitarla y comprobar que se muestra la ilustración y que el archivo ya no existe; repetir sin JavaScript.

**Acceptance Scenarios**:

1. **Given** la edición de una cápsula con foto, **When** el administrador pulsa «Quitar foto», **Then** la cápsula queda sin foto, se muestra con su ilustración de color (RF-185) y el archivo de la foto se borra.
2. **Given** una cápsula sin foto, **When** se edita, **Then** no aparece «Quitar foto».
3. **Given** el navegador sin JavaScript, **When** se pulsa «Quitar foto», **Then** el resultado es el mismo.

---

### User Story 4 - Encuadrar la cara al elegir una foto (Priority: P2)

Un administrador da de alta a Beto con una foto vertical de cuerpo entero. Al elegirla, ve la foto en un marco cuadrado con un círculo que muestra cómo quedará el avatar. Arrastra la foto y hace zoom hasta que la cara queda dentro del círculo. Guarda y el avatar muestra la cara.

**Why this priority**: hoy la foto se recorta sola por el centro. En una foto vertical o apaisada, el avatar puede mostrar el cuerpo o el fondo en lugar de la cara.

**Independent Test**: elegir una foto vertical, encuadrar la parte de arriba y comprobar que la foto guardada contiene solo esa zona.

**Acceptance Scenarios**:

1. **Given** el alta de una persona, el cambio de foto de una persona en Usuarios o la foto propia en Perfil, **When** se elige una foto, **Then** aparece en un marco cuadrado con una guía redonda que muestra el avatar, y se puede mover y ampliar.
2. **Given** el alta o la edición de una cápsula, **When** se elige una foto, **Then** aparece en un marco cuadrado, sin guía redonda, y se puede mover y ampliar.
3. **Given** el encuadre, **When** se usa con el teclado, **Then** las flechas mueven la foto, dos controles con nombre accesible la amplían y la reducen, y el foco es visible.
4. **Given** un encuadre elegido, **When** se guarda el formulario, **Then** la foto guardada contiene solo la zona del marco, con las validaciones de RF-005.
5. **Given** el navegador sin JavaScript, **When** se envía una foto, **Then** se guarda el recorte cuadrado central de la foto.
6. **Given** una zona de encuadre que no cabe en la foto o no es válida, **When** llega al servidor, **Then** se rechaza con un mensaje en el campo de foto y no se guarda nada.

---

### User Story 5 - Distinguir las secciones de Copias de seguridad (Priority: P3)

Un administrador abre «Copias de seguridad» y distingue de un vistazo el estado de las copias, la lista del bucket, la zona de restaurar y la de anotar una prueba.

**Why this priority**: todas las secciones tienen el mismo fondo y la pantalla resulta sosa y difícil de recorrer. La zona de restaurar sustituye todos los datos y debe destacar como zona de cuidado.

**Independent Test**: abrir la pantalla en claro y oscuro y comprobar el fondo, el borde y el icono de cada sección, y que axe no encuentra infracciones.

**Acceptance Scenarios**:

1. **Given** la pantalla de copias, **When** se ve, **Then** el estado de las copias tiene fondo de acento suave, la lista del bucket va sobre una superficie elevada con borde, la restauración va sobre fondo de advertencia suave y anotar una prueba tiene fondo neutro.
2. **Given** cada sección, **When** se ve, **Then** lleva un icono junto a su título. El color no es la única señal: el título y el icono identifican la sección.
3. **Given** tema claro u oscuro, **When** se ve la pantalla, **Then** el texto de cada sección tiene un contraste de al menos 4,5:1 sobre su fondo.

---

### Edge Cases

- **Mensaje del día a medianoche.** Si la persona tiene Inicio abierto al cambiar el día (Madrid), conserva el mensaje hasta que vuelve a entrar o recarga.
- **Aviso que desaparece durante el día.** Si por la mañana había un aviso de stock bajo y por la tarde ya no, al abrir Inicio por la tarde se asigna el mensaje del día.
- **Dos dispositivos a la vez el primer día.** Las dos pantallas reciben el mismo mensaje: el servidor asigna uno solo por persona y día.
- **Catálogo que cambia.** Si se añaden o quitan mensajes, los ya vistos que ya no existen no cuentan y los nuevos entran en la vuelta actual.
- **Sin JavaScript.** Inicio muestra el mensaje del día en el bocadillo con el primer renderizado del servidor.
- **Persona que entra pocos días.** El mensaje solo se gasta los días en que se ve, así que recorre todos igual, más despacio.
- **Color propio casi igual al fondo.** El borde o límite de la tarjeta asegura el contraste de 3:1 con el fondo en los dos temas.
- **Color rosa en una cápsula retirada.** Se conserva al reactivarla.
- **Foto muy pequeña.** El encuadre no amplía por encima del tamaño original; si la foto es más pequeña que el lado mínimo guardado, se guarda tal cual dentro del cuadrado.
- **Foto con orientación EXIF.** El encuadre y el recorte usan la foto ya girada según su orientación.
- **Quitar la foto en mitad de una edición.** «Quitar foto» es un formulario aparte; los cambios no guardados del formulario principal se pierden y la pantalla lo avisa en su texto de ayuda.

## Requirements *(mandatory)*

### Functional Requirements

**Mensaje del día (US1)**

- **RF-266**: El bocadillo de Capsulito en Inicio deberá mostrar el mensaje del día de la persona cuando no muestra un saludo rotativo (RF-214), la reacción a un evento ni un aviso (rechazo, pendientes, deuda, stock bajo o aguador del mes). Sustituye a los mensajes fijos «saludo de mañana» y «saludo de tarde». El mensaje es solo texto y vale a cualquier hora.
- **RF-267**: El catálogo de mensajes del día deberá tener al menos 40 textos, campechanos y con humor, sin datos de la persona (saldo, consumos ni deudas). Un texto puede incluir el nombre de pila de la persona.
- **RN-091**: Cada persona tiene como máximo un mensaje del día por día natural (Europe/Madrid), el mismo en todos sus dispositivos. El primer día que Inicio lo muestra, el servidor lo elige al azar entre los del catálogo que la persona no ha recibido en la vuelta actual; cuando no queda ninguno, empieza una vuelta nueva con todos. Un día en que el bocadillo muestra un aviso, no se asigna mensaje del día y no se gasta ninguno. La asignación se guarda en la cuenta.
- **RF-268**: El servidor deberá asignar y guardar el mensaje del día de cada persona (RN-091), de forma que dos peticiones simultáneas del mismo día reciban el mismo mensaje.

**Colores de cápsula (US2)**

- **RF-269**: El campo de color de una cápsula deberá ofrecer 7 colores fijos (los actuales sin el rosa) y la opción «Otro color» con un selector de color libre. Una cápsula que ya tiene el rosa lo conserva y lo muestra como su color actual, pero el rosa no se ofrece para elegirlo. Modifica RF-001 y RF-003.
- **RF-270**: Con un color propio, la aplicación deberá elegir el color del texto y del borde de la tarjeta y de la ilustración de la cápsula para cumplir un contraste de al menos 4,5:1 en el texto y 3:1 en los límites, en tema claro y oscuro, y deberá ajustar el tono del color en tema oscuro de forma estable (siempre el mismo resultado para el mismo color).
- **RF-271**: El servidor deberá aceptar como color propio solo un color sRGB opaco en formato hexadecimal de 6 cifras y rechazar cualquier otro valor con un mensaje en el campo.

**Foto de cápsula (US3)**

- **RF-272**: Un administrador deberá poder quitar la foto de una cápsula desde su edición. La cápsula queda sin foto, se muestra con su ilustración (RF-185) y el archivo se borra. Funciona sin JavaScript y queda en la auditoría. Modifica RF-003.

**Encuadre de fotos (US4)**

- **RF-273**: Al elegir una foto de persona (alta, cambio en Usuarios y Perfil) o de cápsula (alta y edición), la aplicación deberá permitir encuadrarla en un marco cuadrado moviéndola y ampliándola, con el ratón, el dedo y el teclado. En las fotos de persona, una guía redonda muestra el avatar; en las de cápsula, no. Modifica RF-005 y RF-208.
- **RF-274**: El servidor deberá recortar la foto con la zona elegida, después de aplicar su orientación, y aplicar RF-005. Sin zona elegida (por ejemplo, sin JavaScript), deberá guardar el cuadrado central. Una zona fuera de la foto o no válida se rechaza con un mensaje en el campo y no se guarda nada.

**Copias de seguridad (US5)**

- **RF-275**: La pantalla «Copias de seguridad» deberá distinguir sus secciones con un fondo según su función y un icono junto a cada título: estado de las copias con fondo de acento suave; lista del bucket sobre superficie elevada con borde; restauración con fondo de advertencia suave; anotar una prueba con fondo neutro. Precisa RF-253 a RF-257.

### Non-Functional Requirements

- **RNF-F15-1**: Las pantallas tocadas (Inicio, Cápsulas, Usuarios, Perfil y Copias de seguridad) deberán pasar axe sin infracciones en tema claro y oscuro (constitución XI).
- **RNF-F15-2**: El encuadre deberá ser operable con teclado, tener nombre accesible en cada control y anunciar el cambio de zoom sin mover el foco (constitución XI).
- **RNF-F15-3**: Asignar el mensaje del día no deberá retrasar el primer renderizado de Inicio más de 50 ms en el percentil 95 (constitución, orden de prioridad 4).
- **RNF-F15-4**: Ningún evento del registro técnico deberá incluir el texto del mensaje, el color ni datos de la foto; solo identificadores y códigos (constitución XVI).

### Out of Scope

- Cambiar el saludo rotativo (sus 80 frases, su voz, su intervalo de 2 horas, su duración de 6 s o su prioridad sobre el aviso de stock bajo).
- Voz para los mensajes del día. Se puede añadir más adelante.
- Encuadre de la foto del ticket de compra.
- Editar el encuadre de una foto ya guardada sin volver a elegirla.
- Filtros, giro manual o retoque de las fotos.
- Colores propios para las personas o para la interfaz.
- El benchmark completo de la funcionalidad, salvo que la persona usuaria lo pida.

### Key Entities

- **Mensaje del día**: entrada del catálogo tipado de Capsulito. Atributos: identificador estable y texto (puede llevar `{nombre}`).
- **Asignación del mensaje del día**: por persona y día. Atributos: persona, día (Madrid), mensaje, vuelta.
- **Color de cápsula**: uno de los 7 colores fijos, el rosa heredado o un color propio (hexadecimal de 6 cifras).
- **Zona de encuadre**: cuadrado dentro de la foto. Atributos: posición y lado, relativos a la foto ya orientada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En 40 días seguidos con Inicio abierto y sin avisos, una persona ve 40 mensajes del día distintos.
- **SC-002**: En el 100 % de los casos, una persona ve el mismo mensaje del día en todas sus visitas y dispositivos de ese día.
- **SC-003**: Un administrador elige un color propio en 2 pasos (elegir «Otro color» y elegirlo) y la tarjeta cumple 4,5:1 en texto y 3:1 en límites en los dos temas para cualquier color.
- **SC-004**: Un administrador quita la foto de una cápsula en 1 paso.
- **SC-005**: Con una foto vertical de cuerpo entero, un administrador consigue un avatar que muestra la cara en menos de 30 s.
- **SC-006**: Las cuatro secciones de Copias de seguridad tienen fondos distinguibles y pasan axe en claro y oscuro.

### Escenarios de verificación propuestos

- **EV-114**: Mensaje del día con el reloj simulado: 40 días sin repetir, el mismo mensaje en dos peticiones simultáneas del mismo día y ningún mensaje gastado en un día con aviso.
- **EV-115**: Contraste de un color propio: para una muestra de colores (blanco, negro, grises, saturados y casi iguales al fondo), el texto y el borde calculados cumplen 4,5:1 y 3:1 en los dos temas.

## Muestra de mensajes del día (para validar el tono)

La persona usuaria revisa esta muestra antes de escribir el catálogo completo:

1. «¡Hola, {nombre}! Hoy huele a lunes, pero tranquila, que el café no lo sabe.»
2. «Aquí sigo, de guardia junto a la cafetera. Tú tranquilo, que yo vigilo.»
3. «¿Un café? Venga, que hoy has venido con cara de necesitarlo.»
4. «{nombre}, te he guardado sitio. Bueno, en realidad no hay sitios, pero queda bonito.»
5. «Dicen que el café no quita el sueño. Yo digo que lo aplaza.»
6. «¡Buenas! Las cápsulas y yo hemos votado y tú eres nuestra persona favorita de hoy.»
7. «Si alguien te pregunta, la reunión podía haber sido un correo. Y un café.»
8. «Hoy me siento productivo. He contado las cápsulas dos veces. Me salen las mismas.»
9. «¡Hola, {nombre}! ¿Te sabes el chiste del café? Es muy cortito. Como el ristretto.»
10. «La cafetera ha pitado. No sé si es una señal o que está caliente. Por si acaso, café.»

## Impacto en las fuentes vigentes

Cambios de `historias.md` (CAMBIO-027). La persona usuaria autorizó el cambio el 2026-10-27. Se aplica con un respaldo en `.respaldos/` cuando apruebe esta especificación:

- **Nuevos**: RN-091, RF-266 a RF-275, CA-266 a CA-275, EV-114, EV-115 y DEC-135 a DEC-138 (mensaje del día; selector de color con contraste garantizado; encuadre en el servidor con recorte central sin JavaScript; colores de la pantalla de copias).
- **Modificados**:
  - RF-001 y RF-003: el color puede ser uno de 7 fijos o un color propio; el rosa solo se conserva en las cápsulas que ya lo tienen. RF-003 añade quitar la foto.
  - RF-005: la foto se recorta con la zona de encuadre o, sin ella, por el centro.
  - RF-208: el encuadre se aplica también a las fotos de persona.
  - RF-214: el bocadillo, tras el saludo rotativo, muestra el mensaje del día en lugar del mensaje fijo de mañana o tarde.
  - RF-224 y anexo A (texto de privacidad): entre los datos guardados se añaden los mensajes del día ya mostrados. Es una versión nueva del texto (RF-160).
  - Glosario: «Mensaje del día», «Color propio» y «Encuadre».
- `ARCHITECTURE.md`: el plan decide dónde viven la asignación del mensaje del día (módulo `usuarios`, junto a las frases) y el cálculo de contraste del color propio (`lib/shared`).
- **Constitución**: necesita una enmienda MENOR antes del plan. Los principios X («NO DEBE usar colores ni estilos fuera de los tokens») y XVIII («La interfaz DEBE usar solo sus tokens») no admiten un color elegido por un administrador. Se propondrá una excepción cerrada: el color de un tipo de cápsula puede ser un color propio guardado como dato, siempre que la aplicación calcule el texto y los límites con contraste ≥ 4,5:1 y ≥ 3:1 en los dos temas y ajuste el tono en tema oscuro. La enmienda se presenta aparte y se aplica con `/speckit-constitution`.

## Assumptions

- Los 7 colores fijos son los actuales sin el rosa: ristretto, lungo, decaf, colombia, vainilla, azul e intenso.
- El selector de color es el nativo del navegador; no se añade ninguna librería de color.
- La zona de encuadre se envía con el formulario como datos numéricos y el servidor recorta. El navegador no recorta.
- El lado del recorte guardado sigue el tamaño máximo actual de RF-005.
- El mensaje del día se asigna en la carga de Inicio en el servidor, para que funcione sin JavaScript. Una precarga de Inicio que no llega a mostrarse puede asignar el mensaje de ese día, pero no gasta más de uno al día.
- Los mensajes del día no tienen pose propia: Capsulito usa la pose de saludo actual.

## Clarifications

### Session 2026-10-27

- Q: ¿Dónde se guarda el registro de mensajes vistos? → A: Por persona, en el servidor; vale en todos sus dispositivos.
- Q: ¿Voz? → A: Solo texto por ahora.
- Q: ¿Mañana y tarde? → A: Un solo catálogo válido a cualquier hora.
- Q: ¿Qué cuenta como visto? → A: Solo si se ve; un día con aviso no gasta mensaje. El mismo mensaje todo el día.
- Q: ¿Es el mismo mensaje que los 80 saludos rotativos? → A: No. Los 80 saludos (cada 2 horas, 6 s, con voz) se quedan igual. Se amplía el mensaje fijo del bocadillo, que hoy siempre dice lo mismo, a unos 40 textos.
- Q: ¿Qué pasa con las cápsulas rosas? → A: Conservan el rosa; no se puede volver a elegir.
- Q: ¿Selector libre y constitución? → A: Selector libre con texto y borde calculados para el contraste y tono ajustado en oscuro, con enmienda MENOR de la constitución.
- Q: ¿Dónde hay encuadre? → A: Alta y cambio de foto de una persona (admin), Perfil y foto de cápsula.
- Q: ¿Forma del encuadre? → A: Cuadrado; guía redonda en personas, sin guía en cápsulas. Sin JavaScript, recorte central.
- Q: ¿Copias de seguridad? → A: Color según la función de cada sección, con icono.
- Q: ¿Tramitación? → A: Una sola funcionalidad F15 con CAMBIO-027.
