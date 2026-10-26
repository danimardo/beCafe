# Feature Specification: Pulido de Capsulito, celebración del café y gestión de personas y stock (F12)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-26

**Status**: Aprobada por la persona usuaria el 2026-10-26. Traspasada a `historias.md` v0.24.0 (CAMBIO-024).

**Input**: User description: "Correcciones (copiar enlace, posición del enlace generado, Capsulito que habla en el tour) y mejoras (Capsulito en la pantalla de acceso con enlace, fotos en el listado de personas, celebración con sonido al registrar, orden de las cápsulas por consumo propio, aviso público de recuento, nueva escena de la bienvenida sobre el dinero y gestos de Capsulito en reposo)."

**Fuente**: decisiones de la persona usuaria en la sesión del 2026-10-26 (Clarifications). Las reglas de `historias.md` que esta funcionalidad modifica se citan por su ID y se traspasan con un CAMBIO autorizado (apartado «Impacto en las fuentes vigentes»).

**Glosario de esta funcionalidad**:
- **Celebración**: animación breve de confeti y sonido corto sobre la tarjeta pulsada cuando el servidor confirma un registro. No es una ventana ni un diálogo.
- **Gesto de reposo**: animación corta de Capsulito cuando no habla ni hace una pose (parpadeo, mirar a los lados, golpear el suelo con el pie, mirar un reloj imaginario, bostezar).
- **Aviso de recuento**: aviso para todas las personas que resume un recuento de stock registrado.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Saber al instante que el café cuenta (Priority: P1)

Una persona toca su cápsula en Inicio. En menos de un segundo salta un confeti breve sobre la tarjeta y suena un sonido corto de celebración. Después, Capsulito dice su frase de registro. La persona sabe que el toque ha contado sin mirar dos veces, y puede seguir tocando o pulsar «Deshacer» sin esperar.

**Why this priority**: registrar un café es el 95 % del uso (RF-011). Hoy la confirmación es solo texto y voz, y la persona no siempre sabe si el toque ha contado.

**Independent Test**: registrar un café propio, uno de invitado y el relleno del agua con la voz activa y silenciada, con y sin «Reducir movimiento», y sin conexión.

**Acceptance Scenarios**:

1. **Given** una persona en Inicio con la voz activa, **When** el servidor confirma su café, **Then** sobre la tarjeta pulsada aparece un confeti de 1 s como máximo, suena el sonido de celebración y, al terminar el sonido, Capsulito dice su frase de registro (RF-213).
2. **Given** la celebración en curso, **When** la persona toca otra cápsula o «Deshacer», **Then** el toque funciona a la primera: la celebración no tapa ni bloquea ningún control.
3. **Given** la voz silenciada en Ajustes, **When** el servidor confirma un café, **Then** hay confeti y mensaje en pantalla, pero no suena nada.
4. **Given** «Reducir movimiento» del sistema activo, **When** el servidor confirma un café, **Then** no hay confeti; quedan el mensaje y, con la voz activa, el sonido.
5. **Given** la persona sin conexión, **When** el café queda pendiente de enviar, **Then** no hay celebración ni sonido de celebración; se ve el mensaje de pendiente como hoy (constitución X).
6. **Given** Capsulito diciendo una frase de registro, **When** se confirma otro café, **Then** la frase en curso se corta y empieza la nueva celebración.
7. **Given** la tarjeta «Sin stock» confirmada con «Sí, registrar» (RF-217), o «He rellenado el agua», o un café de invitado, **When** el servidor confirma, **Then** hay la misma celebración.

---

### User Story 2 - Corregir el enlace de acceso y la voz del tour (Priority: P1)

Un administrador da de alta a una persona y pulsa «Copiar enlace». El enlace se copia y puede pegarlo en el chat del departamento. Cuando genera un enlace nuevo desde el listado, lo ve justo debajo del botón que ha pulsado. En el tour de Inicio, el Capsulito que habla es el de la tarjeta del paso, no el de arriba de la pantalla.

