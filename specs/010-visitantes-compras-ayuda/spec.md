# Feature Specification: Visitantes, compras rápidas, estadísticas del departamento y ayuda de Capsulito (F10)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-24

**Status**: Aprobada por la persona usuaria el 2026-10-24. Traspasada a `historias.md` v0.19.0 (CAMBIO-019).

**Input**: User description: "Invitados externos con enlace y aprobación del administrador, introducción antes del login, compras de varios tipos de una vez, confirmación clara de hucha negativa, estadísticas gráficas de todo el departamento, ayuda contextual con Capsulito, fotos de usuario, aportaciones por persona y en nombre de otro, instalación de la PWA y avisos activados por defecto."

**Fuente**: decisiones de la persona usuaria en la sesión del 2026-10-24 (Clarifications). Las reglas de `historias.md` que esta funcionalidad modifica están en «Impacto en las fuentes vigentes». Los IDs nuevos (RF-189 a RF-210, RN-086 y RN-087, CA-189 a CA-210, EV-103 a EV-106, DEC-116 a DEC-118) son una propuesta: se fijan al registrar el CAMBIO-019 en `historias.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un visitante registra su café con un enlace y un administrador lo aprueba (Priority: P1)

Una persona externa al departamento (un visitante) viene a una reunión. Ana, que es miembro, le genera un enlace de visitante y se lo pasa por mensaje o le enseña el código QR. El visitante abre el enlace, escribe su nombre y toca la cápsula que se pone. El café queda pendiente. Un administrador recibe un aviso, revisa los cafés pendientes y los aprueba o los rechaza. Al aprobarlo, el stock baja en una cápsula y nadie recibe un cargo: el departamento invita.

**Why this priority**: Es la única forma de que el stock refleje los cafés de personas sin cuenta sin que nadie tenga que apuntarlos a su nombre. La aprobación evita que alguien con el enlace registre cafés que no se han consumido.

**Independent Test**: Ana genera un enlace, otro navegador sin sesión lo abre, escribe «Lucía», registra un café y ve «Pendiente de aprobación». El stock no cambia. Un administrador aprueba el café y el stock baja en 1 sin movimientos en ningún saldo.

**Acceptance Scenarios**:

1. **Dado** un miembro activo, **cuando** genera un enlace de visitante, **entonces** ve el enlace, un código QR, la hora de caducidad (24 h después) y la opción de revocarlo (CA-189; RF-189).
2. **Dado** un enlace vigente, **cuando** una persona sin sesión lo abre y escribe su nombre, **entonces** entra como visitante y solo ve los tipos de cápsula disponibles para registrar. No ve saldos, nombres de miembros, historial ni estadísticas (CA-190; RF-190, RF-194).
3. **Dado** un visitante, **cuando** toca una cápsula, **entonces** recibe en un toque la confirmación «Pendiente de aprobación», y el stock, el coste medio y los saldos no cambian (CA-191; RF-191).
4. **Dado** un café de visitante pendiente, **entonces** cada administrador con el aviso activo recibe la notificación y lo ve en la lista de cafés pendientes con el nombre del visitante, el tipo, la hora y quién generó el enlace (CA-192; RF-192).
5. **Dado** un café de visitante pendiente, **cuando** un administrador lo aprueba, **entonces** el stock del tipo baja en 1, no se genera ningún movimiento personal, el saldo teórico de la hucha no cambia y el café cuenta como «visitante» en las estadísticas (CA-193; RF-193, RN-086).
6. **Dado** un café de visitante pendiente, **cuando** un administrador lo rechaza, **entonces** el café queda rechazado sin ningún efecto en stock ni en dinero (CA-193; RF-193).
8. **Dado** un café de visitante de cualquier estado, **cuando** un administrador elimina el nombre del visitante, **entonces** el café conserva su tipo, su hora, su estado y sus efectos, y muestra «Visitante» en lugar del nombre en todas las pantallas. La eliminación no se puede deshacer y queda en la auditoría sin el nombre (CA-210; RF-210).
7. **Dado** un enlace caducado o revocado, **cuando** alguien lo abre o intenta registrar un café con él, **entonces** ve un mensaje en español que explica que el enlace ya no vale y que debe pedir otro a un miembro (CA-189; RF-189).

---

### User Story 2 - Registrar la compra del supermercado de una sola vez (Priority: P1)

Luis vuelve del supermercado con 16 cápsulas de un tipo, 16 de otro y 8 de un tercero. En Compras ve todos los tipos activos con un contador en cada uno. Sube los contadores con «+» o escribe la cifra, pone el importe de cada tipo y comprueba que el total coincide con el ticket. Si la compra deja la hucha en negativo, un diálogo le dice con cifras qué va a pasar antes de registrarla.

**Why this priority**: Registrar cada tipo por separado cuesta varios minutos y hace que la gente deje compras sin apuntar. Sin compras, el stock y el coste medio dejan de reflejar la realidad.

**Independent Test**: Luis registra una compra con tres tipos (16, 16 y 8) en una sola pantalla y un solo envío. El stock de cada tipo sube en esa cantidad y la hucha baja por el total.

**Acceptance Scenarios**:

1. **Dado** el formulario de compra, **entonces** muestra cada tipo activo con su imagen, su nombre, un contador con «−» y «+» de 44 × 44 px como mínimo y un campo para escribir la cantidad (CA-197; RF-197).
2. **Dado** uno o varios tipos con cantidad mayor que 0, **entonces** cada uno pide su importe, y el formulario muestra el número de líneas y el total para compararlo con el ticket (CA-197; RF-197, RF-040).
3. **Dado** una compra con tres líneas, **cuando** Luis la registra, **entonces** se guarda como una sola compra con tres líneas, cada stock sube en su cantidad, cada coste medio se recalcula según RN-003 y la hucha baja por el total (CA-197; RF-197, RF-041).
4. **Dado** una compra que deja el saldo teórico de la hucha en negativo, **cuando** Luis pulsa «Registrar compra», **entonces** un diálogo muestra el saldo actual de la hucha, el importe de la compra, el saldo resultante y que se avisará a los administradores, con los botones «Cancelar» y «Registrar igualmente». No hay ninguna casilla que marcar (CA-198; RF-198).
5. **Dado** el navegador sin JavaScript, **cuando** Luis envía una compra que deja la hucha en negativo, **entonces** ve la misma información como paso intermedio y la registra con «Registrar igualmente» (CA-198; RF-198, constitución XVII).

---

### User Story 3 - Ver cuánto aporta cada persona y registrar una aportación en nombre de otra (Priority: P1)

Marta da 20 € en mano a la administradora para la hucha. La administradora registra la aportación a nombre de Marta. Cualquier miembro ve en Saldos cuánto ha aportado cada persona.

**Why this priority**: Ahora una aportación solo puede registrarla su autor. El dinero que se entrega en mano se queda sin apuntar o se apunta a la persona equivocada.

**Independent Test**: La administradora registra 20,00 € a nombre de Marta. El saldo de Marta sube 20,00 €, la hucha sube 20,00 € y la aportación muestra quién la registró.

**Acceptance Scenarios**:

1. **Dado** la pantalla Saldos, **entonces** cada persona activa muestra su saldo y el total de sus aportaciones vigentes. Su detalle lista cada aportación con la fecha, el importe y quién la registró (CA-199; RF-199).
2. **Dado** un administrador, **cuando** registra una aportación eligiendo a otra persona activa, **entonces** el abono va a esa persona, la hucha aumenta en el importe y la aportación guarda quién la registró y para quién (CA-200; RF-200, RN-087).
3. **Dado** un miembro que no es administrador, **entonces** el formulario no le ofrece elegir persona y el servidor rechaza una aportación a nombre de otra persona aunque se envíe a mano (CA-200; RF-200).
4. **Dado** una aportación registrada por un administrador en nombre de Marta, **entonces** Marta la ve en su historial y recibe un aviso en el panel de avisos (CA-200; RF-200).

---

### User Story 4 - Estadísticas del departamento de un vistazo (Priority: P2)

Cualquier miembro abre Estadísticas y, sin elegir a nadie, ve gráficos con el consumo de todas las personas, por tipo y por mes, con los cafés de invitados y de visitantes separados, y la evolución de la hucha.

**Why this priority**: La pantalla actual obliga a elegir una persona y apenas muestra información. La transparencia sobre el consumo es parte de la confianza del departamento (NEC-007).

**Independent Test**: Luis abre Estadísticas y ve, sin hacer nada más, las cifras del mes, los cafés por persona, el consumo por tipo, la evolución de 12 meses y la evolución de la hucha.

**Acceptance Scenarios**:

1. **Dado** cualquier miembro, **cuando** abre Estadísticas, **entonces** ve sin elegir persona: las cifras clave del periodo (cafés, cafés de invitados, cafés de visitantes y coste total), los cafés por persona ordenados de mayor a menor, el consumo por tipo de cápsula, la evolución mensual de los últimos 12 meses (propios, invitados y visitantes) y la evolución del saldo teórico de la hucha (CA-201, CA-202; RF-201, RF-202).
2. **Dado** cualquier gráfico, **entonces** tiene una alternativa en texto o en tabla con los mismos datos, y su información no depende solo del color (CA-202; RF-202, constitución XI).
3. **Dado** el selector de periodo (mes actual, últimos 3 meses, últimos 12 meses), **cuando** el miembro cambia de periodo, **entonces** todas las cifras y los gráficos usan ese periodo, también sin JavaScript (CA-202; RF-202).

---

### User Story 5 - Capsulito explica cada pantalla cuando se le pide (Priority: P2)

En cualquier pantalla, Ana pulsa el botón de ayuda («?») de la cabecera. Se abre un panel donde Capsulito explica para qué sirve la pantalla, qué hace cada acción y qué significa cada campo, y lo dice en voz alta si la voz está activa. La primera vez que Ana entra en Inicio, después de la bienvenida, Capsulito le enseña en 4 pasos lo esencial.

**Why this priority**: Varias pantallas (arqueos, recuentos, configuración) usan conceptos técnicos. Una ayuda disponible en el sitio evita errores sin recargar la interfaz.

**Independent Test**: Ana abre Arqueos y recuentos, pulsa «?» y lee qué es el saldo teórico, qué es un arqueo y qué pasa con la diferencia. En Inicio, el tour la lleva por los 4 pasos y no vuelve a aparecer después de terminarlo o saltarlo.

**Acceptance Scenarios**:

1. **Dado** cualquier pantalla autenticada, **cuando** la persona pulsa «Ayuda», **entonces** se abre un panel (hoja inferior en móvil, panel lateral en escritorio) con Capsulito, el propósito de la pantalla y la lista de sus acciones y campos con su explicación. El foco entra en el panel y vuelve al botón al cerrarlo (CA-203; RF-203).
2. **Dado** el navegador sin JavaScript, **cuando** la persona pulsa «Ayuda», **entonces** llega a la sección de esa pantalla en `/ayuda` (CA-203; RF-203, constitución XVII).
3. **Dado** la primera visita a Inicio tras la bienvenida, **entonces** Capsulito muestra un tour de 4 pasos (registrar un café, café para un invitado, «Deshacer», navegación) que se puede saltar en cualquier paso y repetir desde el panel de ayuda de Inicio (CA-204; RF-204).
4. **Dado** los campos técnicos de un formulario (umbral mínimo, arqueo, recuento, plazo de autoanulación, límite de deuda e intervalo de rellenos), **entonces** cada uno muestra bajo el campo una línea de ayuda fija (CA-205; RF-205).

---

### User Story 6 - Primer contacto: bienvenida antes de entrar, instalar la app y activar avisos (Priority: P2)

Un dispositivo que nunca ha abierto beCafé ve la bienvenida de Capsulito antes de la pantalla de entrada. Empieza con el botón «Empezar», que permite que suene la voz. Al terminar, la persona elige «Entrar» o, si llegó con un enlace de visitante, «Soy visitante». Ya dentro, Inicio le ofrece instalar la aplicación en la pantalla principal y Capsulito le ofrece activar los avisos.

**Why this priority**: La primera impresión decide si la aplicación se usa. Sin instalarla, el acceso es lento. Sin avisos, nadie se entera de que el stock está bajo.

**Independent Test**: Un navegador sin datos abre la aplicación, ve la bienvenida con «Empezar», la termina y llega a la pantalla de entrada. En Android con Chrome, Inicio muestra «Instalar beCafé», y su botón abre el diálogo del sistema.

**Acceptance Scenarios**:

1. **Dado** un dispositivo sin la marca de bienvenida vista, **cuando** abre la pantalla de entrada o un enlace de visitante, **entonces** ve primero la bienvenida, que empieza con «Empezar». Al terminarla o saltarla ve «Entrar» y, con enlace de visitante, «Soy visitante» (CA-195; RF-195).
2. **Dado** un dispositivo sin preferencia de voz, **entonces** la voz de Capsulito está activa. Silenciarla se guarda en el dispositivo (CA-196; RF-196).
3. **Dado** un navegador que permite instalar la aplicación y no la tiene instalada, **entonces** Inicio muestra una tarjeta «Instalar beCafé» con el botón del sistema. En Safari de iPhone y iPad, la tarjeta explica los pasos «Compartir → Añadir a pantalla de inicio». La tarjeta se puede descartar y no vuelve a aparecer para esa cuenta, y Perfil conserva la opción (CA-206; RF-206).
4. **Dado** una cuenta nueva o una cuenta que nunca ha cambiado sus avisos, **entonces** todos los tipos de aviso están activados. Tras la bienvenida, Capsulito ofrece «Activar avisos», que pide el permiso del navegador. Si la persona lo rechaza, Capsulito no lo vuelve a ofrecer y la opción sigue en Perfil (CA-207; RF-207).

---

### User Story 7 - Fotos de las personas (Priority: P3)

Cada persona puede subir su foto desde Perfil. Un administrador puede subir o quitar la foto de cualquiera desde Usuarios. Quien no tiene foto aparece con sus iniciales sobre un color cálido del tema, siempre el mismo para esa persona.

**Why this priority**: Las fotos ayudan a reconocer a las personas en Saldos y Estadísticas, pero la aplicación funciona sin ellas.

**Independent Test**: Luis sube una foto JPEG de 3 MB desde Perfil y la ve en Perfil, Saldos y Estadísticas. Marta, sin foto, aparece con «M» sobre el mismo color en todas las pantallas.

**Acceptance Scenarios**:

1. **Dado** una persona en Perfil, **cuando** sube una foto JPEG, PNG o WebP de 5 MB como máximo, **entonces** la foto se valida, se redimensiona y se guarda sin metadatos, y aparece en Perfil, Saldos, Estadísticas, Usuarios y la navegación (CA-208; RF-208, RF-005).
2. **Dado** un administrador en la ficha de una persona, **cuando** sube o quita su foto, **entonces** el cambio se aplica a esa persona y queda en la auditoría (CA-208; RF-208).
3. **Dado** una persona sin foto, **entonces** aparece con sus iniciales sobre un color cálido de los tokens del tema, el mismo en todas las pantallas, con contraste de 4,5:1 como mínimo en claro y oscuro (CA-209; RF-209).

---

### Edge Cases

- Un visitante pulsa dos veces la misma cápsula por una red lenta: el identificador de cliente evita el duplicado (RF-016).
- Un visitante registra muchos cafés seguidos con un mismo enlace: todos quedan pendientes y el administrador puede rechazarlos todos a la vez. El servidor limita la frecuencia de registro por enlace para que la cola de pendientes no se llene de basura.
- El enlace caduca con cafés pendientes: los pendientes se conservan y se pueden revisar.
- Un administrador aprueba un café de visitante de un tipo con stock 0: se aprueba y el stock queda en −1, como un consumo normal (RN-005). Se aplica el aviso de stock negativo.
- Un tipo se retira con cafés de visitante pendientes: se pueden revisar igual.
- Dos administradores revisan el mismo café a la vez: solo cuenta la primera revisión; el segundo ve que ya está revisado.
- Una compra con todas las cantidades a 0: el botón «Registrar compra» no está disponible y el servidor la rechaza.
- El saldo de la hucha cambia entre el diálogo de confirmación y el envío: el servidor vuelve a pedir la confirmación con las cifras nuevas.
- Un administrador intenta registrar una aportación a nombre de una persona dada de baja: se rechaza con un mensaje que lo explica.
- El navegador no permite instalar aplicaciones (escritorio sin soporte, ya instalada): la tarjeta de instalación no aparece.
- La persona rechazó el permiso de notificaciones en el navegador: Perfil explica cómo volver a activarlo en los ajustes del navegador.

## Requirements *(mandatory)*

### Functional Requirements

**Visitantes**

- **RF-189**: Cualquier miembro activo deberá poder generar un enlace de visitante con su código QR. El enlace caduca 24 horas después de crearse. Quien lo creó y los administradores deberán poder revocarlo antes.
- **RF-190**: Una persona sin sesión que abre un enlace vigente deberá poder entrar como visitante tras escribir un nombre de 1 a 40 caracteres, sin cuenta ni contraseña. La sesión de visitante termina cuando caduca o se revoca el enlace.
- **RF-191**: El visitante deberá poder registrar un café con un solo toque sobre un tipo activo con coste medio. El café queda pendiente, no cambia el stock, el coste medio ni ningún saldo, y es idempotente por identificador de cliente (RF-016). La confirmación dice «Pendiente de aprobación».
- **RF-192**: Cada café de visitante pendiente deberá notificarse a los administradores mediante un tipo de aviso nuevo, «Café de visitante pendiente», y mostrarse en una lista de pendientes con el nombre del visitante, el tipo, la hora y quién generó el enlace.
- **RF-193**: Un administrador deberá poder aprobar o rechazar cada café de visitante pendiente, o varios a la vez. Aprobar aplica RN-086. Rechazar lo deja rechazado sin efectos. Un café aprobado se puede anular después: el stock vuelve a subir en 1.
- **RF-194**: Un visitante no deberá poder ver ni pedir saldos, nombres de miembros, historial, estadísticas ni ninguna pantalla autenticada, ni siquiera por URL directa.
- **RF-210**: El nombre del visitante deberá conservarse mientras exista el café, salvo que un administrador lo elimine. Eliminarlo sustituye el nombre por «Visitante» de forma irreversible, conserva el resto del café y se registra en la auditoría sin copiar el nombre.
- **RN-086**: Un café de visitante aprobado reduce en 1 el stock de su tipo y no genera movimientos personales. La hucha ya pagó la cápsula al comprarla, así que su saldo teórico tampoco cambia: el departamento asume el coste. El café guarda el coste medio vigente al aprobarlo como valor informativo para las estadísticas.

**Primer contacto**

- **RF-195**: Si el dispositivo no tiene la marca de bienvenida vista, la pantalla de entrada y el enlace de visitante deberán mostrar antes la bienvenida de 8 escenas. La bienvenida empieza con el botón «Empezar» y termina con «Entrar» o, si se llegó con un enlace de visitante, con «Soy visitante».
- **RF-196** (modifica RF-187): La voz de Capsulito deberá estar activa por defecto en un dispositivo sin preferencia guardada.
- **RF-206** (amplía RF-106): Inicio deberá mostrar una tarjeta para instalar la aplicación cuando el navegador lo permite y la aplicación no está instalada: en Android y en Chrome con el diálogo del sistema; en Safari de iPhone y iPad con las instrucciones. Descartar la tarjeta se guarda en la cuenta. Perfil ofrece siempre la opción.
- **RF-207** (modifica RF-102): Todos los tipos de aviso deberán estar activados por defecto en las cuentas nuevas y en las existentes que nunca los han cambiado. Tras la bienvenida, Capsulito deberá ofrecer una vez activar los avisos, lo que pide el permiso del navegador.

**Compras**

- **RF-197** (amplía RF-040): El formulario de compra deberá mostrar todos los tipos activos, cada uno con un contador de 0 a 999 que se cambia con «−» y «+» o escribiendo la cifra. Cada tipo con cantidad mayor que 0 pide su importe. El formulario muestra el número de líneas y el total. El envío crea una sola compra con una línea por tipo con cantidad mayor que 0. Funciona sin JavaScript.
- **RF-198** (modifica RF-043): Si la compra deja el saldo teórico de la hucha en negativo, al pulsar «Registrar compra» el cliente deberá mostrar el saldo actual, el importe de la compra, el saldo resultante y el aviso a los administradores, y pedir confirmación con «Cancelar» y «Registrar igualmente». No se usa una casilla. Si el saldo cambió desde que se mostró la confirmación, el servidor la vuelve a pedir. RF-044 no cambia.

**Aportaciones**

- **RF-199**: Saldos deberá mostrar, para cada persona activa, su saldo y el total de sus aportaciones vigentes, con acceso a su detalle (fecha, importe y quién la registró).
- **RF-200** (modifica RF-030): Un administrador deberá poder registrar una aportación en nombre de otra persona activa. Un miembro que no es administrador solo puede registrar aportaciones propias. La persona beneficiaria recibe un aviso en el panel de avisos.
- **RN-087** (amplía RN-008): Una aportación guarda a la persona beneficiaria, que recibe el abono, y a la persona que la registró. Su efecto en la hucha no cambia.

**Estadísticas**

- **RF-201** (modifica RF-121, RF-122, RF-123 y RN-061): Todos los miembros deberán poder ver las estadísticas de consumo de todas las personas activas, sin elegir a una persona.
- **RF-202** (amplía RF-120): Estadísticas deberá mostrar para el periodo elegido (mes actual, últimos 3 meses o últimos 12 meses): cifras clave (cafés, cafés de invitados, cafés de visitantes y coste), cafés por persona ordenados, consumo por tipo, evolución mensual de 12 meses con propios, invitados y visitantes separados, y evolución del saldo teórico de la hucha. Cada gráfico tiene su alternativa en texto o en tabla.

**Ayuda**

- **RF-203**: Cada pantalla autenticada deberá tener un botón «Ayuda» que abre un panel donde Capsulito explica el propósito de la pantalla, sus acciones y sus campos, con textos de un catálogo por pantalla y con voz opcional. Sin JavaScript, el botón lleva a la sección de esa pantalla en `/ayuda`.
- **RF-204**: La primera vez que una persona entra en Inicio tras la bienvenida, Capsulito deberá mostrar un tour de 4 pasos que se puede saltar y repetir desde la ayuda de Inicio. Terminarlo o saltarlo se guarda en la cuenta.
- **RF-205**: Los campos técnicos de los formularios deberán mostrar una línea de ayuda fija bajo el campo.

**Personas**

- **RF-208**: Cada persona deberá poder subir, cambiar o quitar su foto en Perfil. Un administrador deberá poder hacerlo para cualquier persona en Usuarios. Se aplican las validaciones de RF-005 y queda en la auditoría.
- **RF-209**: Una persona sin foto deberá mostrarse con sus iniciales sobre un color cálido de los tokens del tema, asignado de forma estable a esa persona. El nombre accesible de la imagen es el nombre de la persona.

### Non-Functional Requirements

- **Seguridad (constitución VI)**: La sesión de visitante viaja en una cookie `HttpOnly` distinta de la de los miembros. Cada acción de visitante comprueba en el caso de uso que el enlace está vigente. El registro de cafés de visitante tiene un límite de frecuencia por enlace.
- **Privacidad (constitución VI y XVI)**: El nombre del visitante no aparece en los logs ni en la auditoría. Se conserva sin plazo salvo que un administrador lo elimine (RF-210). El texto de privacidad informa a los visitantes de esa conservación y de a quién pedir que se borre, y se muestra antes de que escriban su nombre.
- **Accesibilidad (RNF-001, constitución XI)**: Todas las pantallas nuevas o modificadas superan axe en claro y oscuro. Los contadores de compra y los botones de visitante miden 44 × 44 px como mínimo. Los gráficos tienen alternativa en texto o tabla.
- **Rapidez (RNF-002)**: El café de visitante se confirma en 1 s o menos en el percentil 95 con red.
- **Mejora progresiva (constitución XVII)**: El acceso de visitante, la compra múltiple, la confirmación de hucha negativa, la aportación en nombre de otro, la subida de fotos y el selector de periodo funcionan sin JavaScript.

### Out of Scope

- Cobrar a los visitantes o generar cargos por sus cafés.
- Cuentas de visitante permanentes o visitantes que vuelven con el mismo enlace después de 24 h.
- Que un miembro que no es administrador apruebe cafés de visitante.
- Gamificación (PEND-037).

### Key Entities

- **Enlace de visitante**: identificador, token secreto (solo se guarda su resumen criptográfico), quién lo creó, creación, caducidad, revocación.
- **Café de visitante**: identificador de cliente, enlace, nombre del visitante (se puede eliminar), tipo de cápsula, hora del gesto, estado (pendiente, aprobado, rechazado, anulado), quién lo revisó y cuándo, coste medio informativo al aprobarlo.
- **Aportación** (amplía la existente): persona beneficiaria y persona que la registró.
- **Foto de persona**: archivo en el volumen de fotos asociado a una persona.
- **Preferencias de cuenta** (amplía las existentes): tour de Inicio visto y tarjeta de instalación descartada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visitante registra su primer café en menos de 30 s desde que abre el enlace, nombre incluido.
- **SC-002**: Una compra de tres tipos se registra en menos de 1 minuto y con un solo envío.
- **SC-003**: Ningún café de visitante cambia el stock sin una aprobación. Una prueba automatizada lo intenta por todas las vías.
- **SC-004**: Un miembro ve el consumo de todo el departamento sin elegir nada, en la primera pantalla de Estadísticas.
- **SC-005**: Cada pantalla autenticada tiene ayuda, y cada campo técnico tiene su explicación.
- **CA-189 a CA-210 y EV-103 a EV-106**: cada criterio tiene al menos una prueba que lo nombra y pasa. La verificación completa y la suite E2E pasan, y se mantienen los umbrales de cobertura de la constitución (VIII).

### Escenarios de verificación propuestos

- **EV-103**: Un visitante con un enlace caducado, revocado o falsificado no puede registrar cafés ni abrir pantallas autenticadas (API y E2E).
- **EV-104**: Dos administradores aprueban a la vez el mismo café de visitante y el stock baja una sola vez (concurrencia).
- **EV-105**: Un miembro que no es administrador intenta registrar una aportación a nombre de otra persona enviando el formulario a mano, y el servidor la rechaza.
- **EV-106**: La compra múltiple, la confirmación de hucha negativa y el acceso de visitante funcionan sin JavaScript.

## Impacto en las fuentes vigentes

Antes del plan, `historias.md` necesita un CAMBIO-019 autorizado, con respaldo, que recoja:

- **RF-014 y glosario**: el término «visitante» (persona sin cuenta) se distingue de «invitado» (café que un miembro registra y paga para otra persona). DEC-116.
- **RF-030 y RN-008**: aportación en nombre de otra persona (RF-200, RN-087). DEC-117.
- **RF-043**: confirmación con diálogo y sin casilla (RF-198).
- **RF-102 y RF-101**: avisos activados por defecto y tipo de aviso nuevo «Café de visitante pendiente» (RF-207, RF-192).
- **RF-121, RF-122, RF-123, RN-061 y DEC-022**: estadísticas de todas las personas visibles para todos los miembros (RF-201). DEC-118.
- **RF-187**: voz activa por defecto (RF-196, ya implementado en el código).
- **Texto de privacidad**: nueva versión que cubra a los visitantes y la conservación de su nombre (RF-210).
- **Reglas nuevas**: RF-189 a RF-210 (excepto los citados como modificaciones), RN-086, RN-087, CA y EV correspondientes.

Comprobación previa con la constitución:

- **Principio V (navegador)**: el tour visto y la tarjeta de instalación descartada no pueden guardarse en el navegador, porque esa lista está cerrada. Esta propuesta los guarda en la cuenta, en el servidor, para no necesitar una enmienda.
- **Principio IV**: el café de visitante aprobado no modifica ni borra registros económicos y no genera movimientos. Su anulación sigue el patrón de anulaciones.
- **Principio III**: las reglas de visitante y de aportación en nombre de otro viven en los módulos de servidor y se comprueban en el caso de uso.

## Assumptions

- Los cafés de visitante solo se pueden registrar con un tipo con coste medio (RN-006), como los consumos de los miembros.
- El tour de Inicio tiene 4 pasos y no se muestra a quien tiene la mascota desactivada; en ese caso, la ayuda de Inicio ofrece el tour igualmente.
- El color del avatar sin foto se elige de forma estable a partir del identificador de la persona, entre los colores cálidos de los tokens que cumplen el contraste en claro y oscuro.
- La lista de cafés pendientes está en Administración y la campana de avisos enlaza a ella.
- El periodo por defecto de Estadísticas es el mes actual.

## Clarifications

### Session 2026-10-24

Decisiones de la persona usuaria antes de redactar esta propuesta:

1. **Acceso de visitantes**: enlace de visitante (y QR) que caduca a las 24 h, no un botón abierto ni un QR fijo.
2. **Coste del café de visitante**: lo asume la hucha común; nadie recibe un cargo.
3. **Café de visitante sin revisar**: queda pendiente hasta que un administrador lo revise. No se aprueba ni caduca solo.
4. **Límites del enlace**: caduca a las 24 h y pide el nombre al visitante. Cualquier miembro puede crear enlaces. Sin máximo de cafés por enlace.
5. **Aportaciones**: Saldos muestra lo que aporta cada persona, y el administrador registra aportaciones en nombre de otra persona.
6. **Estadísticas**: todos los miembros ven a todos.
7. **Compras**: importe por cada tipo (se mantiene RN-003) y confirmación de hucha negativa con diálogo al pulsar «Registrar».
8. **Fotos**: cada persona sube la suya y el administrador también puede subirla o quitarla. Sin foto, iniciales sobre un color cálido del tema.
9. **Ayuda**: panel «?» en cada pantalla, tour de Inicio tras la bienvenida y textos fijos bajo los campos técnicos.
10. **Primer contacto**: bienvenida antes de entrar, con «Empezar» y voz activa por defecto. Tarjeta de instalación discreta en Inicio. Avisos activados por defecto y oferta de permiso tras la bienvenida.
11. **Conservación del nombre del visitante**: se guarda para siempre salvo que un administrador lo elimine (RF-210). Eliminar el nombre no borra el café, porque un café aprobado mueve stock y la constitución (IV) prohíbe borrar registros con efectos; el nombre se sustituye por «Visitante».
12. **Aprobación**: la persona usuaria aceptó la spec el 2026-10-24.