**Why this priority**: son fallos que impiden o confunden tareas que ya existen (RF-139, RF-227).

**Independent Test**: dar de alta, generar enlace y reactivar desde `/admin/usuarios`, por http y por https; copiar y pegar el enlace; recorrer el tour con la voz activa y mirar qué Capsulito mueve la boca.

**Acceptance Scenarios**:

1. **Given** el enlace de acceso a la vista, **When** el administrador pulsa «Copiar enlace», **Then** el enlace queda en el portapapeles y el botón dice «Enlace copiado», también cuando la aplicación se abre por http.
2. **Given** un navegador que no permite copiar de ninguna forma, **When** el administrador pulsa «Copiar enlace», **Then** el texto del enlace queda seleccionado y se muestra «No se pudo copiar solo. Selecciona el texto y cópialo».
3. **Given** el formulario de alta o el botón «Generar enlace» o «Reactivar», **When** el servidor devuelve el enlace, **Then** el enlace aparece justo debajo del botón pulsado, la vista se desplaza hasta él y el lector de pantalla anuncia que el enlace está listo.
4. **Given** el tour de Inicio con la voz activa, **When** Capsulito dice un paso, **Then** mueve la boca el Capsulito de la tarjeta del paso y el Capsulito de arriba de Inicio queda quieto y callado hasta que termina el tour.

---

### User Story 3 - Ver primero las cápsulas que más tomo (Priority: P2)

Una persona abre Inicio y encuentra arriba las cápsulas que más ha tomado en el último mes. Una persona nueva ve primero las que más toma el departamento.

**Why this priority**: acorta la búsqueda en la acción más repetida. Hoy el orden es alfabético.

**Independent Test**: con dos personas que toman cápsulas distintas, abrir Inicio con cada una y comparar el orden; abrir Inicio con una persona sin consumos en 30 días.

**Acceptance Scenarios**:

1. **Given** una persona con consumos en los últimos 30 días, **When** abre Inicio, **Then** las cápsulas aparecen de más a menos consumos suyos en ese periodo, y a igualdad, por orden alfabético (RN-090).
2. **Given** una persona sin consumos en los últimos 30 días, **When** abre Inicio, **Then** las cápsulas aparecen de más a menos consumos del departamento en ese periodo, y a igualdad, por orden alfabético.
3. **Given** una cápsula «Sin stock» o «Quedan pocas», **When** se ordena Inicio, **Then** ocupa el puesto que le da su consumo, con sus marcas de RF-217 y RF-218.

---

### User Story 4 - Todo el mundo se entera de un recuento (Priority: P2)

Un administrador cuenta las cápsulas del cajón y registra un recuento. Faltaban 3 Ristretto. Todas las personas ven en Inicio y en el panel de avisos «Recuento del 26/10: faltaban 3 Ristretto; 1,05 € repartidos entre 8 personas (0,13 € cada una)».

**Why this priority**: un recuento con faltantes carga dinero a todos (RN-016); sin aviso, aparece un cargo que nadie entiende.

**Independent Test**: registrar un recuento con un faltante, otro con un sobrante y anular el último; comprobar el aviso con cada persona activa.

**Acceptance Scenarios**:

1. **Given** un recuento con faltantes, **When** el administrador lo registra, **Then** cada persona activa ve en el panel de avisos y, al abrir Inicio, un aviso con la fecha, los tipos y las cápsulas que faltaban, el importe repartido, cuántas personas y cuánto a cada una.
2. **Given** un recuento con sobrantes, **When** se registra, **Then** el aviso dice cuántas cápsulas sobraban de cada tipo y que no hay cargos.
3. **Given** un recuento anulado (RN-036), **When** el administrador lo anula, **Then** cada persona activa ve un aviso de que el recuento se ha anulado y sus cargos ya no cuentan.
4. **Given** una persona con el aviso de recuento desactivado en Ajustes (RF-102), **When** se registra un recuento, **Then** no recibe la notificación push, pero el aviso sigue en el panel de avisos y en Inicio.

---

### User Story 5 - Capsulito acompaña al poner la primera contraseña (Priority: P2)

Una persona abre su enlace de invitación. Capsulito la mira mientras escribe y se tapa los ojos cuando escribe la contraseña, como en la pantalla de entrada.

**Why this priority**: es la primera pantalla que ve una persona nueva; da continuidad a RF-225.

**Independent Test**: abrir un enlace de invitación y otro de recuperación; escribir una contraseña que no coincide y después una válida, con y sin movimiento reducido y sin JavaScript.

**Acceptance Scenarios**:

1. **Given** la pantalla de un enlace de invitación o de recuperación, **When** la persona escribe en un campo de contraseña, **Then** Capsulito se tapa los ojos, y los destapa al salir del campo.
2. **Given** un envío rechazado, **When** vuelve la pantalla con el error, **Then** Capsulito pone cara triste; tras un envío correcto, celebra antes de continuar.
3. **Given** movimiento reducido o el navegador sin JavaScript, **When** se abre la pantalla, **Then** Capsulito se muestra estático y la pantalla funciona igual.

---

### User Story 6 - Ver las caras en el listado de personas (Priority: P3)

Un administrador abre `/admin/usuarios` y reconoce a cada persona por su foto a la izquierda del nombre.

**Why this priority**: mejora la lectura; no cambia reglas.

**Independent Test**: abrir el listado con una persona con foto y otra sin foto.

**Acceptance Scenarios**:

1. **Given** una persona con foto, **When** se muestra el listado, **Then** su foto aparece a la izquierda del nombre, como imagen decorativa (el nombre ya la identifica).
2. **Given** una persona sin foto, **When** se muestra el listado, **Then** aparece su avatar ilustrado (RF-222), igual que en Saldos.

---

### User Story 7 - La bienvenida explica cómo va el dinero (Priority: P3)

Una persona recorre la historia de bienvenida. Después de la escena de las compras, una escena nueva le explica que la hucha paga las cápsulas, que ella pone dinero con aportaciones y que los administradores cuentan la caja.

**Why this priority**: es la duda más habitual de una persona nueva; la explicación cabe en una escena.

**Independent Test**: recorrer la bienvenida con la voz activa y sin JavaScript (`/ayuda`) y contar las escenas.

**Acceptance Scenarios**:

1. **Given** la historia de bienvenida, **When** la persona pasa la escena de stock y compras, **Then** la escena siguiente dice: «La hucha común paga las cápsulas. Tú pones dinero con una aportación y cada café descuenta de tu saldo lo que cuesta. De vez en cuando, los administradores cuentan la caja para que todo cuadre.», y después sigue la escena de la hucha común.
2. **Given** la voz activa, **When** se muestra la escena nueva, **Then** Capsulito la dice con su locución en tono alegre.
3. **Given** `/ayuda` sin JavaScript, **When** se lee el contenido de la bienvenida, **Then** incluye la escena nueva en el mismo lugar.

---

### User Story 8 - Capsulito no se queda quieto (Priority: P3)

Mientras la persona mira Inicio, Capsulito parpadea y, cuanto más rato pasa sin que nadie le haga caso, más se impacienta: mira a los lados, golpea el suelo con el pie, mira un reloj imaginario y acaba bostezando. Nunca lo hace mientras habla.

**Why this priority**: es estética (último lugar del orden de prioridad de la constitución). Da vida a la mascota sin cambiar ninguna regla.

**Independent Test**: dejar Inicio abierto 60 s con y sin movimiento reducido; hacer que Capsulito hable a mitad de un gesto; mirar los tamaños pequeños.

**Acceptance Scenarios**:

1. **Given** Capsulito a 112 px o más, sin hablar ni hacer una pose, **When** pasan 3 s, **Then** parpadea; a los 6 s de reposo mira a los lados, a los 12 s golpea el suelo con el pie, a los 16 s mira un reloj imaginario, a los 21 s bosteza y el ciclo vuelve a empezar (RF-248).
2. **Given** un gesto de reposo en curso, **When** Capsulito empieza a hablar o a hacer una pose, **Then** el gesto se interrumpe, y al volver al reposo el ciclo empieza de nuevo desde 0 s.
3. **Given** Capsulito a menos de 112 px (tarjeta del tour, ayuda, «Deshacer», oferta de avisos), **When** está en reposo, **Then** no hace gestos.
4. **Given** movimiento reducido, **When** Capsulito está en reposo, **Then** queda quieto del todo.

---

### Edge Cases

- **Celebración y «Deshacer»**: si la persona pulsa «Deshacer» durante la celebración, el consumo se anula como hoy y la frase de registro no empieza o se corta.
- **Varios cafés seguidos**: cada confirmación lanza su propia celebración sobre su tarjeta; el sonido no se superpone (el nuevo corta el anterior).
- **El navegador bloquea el sonido** (sin interacción previa o política de reproducción): no suena y no se muestra ningún error; la confirmación en pantalla basta.
- **Cola sin conexión que se vacía después**: al sincronizar no hay celebración; se mantiene el mensaje de sincronización de hoy.
- **Orden con empates y tipos nuevos**: un tipo recién comprado sin consumos queda detrás de los consumidos, por orden alfabético.
- **Recuento sin diferencias**: no genera aviso.
- **Recuento con faltantes y sobrantes a la vez**: un único aviso con las dos partes.
- **Persona dada de alta después del recuento**: no ve ese aviso.
- **Enlace generado sin JavaScript**: la página vuelve con el enlace debajo del botón y el foco en el enlace.
- **Tour sin voz**: ningún Capsulito mueve la boca.
- **Gesto de reposo y pestaña en segundo plano**: los gestos se detienen y se reanudan al volver.

## Requirements *(mandatory)*

### Functional Requirements

**Correcciones**

- **RF-238**: «Copiar enlace» deberá copiar el enlace también cuando la aplicación se abre sin conexión segura (http). Si el navegador no permite copiar de ninguna forma, el enlace queda seleccionado y se muestra el mensaje actual.
- **RF-239**: El enlace que devuelve el alta, «Generar enlace» o «Reactivar» deberá mostrarse justo debajo del botón que lo generó, con la vista desplazada hasta él y un anuncio al lector de pantalla.
- **RF-240**: En el tour de Inicio, deberá hablar (mover la boca con la voz) el Capsulito de la tarjeta del paso. El Capsulito de Inicio queda quieto y callado mientras dura el tour. Precisa RF-227.

**Mejoras**

- **RF-241**: La pantalla de un enlace de invitación o de recuperación deberá mostrar a Capsulito con el comportamiento de RF-225 en sus campos de contraseña.
- **RF-242**: El listado de personas de administración deberá mostrar la foto de cada persona a la izquierda de su nombre, o su avatar ilustrado (RF-222) si no tiene foto.
- **RF-243**: Cuando el servidor confirma un café propio, un café de invitado o el relleno del agua, la aplicación deberá mostrar sobre la tarjeta o el botón pulsado un confeti de 1 s como máximo y reproducir un sonido corto de celebración, sin ventana, sin bloquear ningún control y sin retrasar el mensaje de confirmación ni «Deshacer». La frase de Capsulito empieza al terminar el sonido.
- **RF-244**: El sonido de celebración deberá sonar solo con la voz de Capsulito activa (RF-187). Con «Reducir movimiento» no hay confeti. Un registro pendiente de enviar no tiene celebración.
- **RF-245**: Inicio deberá ordenar las cápsulas según RN-090.
- **RF-246**: Cuando un administrador registra o anula un recuento con diferencias, el sistema deberá avisar a todas las personas activas con un resumen: fecha, tipos y cápsulas que faltaban o sobraban, importe repartido, número de personas y cantidad por persona. El aviso entra en el catálogo de RF-101 (todas las personas), en el panel de avisos (RF-107) y se muestra una vez en Inicio a cada persona.
- **RF-247**: La historia de bienvenida deberá tener nueve escenas: la escena «el dinero» va después de «stock y compras» y antes de «hucha común», con el texto de la User Story 7 y su locución. Modifica RF-188 (ocho escenas).
- **RF-248**: Donde Capsulito se muestra a 112 px o más y está en reposo (sin hablar ni hacer una pose), deberá parpadear cada 3 s y hacer los gestos de reposo en un orden fijo de impaciencia creciente, contado desde que entra en reposo: a los 6 s mira a los lados, a los 12 s golpea el suelo con el pie, a los 16 s mira un reloj imaginario y a los 21 s bosteza; después el ciclo vuelve a empezar. El gesto depende del tiempo en reposo, no del azar (constitución XVIII). Hablar o hacer una pose interrumpe el gesto y reinicia el ciclo. Con movimiento reducido, Capsulito queda quieto. Tiene respaldo estático.

**Reglas de negocio**

- **RN-090**: El orden de las cápsulas en Inicio es: de más a menos consumos vigentes registrados por la persona (propios y de invitado) en los últimos 30 días naturales (Europe/Madrid); si la persona no tiene ninguno, de más a menos consumos vigentes del departamento en ese periodo; a igualdad, por orden alfabético del nombre.

### Non-Functional Requirements

- **Rapidez**: la confirmación en pantalla de un café sigue apareciendo en 1 s o menos en el percentil 95 con red (RNF-002). La celebración no añade espera.
- **Accesibilidad**: el confeti es decorativo (sin anuncio); el mensaje de confirmación sigue anunciándose (constitución XI). El anuncio del enlace generado no mueve el foco salvo sin JavaScript.
- **Privacidad**: el aviso de recuento no contiene datos personales de ninguna persona concreta; los logs registran solo identificadores y recuentos (constitución XVI).
- **Tamaño**: el sonido de celebración ocupa 30 KB o menos.

### Out of Scope

- Un ajuste propio para el sonido (sigue a la voz de Capsulito).
- Un ajuste de stock sin reparto económico: se usa el recuento existente (RN-016).
- Gestos de reposo en los tamaños pequeños (64 px) y en el aviso flotante.
- Una ventana o diálogo de celebración.

### Key Entities

- **Aviso de recuento**: tipo nuevo del catálogo de avisos (RF-101). Datos: recuento, fecha, por tipo (cápsulas que faltaban o sobraban), importe repartido, personas y cantidad por persona; o la anulación de un recuento.
- **Sonido de celebración**: archivo de audio corto estático, generado una vez fuera de banda.
- **Gesto de reposo**: animación del catálogo tipado de Capsulito ligada al estado «reposo» y al tiempo que lleva en él.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Con la voz activa, el 100 % de los cafés confirmados por el servidor tienen celebración, y el 0 % de los pendientes de enviar.
- **SC-002**: La confirmación en pantalla de un café sigue en 1 s o menos en el percentil 95 con red; la celebración no bloquea ningún toque (cero toques perdidos en una prueba de 10 toques seguidos).
- **SC-003**: «Copiar enlace» copia el enlace a la primera en Chrome para Android y Safari para iOS, por http y por https.
- **SC-004**: Una persona con consumos en 30 días encuentra su cápsula más tomada en la primera posición de Inicio.
- **SC-005**: Tras un recuento con diferencias, el 100 % de las personas activas tienen el aviso en el panel de avisos.
- **SC-006**: Con movimiento reducido, Capsulito no hace ningún movimiento en reposo durante 60 s.

### Escenarios de verificación propuestos

- Celebración: café propio, de invitado, agua y «Sin stock» confirmado; voz activa y silenciada; con y sin movimiento reducido; sin conexión.
- Enlace: alta, «Generar enlace» y «Reactivar», con y sin JavaScript; copia por http y por https.
- Orden: dos personas con consumos distintos y una sin consumos en 30 días.
- Recuento: faltante, sobrante, mixto, sin diferencias y anulación.
- Accesibilidad: axe en claro y oscuro de `/admin/usuarios`, `acceso/[token]`, Inicio y la bienvenida.

## Impacto en las fuentes vigentes

**Constitución**. No se modifica. Los gestos de reposo siguen un orden fijo según el tiempo en reposo, así que cumplen el principio XVIII sin enmienda.

**`historias.md`**. CAMBIO-024 autorizado y aplicado el 2026-10-26 (v0.24.0, respaldo de 0.23.0 en `.respaldos/historias-v0.23.0-20261026.md`). Recoge:
- RF-188: la historia de bienvenida pasa a nueve escenas (y la definición del glosario «Bienvenida»).
- RF-101: catálogo de notificaciones con el aviso de recuento (todas las personas).
- RF-227: precisión del Capsulito que habla en el tour (RF-240).
- RF-238 a RF-248 y RN-090 nuevos, con sus CA-238 a CA-248.

**ADR-0006**. El sonido de celebración se genera fuera de banda con ElevenLabs, como las voces; se añade una nota.

## Assumptions

- El fallo de «Copiar enlace» se debe a abrir la aplicación por http (la API del portapapeles solo existe en conexiones seguras). El plan lo comprueba antes de corregir.
- Un registro pendiente de enviar no tiene ningún sonido (la opción «sonido discreto» se descarta por simplicidad).
- Los consumos de invitado registrados por la persona cuentan para su orden de Inicio, porque reflejan lo que toca.
- El aviso de recuento se muestra una vez en Inicio a cada persona y queda en el panel de avisos como el resto.
- La escena nueva de la bienvenida usa una pose del catálogo que elige el agente; su locución `intro_09` se genera con el método de tandas (ADR-0006).
- Los gestos de reposo los construye el agente con el Rive CLI local desde RML; la persona usuaria los revisa.
- Los tamaños de 112 px o más son: estados vacíos y páginas de error (112 px), Inicio (160 px), entrada y acceso (176 px), bienvenida y página de Capsulito en la ayuda (240 px).

## Clarifications

### Session 2026-10-26

- Q: ¿Celebración en ventana o sobre la tarjeta? → A: Sobre la tarjeta, sin ventana (recomendación aceptada).
- Q: ¿Sin conexión? → A: No se celebra como registrado.
- Q: ¿Dónde se aplica? → A: En todos: café propio, de invitado y agua.
- Q: ¿Qué controla el sonido? → A: El interruptor de voz de Ajustes.
- Q: ¿Orden de sonido y locución? → A: Primero celebración y sonido, después la locución; un nuevo café corta la locución.
- Q: ¿Orden de las cápsulas? → A: Las que más toma la persona en 30 días; sin consumos, el orden del departamento; a igualdad, alfabético.
- Q: ¿Ajuste de stock? → A: El recuento existente, y que se muestre en pantalla para que se sepa: aviso para todos en Inicio y en el panel de avisos.
- Q: ¿Enlace generado? → A: Justo debajo del botón que lo generó.
- Q: ¿Foto en el listado? → A: Foto o avatar ilustrado, como en Saldos.
- Q: ¿Escena nueva? → A: Solo texto, entre la 4 y la 5, con el texto aprobado y voz alegre.
- Q: ¿Qué Capsulito habla en el tour? → A: El de la tarjeta del paso; el de arriba de Inicio, no.
- Q: ¿Gestos de reposo? → A: Nuevos, construidos por el agente con el Rive CLI; parpadeo cada 3 s; nunca al hablar ni en una pose; a 112 px o más; quieto con movimiento reducido.
- Q: ¿Cómo se elige el gesto de reposo (constitución XVIII)? → A: Orden fijo de impaciencia creciente: a los 6 s mira a los lados, a los 12 s golpea el pie, a los 16 s mira el reloj, a los 21 s bosteza y vuelve a empezar.
- Q: ¿Sonido? → A: Lo genera el agente con efectos de sonido de ElevenLabs.
- Q: ¿Cómo se agrupa? → A: Todo en la funcionalidad 012; los cambios de `historias.md`, con autorización.
