# Feature Specification: Pulido de pantallas, restauración de copias y Capsulito más vivo (F14)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-26

**Status**: Aprobada por la persona usuaria el 2026-10-26. Traspasada a `historias.md` v0.26.0 (CAMBIO-026).

**Input**: User description: "Restaurar una copia de seguridad desde la aplicación, Inicio sin «efecto trilero», cinco gestos de reposo más rápidos, sonido propio para el agua, dos columnas en escritorio, avisos pendientes resaltados, stock en Compras y el corto a pantalla completa con un solo juego de subtítulos."

**Fuente**: decisiones de la persona usuaria en la sesión del 2026-10-26 (apartado «Clarifications»). Las reglas de `historias.md` que esta funcionalidad modifica se citan por su ID y se traspasan con el CAMBIO-026, que necesita su autorización expresa (apartado «Impacto en las fuentes vigentes»).

**Glosario de esta funcionalidad**:

- **Restauración**: sustitución de todos los datos de la aplicación (base de datos y fotos) por los de una copia de seguridad del bucket. No mezcla datos: lo registrado después de la fecha de la copia se pierde.
- **Copia de resguardo**: copia de seguridad del estado actual que la aplicación hace y sube al bucket justo antes de restaurar, para poder deshacer la restauración.
- **Prueba de restauración anotada**: registro manual de que un administrador comprobó que una copia se puede restaurar (RF-143). No restaura nada.
- **Orden de la visita**: orden de las cápsulas que Inicio calcula al entrar en la pantalla y conserva mientras la persona sigue en ella.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Restaurar una copia desde la aplicación (Priority: P1)

Un administrador descubre que los datos se han estropeado (por ejemplo, un error grave al registrar). Entra en «Copias de seguridad», ve la lista de copias que hay en el bucket, elige la de ayer y la restaura. La aplicación le explica antes qué va a perder, le pide su contraseña, guarda una copia de resguardo del estado actual, comprueba la copia elegida, la restaura y se reinicia.

**Why this priority**: hoy restaurar exige entrar en el servidor y seguir `docs/operacion.md` §6. Si nadie con acceso al servidor está disponible, no hay forma de recuperar los datos. Es la operación más delicada de la aplicación: toca todos los datos económicos (orden de prioridad 1 de la constitución).

**Independent Test**: con un bucket de pruebas con dos copias, restaurar la más antigua y comprobar que los saldos coinciden con los de esa copia, que existe una copia de resguardo nueva en el bucket y que la restauración queda registrada.

**Acceptance Scenarios**:

1. **Given** un administrador con S3 configurado, **When** abre «Copias de seguridad», **Then** ve las copias que hay en el bucket, de la más reciente a la más antigua, con su fecha y hora (Madrid) y su tamaño, y un botón «Restaurar» en cada una.
2. **Given** la lista, **When** pulsa «Restaurar» en una copia, **Then** ve un diálogo con el efecto: «Se sustituirán todos los datos por los del 25/10/2026 03:00. Se perderá todo lo registrado después: consumos, aportaciones, compras, arqueos, recuentos, altas y cambios de contraseña. Antes se guardará una copia del estado actual.», un campo para su contraseña y los botones «Restaurar esta copia» y «Cancelar».
3. **Given** el diálogo con la contraseña correcta, **When** confirma, **Then** la aplicación guarda y sube una copia de resguardo del estado actual, descarga y comprueba la copia elegida, sustituye los datos, se reinicia y, tras unos segundos, vuelve a responder con los datos de la copia.
4. **Given** una restauración terminada, **When** un administrador abre «Copias de seguridad», **Then** ve un aviso con la fecha de la restauración, la copia restaurada y el nombre de la copia de resguardo, y la restauración figura en el registro de auditoría.
5. **Given** una contraseña incorrecta, **When** confirma, **Then** no se restaura nada y el diálogo muestra «La contraseña no es correcta».
6. **Given** que falla la copia de resguardo, la descarga o la comprobación de la copia elegida, **When** se confirma la restauración, **Then** no se sustituye ningún dato, la aplicación sigue funcionando y el administrador ve qué ha fallado y qué puede hacer.
7. **Given** una copia hecha con una versión de la aplicación más nueva que la instalada (tiene migraciones que la aplicación no conoce), **When** se intenta restaurar, **Then** se rechaza antes de sustituir nada con «Esta copia es de una versión más nueva de beCafé. Actualiza la aplicación antes de restaurarla».
8. **Given** S3 sin configurar, **When** un administrador abre «Copias de seguridad», **Then** la sección de restauración explica que hace falta configurar el bucket y no ofrece ningún botón «Restaurar».
9. **Given** un miembro (no administrador), **When** intenta restaurar por cualquier vía, **Then** el servidor lo rechaza.

---

### User Story 2 - Entender la pantalla de copias (Priority: P1)

Un administrador abre «Copias de seguridad» y entiende qué es cada sección: las copias que hay, cómo restaurar una y para qué sirve anotar una prueba de restauración.

**Why this priority**: la persona usuaria no entendía la pantalla: confundía «Anotar prueba de restauración» con restaurar y no sabía para qué elegir «Correcta» o «Fallida». El enlace inferior dice «Personas» y lleva al panel de administración.

**Independent Test**: abrir la pantalla y comprobar los textos de cada sección y el enlace de vuelta.

**Acceptance Scenarios**:

1. **Given** la pantalla, **When** se lee la sección de anotar pruebas, **Then** se titula «Anotar una prueba de restauración» y explica: «Apunta aquí cuándo comprobaste que una copia se puede restaurar y si salió bien. No restaura nada. Si pasan 100 días sin anotar ninguna prueba, el panel muestra un aviso.».
2. **Given** la pantalla, **When** se busca el enlace de vuelta, **Then** dice «Volver a Administración» y lleva al panel de administración.

---

### User Story 3 - El confeti sale en la cápsula que pulsé (Priority: P1)

Ana está en Inicio y pulsa la segunda cápsula. El café se registra y el confeti sale sobre esa misma tarjeta. Aunque ahora sea la cápsula que más ha tomado, no cambia de sitio mientras Ana sigue en Inicio. La próxima vez que entre, aparece primera.

**Why this priority**: con el orden de RN-090 recalculado al momento, la tarjeta pulsada salta a otro puesto y el confeti parece salir en otra cápsula («efecto trilero»). Confunde en la acción más frecuente de la aplicación.

**Independent Test**: con dos tipos donde el segundo pasa a ser el más consumido tras un café, pulsar el segundo y comprobar que sigue en el segundo puesto y que el confeti está sobre él; recargar y comprobar que pasa al primero.

**Acceptance Scenarios**:

1. **Given** Inicio con las cápsulas en un orden, **When** la persona registra un café, lo deshace o registra un invitado, **Then** ninguna tarjeta cambia de puesto mientras sigue en la pantalla.
2. **Given** un registro confirmado, **When** sale la celebración, **Then** el confeti aparece sobre la tarjeta pulsada.
3. **Given** que la persona sale de Inicio y vuelve, o recarga la página, **When** se muestra Inicio, **Then** el orden se recalcula según RN-090.
4. **Given** que otra persona compra un tipo nuevo mientras Ana está en Inicio, **When** Inicio se actualiza, **Then** el tipo nuevo aparece al final de la lista hasta que Ana vuelva a entrar.

---

### User Story 4 - Capsulito se impacienta de forma más viva (Priority: P2)

Ana deja Inicio abierto. Capsulito, quieto, parpadea, mira a los lados, golpea el pie, bosteza tapándose la boca, se da toquecitos en el reloj de la muñeca como diciendo «venga, que es para hoy» y acaba bostezando y estirándose. Todo ocurre en unos 22 segundos y después vuelve a empezar.

**Why this priority**: el gesto actual del «reloj» parece un bostezo (mano junto a la boca) y no transmite prisa. El ciclo actual es lento.

**Independent Test**: con el reloj simulado, comprobar el orden y los instantes de los cinco gestos y que, con movimiento reducido, Capsulito sigue quieto.

**Acceptance Scenarios**:

1. **Given** Capsulito en reposo a 112 px o más, **When** pasan los segundos, **Then** parpadea cada 3 s y hace los gestos en este orden: a los 4 s mira a los lados, a los 9,5 s golpea el suelo con el pie, a los 15 s bosteza tapándose la boca (boca muy abierta), a los 20,5 s se da toquecitos en el reloj de la muñeca con la otra mano y a los 26 s bosteza estirándose. A los 29 s el ciclo vuelve a empezar.
2. **Given** el gesto «tocar el reloj», **When** se ve, **Then** Capsulito mira la muñeca y la golpea al menos tres veces con la otra mano, con cara de prisa.
3. **Given** que Capsulito habla, cambia de pose, está callado o hay movimiento reducido, **When** pasa el tiempo, **Then** no hace ningún gesto (como en RF-248).

---

### User Story 5 - El agua suena a agua (Priority: P2)

Beto rellena la garrafa y pulsa «He rellenado el agua». Suena un sonido corto de agua, distinto del de los cafés.

**Why this priority**: hoy suena la misma celebración que al tomar un café, y no tiene relación con el agua.

**Independent Test**: registrar un relleno de agua con la voz activa y comprobar que se pide el sonido del agua y no el de celebración.

**Acceptance Scenarios**:

1. **Given** la voz de Capsulito activa, **When** el servidor confirma un relleno de agua, **Then** suena el sonido del agua (unos 1–1,5 s) y no el de los cafés.
2. **Given** la voz silenciada o un relleno pendiente de enviar, **When** se registra, **Then** no suena nada (RF-244).

---

### User Story 6 - Pantallas de escritorio que aprovechan el ancho (Priority: P2)

En un ordenador, un administrador abre Usuarios, Arqueos y recuentos, Cápsulas, Compras o Avisos. Ve dos columnas: a la izquierda lo que hace (formularios y acciones) y a la derecha lo que consulta (listados e historial), sobre un fondo distinto y con borde.

**Why this priority**: en escritorio esas pantallas ocupan todo el ancho en una columna y cuesta leerlas. Otras pantallas (Inicio, Saldos) ya usan dos columnas.

**Independent Test**: abrir cada pantalla a 1280 px de ancho y comprobar las dos columnas; a 390 px, una sola columna con el mismo contenido.

**Acceptance Scenarios**:

1. **Given** una pantalla de 1024 px o más, **When** se abre Usuarios, **Then** el alta de persona va a la izquierda y el listado de personas a la derecha.
2. **Given** lo mismo, **When** se abre Arqueos y recuentos, **Then** el arqueo y el recuento van a la izquierda y su historial a la derecha.
3. **Given** lo mismo, **When** se abre Cápsulas, **Then** el alta de tipo va a la izquierda y el listado de tipos a la derecha.
4. **Given** lo mismo, **When** se abre Compras, **Then** registrar una compra (con el ticket) va a la izquierda y el listado de compras a la derecha.
5. **Given** lo mismo, **When** se abre Avisos, **Then** los avisos pendientes van a la izquierda y los ya vistos a la derecha.
6. **Given** cualquiera de esas pantallas, **When** se ven las dos columnas, **Then** la columna derecha tiene otro fondo y un borde, como en Inicio y Saldos.
7. **Given** una pantalla de menos de 1024 px, **When** se abre cualquiera de ellas, **Then** se ve una sola columna, con las acciones primero.

---

### User Story 7 - Ver qué avisos me faltan y cuánto queda al comprar (Priority: P3)

Ana abre Avisos y distingue de un vistazo los que todavía no ha marcado con «Entendido». Un administrador que registra una compra ve, bajo el nombre de cada cápsula, cuántas quedan.

**Why this priority**: todos los avisos tienen el mismo fondo y la pantalla resulta sosa. Al comprar, saber el stock evita comprar de más o de menos.

**Independent Test**: con un aviso pendiente y otro visto, comprobar la diferencia visual y la etiqueta; en Compras, comprobar «Quedan N» en cada tipo y «Quedan pocas» en uno con stock bajo.

**Acceptance Scenarios**:

1. **Given** un aviso sin «Entendido», **When** se ve en Avisos, **Then** tiene fondo de acento suave, borde de color y la etiqueta «Nuevo». Los ya vistos tienen fondo neutro y no llevan etiqueta.
2. **Given** la pantalla de Compras, **When** se ve cada cápsula, **Then** muestra bajo su nombre «Quedan N» con su stock actual.
3. **Given** un tipo con stock bajo (RF-218), **When** se ve en Compras, **Then** muestra «Quedan pocas» en color de aviso, con icono y con la cifra.

---

### User Story 8 - El corto se ve como un vídeo de verdad (Priority: P3)

Una persona nueva abre beCafé y ve la portada del corto a pantalla completa. Pulsa «Ver el corto» y lo ve con un solo juego de subtítulos.

**Why this priority**: hoy el vídeo sale pequeño dentro de un marco con título, y aparecen dos subtítulos a la vez (los grabados en el vídeo y los de la aplicación).

**Independent Test**: abrir la portada en móvil y en escritorio y comprobar que el vídeo ocupa la altura, con la portada difuminada a los lados, y que no hay pista de subtítulos de la aplicación.

**Acceptance Scenarios**:

1. **Given** la portada del corto, **When** se abre, **Then** el vídeo ocupa toda la pantalla sin título ni descripción encima. Si la pantalla no es 9:16, los lados muestran la portada difuminada.
2. **Given** la portada, **When** se ve, **Then** «Ver el corto» es un botón grande sobre la portada, «Saltar» está en una esquina superior sobre una pastilla opaca y «Leer la transcripción» está abajo.
3. **Given** el vídeo en marcha, **When** habla Capsulito, **Then** solo se ven los subtítulos grabados en el vídeo.
4. **Given** «Leer la transcripción», **When** se pulsa, **Then** la transcripción se abre en una hoja sobre el vídeo y se puede cerrar.

---

### Edge Cases

- **Alguien registra un café durante la restauración.** La aplicación deja de aceptar registros desde que el administrador confirma hasta que se reinicia. Ese café se rechaza con un mensaje de «Inténtalo en unos segundos» y, si estaba en la cola sin conexión, se reenvía después.
- **Cafés en la cola sin conexión de un móvil.** Los que se envían después de restaurar se registran sobre los datos restaurados (son cafés reales). Los que ya se habían enviado después de la fecha de la copia se pierden: el efecto lo dice.
- **El administrador que restaura no existe en la copia o tiene otra contraseña.** Tras reiniciar, las sesiones y contraseñas son las de la copia: puede tener que volver a entrar con la contraseña que tenía entonces. El diálogo lo advierte.
- **Restaurar la copia de resguardo.** Es una copia más de la lista, marcada como «Copia de resguardo». Restaurarla deshace la restauración anterior.
- **El bucket tiene más de 30 copias.** La lista muestra las 30 más recientes (RF-141).
- **El bucket no responde.** La lista muestra «No se pudo leer el bucket» y el resto de la pantalla funciona.
- **La aplicación no se reinicia sola** (por ejemplo, en desarrollo). La copia queda preparada y comprobada, pero los datos no cambian hasta el siguiente arranque; la pantalla de copias pide reiniciar la aplicación.
- **Dos administradores restauran a la vez.** Solo puede haber una restauración en curso; la segunda se rechaza con «Ya hay una restauración en curso».
- **Copia de antes de una migración.** Al arrancar, la aplicación aplica las migraciones que le faltan a la copia (solo avanzan, constitución XIV).
- **Inicio con un tipo que se queda sin stock durante la visita.** Conserva su puesto en la visita y muestra su estado sin stock (RF-217); al volver a entrar, se reordena.
- **Gesto de reposo interrumpido.** Si Capsulito empieza a hablar en mitad de «tocar el reloj», el gesto se corta y el ciclo vuelve a empezar al terminar (RF-248).
- **Pantallas entre 768 y 1023 px.** Una sola columna, como en móvil.

## Requirements *(mandatory)*

### Functional Requirements

**Restauración de copias (US1, US2)**

- **RF-253**: La pantalla «Copias de seguridad» deberá listar las copias que hay en el bucket, de la más reciente a la más antigua (como máximo 30), con su fecha y hora de Madrid, su tamaño y si es una copia de resguardo. Sin S3 configurado, deberá explicar que hace falta configurarlo y no ofrecer restaurar.
- **RF-254**: Un administrador deberá poder restaurar cualquier copia de la lista. Antes de confirmar, la aplicación deberá mostrar el efecto: la fecha de la copia, que se sustituyen todos los datos, qué se pierde (lo registrado después de esa fecha) y que se guardará antes una copia de resguardo. La confirmación exige la contraseña del administrador (constitución X).
- **RF-255**: Antes de sustituir ningún dato, la aplicación deberá: (a) dejar de aceptar registros; (b) hacer una copia de resguardo del estado actual y subirla al bucket; (c) descargar la copia elegida y comprobar su integridad, su suma de verificación y que no tiene migraciones más nuevas que la aplicación. Si cualquiera de los pasos falla, no se sustituye nada, la aplicación vuelve a aceptar registros y el administrador ve el motivo.
- **RF-256**: Tras sustituir los datos, la aplicación deberá reiniciarse. Al arrancar, deberá dejar constancia de la restauración en el registro de auditoría (fecha, administrador, copia restaurada y copia de resguardo) y la pantalla de copias deberá mostrar un aviso con esos datos.
- **RF-257**: La sección «Anotar una prueba de restauración» deberá explicar que solo apunta una prueba ya hecha y su resultado, que no restaura nada y que sirve para el aviso de 100 días (RF-144). El enlace de vuelta deberá decir «Volver a Administración».

**Inicio (US3)**

- **RF-258**: Inicio deberá conservar el orden de las cápsulas calculado al entrar en la pantalla mientras la persona siga en ella. Registrar, deshacer o actualizar los datos no cambia el puesto de ninguna tarjeta. Un tipo que aparece durante la visita va al final. El orden se recalcula según RN-090 al volver a entrar o al recargar. Precisa RF-245.

**Capsulito (US4, US5)**

- **RF-259**: Los gestos de reposo deberán ser cinco, en orden fijo, contados desde que Capsulito entra en reposo: a los 4 s mira a los lados, a los 9,5 s golpea el suelo con el pie, a los 15 s bosteza tapándose la boca con la boca muy abierta, a los 20,5 s se da toquecitos en el reloj de la muñeca con la otra mano, con cara de prisa, y a los 26 s bosteza estirándose. A los 29 s el ciclo vuelve a empezar. El resto de RF-248 no cambia. Sustituye los instantes y gestos de RF-248.
- **RF-260**: El relleno del agua deberá tener un sonido propio, relacionado con el agua y de 1,5 s como máximo, distinto del de los cafés. Sigue RF-244. Modifica RF-243.

**Escritorio, Avisos y Compras (US6, US7)**

- **RF-261**: Con 1024 px o más de ancho, Usuarios, Arqueos y recuentos, Cápsulas, Compras y Avisos deberán mostrar dos columnas: acciones y formularios a la izquierda, listados e historial a la derecha sobre otro fondo y con borde. Con menos ancho, una columna con las acciones primero.
- **RF-262**: En Avisos, un aviso sin «Entendido» deberá distinguirse con fondo de acento suave, borde de color y la etiqueta «Nuevo». El color no es la única señal (constitución XI).
- **RF-263**: Al registrar una compra, cada cápsula deberá mostrar bajo su nombre su stock actual («Quedan N»). Con stock bajo (RF-218), «Quedan pocas» con icono, en color de aviso, junto a la cifra.

**Corto (US8)**

- **RF-264**: La portada y el vídeo del corto deberán ocupar toda la pantalla, con la portada difuminada a los lados si la proporción no es 9:16 y sin título ni descripción encima. «Ver el corto» es el botón principal sobre la portada; «Saltar» va en una esquina superior sobre una pastilla opaca y cumple RF-252; «Leer la transcripción» va abajo y abre la transcripción en una hoja que se puede cerrar.
- **RF-265**: El corto deberá mostrar solo los subtítulos grabados en el vídeo. La aplicación no añade otra pista de subtítulos. Modifica RF-251.

### Non-Functional Requirements

- **RNF-F14-1**: La restauración de una copia de hasta 50 MB deberá completarse, con la aplicación de nuevo disponible, en 2 minutos como máximo.
- **RNF-F14-2**: Ningún paso de la restauración deberá escribir en el registro técnico nombres, correos, importes ni claves; solo identificadores, códigos, tamaños y duraciones (constitución XVI).
- **RNF-F14-3**: Las pantallas tocadas deberán pasar axe sin infracciones en tema claro y oscuro, y conservar el contraste ≥ 4,5:1 en textos y ≥ 3:1 en bordes y etiquetas (constitución XI).
- **RNF-F14-4**: El sonido del agua deberá ocupar 30 KB como máximo, como el de celebración.

### Out of Scope

- Restaurar solo una parte de los datos (por ejemplo, una persona o un mes). La restauración es siempre completa.
- Programar restauraciones o restaurar desde un archivo subido desde el ordenador.
- Cambiar la hora, la frecuencia o la retención de las copias diarias.
- Cambiar el contenido, la duración o el montaje del corto.
- Cambiar el orden de RN-090 (solo cambia cuándo se aplica).
- Columnas en pantallas distintas de las cinco citadas.
- El benchmark completo de la funcionalidad, por decisión de la persona usuaria.

### Key Entities

- **Copia del bucket**: archivo de copia en el bucket. Atributos visibles: fecha y hora, tamaño, si es de resguardo.
- **Restauración**: operación de un administrador. Atributos: fecha, administrador, copia restaurada, copia de resguardo y resultado. Queda en el registro de auditoría.
- **Prueba de restauración anotada**: sin cambios (RF-143).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador restaura una copia desde la aplicación, sin acceder al servidor, en 3 pasos (elegir, revisar el efecto con contraseña, confirmar) y la aplicación vuelve a estar disponible en 2 minutos como máximo.
- **SC-002**: En el 100 % de las restauraciones confirmadas existe una copia de resguardo en el bucket antes de sustituir los datos.
- **SC-003**: Ninguna restauración con un paso fallido (resguardo, descarga, comprobación o versión) modifica los datos.
- **SC-004**: Tras registrar un café en Inicio, la tarjeta pulsada conserva su puesto en el 100 % de los casos mientras la persona sigue en la pantalla.
- **SC-005**: Los cinco gestos de reposo ocurren en el orden y los instantes de RF-259, con una tolerancia de 1 s.
- **SC-006**: Las cinco pantallas de RF-261 se leen en dos columnas a 1280 px y en una a 390 px, sin desplazamiento horizontal.
- **SC-007**: En el corto se ve un solo subtítulo a la vez.

### Escenarios de verificación propuestos

- **EV-112**: Restauración completa contra un bucket de pruebas: saldos iguales a los de la copia, copia de resguardo en el bucket y entrada en el registro de auditoría.
- **EV-113**: Restauración con un fallo inyectado en cada paso (resguardo, descarga, suma de verificación, migración más nueva): ningún dato cambia y la aplicación sigue aceptando registros.

## Impacto en las fuentes vigentes

Cambios de `historias.md` (CAMBIO-026). Necesitan la autorización expresa de la persona usuaria y un respaldo en `.respaldos/` antes de aplicarse:

- **Nuevos**: RF-253 a RF-265, CA-253 a CA-265, EV-112, EV-113 y DEC-131 a DEC-134 (restauración desde la aplicación, orden de la visita, cinco gestos y su ritmo, sonido del agua).
- **Modificados**:
  - RF-143: además de anotar pruebas, la pantalla de copias lista las copias del bucket (RF-253).
  - RF-243: el relleno del agua usa su propio sonido (RF-260).
  - RF-245: el orden se conserva durante la visita (RF-258).
  - RF-248 y CA-248: cinco gestos con los instantes de RF-259. DEC-128 se conserva (orden fijo) con los nuevos instantes.
  - RF-251: un solo juego de subtítulos (RF-265); la transcripción se abre en una hoja y ya no aparece abierta con movimiento reducido.
  - CA-251: corrección pendiente de F13. Hoy dice que sin JavaScript la portada y la transcripción están en la página. Se propone: «Sin JavaScript no se muestra la portada y las pantallas siguen funcionando», que es como funciona.
  - Glosario: «Restauración» y «Copia de resguardo».
- `docs/operacion.md` §6: la restauración manual queda como alternativa cuando la aplicación no arranca.
- `ARCHITECTURE.md`: el módulo `copias` gana la lectura del bucket, la descarga y la restauración. La restauración exige un cierre ordenado de la base de datos y el reinicio del proceso; el plan lo diseña.
- No cambia la constitución. La restauración respeta el principio IV (no modifica ni borra registros económicos: sustituye la base completa por otra coherente) y el principio X (efecto y confirmación antes de una acción difícil de revertir).

## Assumptions

- La aplicación se ejecuta con un supervisor que la vuelve a arrancar si el proceso termina (Coolify en producción). En desarrollo hay que reiniciarla a mano.
- Las credenciales de S3 permiten listar y leer el bucket además de escribir. Si solo permiten escribir, la lista mostrará el error del bucket.
- Las copias de resguardo se guardan en el mismo bucket y con la misma retención que las diarias (30 días).
- El stock bajo de Compras usa el mismo umbral que Inicio (RF-218).
- La portada difuminada se genera a partir de la portada del corto, no del vídeo en marcha.
- Las pantallas de dos columnas siguen el diseño de las existentes (Inicio y Saldos): mismos tokens, mismo punto de corte (1024 px).

## Clarifications

### Session 2026-10-26

- Q: ¿Cómo se restaura una copia de verdad? → A: Desde la propia interfaz: lista de las copias del bucket y un botón para restaurar una (la persona usuaria descartó el comando de servidor).
- Q: ¿Cuándo se reordena Inicio? → A: Al volver a entrar; mientras la persona está en la pantalla, el orden no cambia.
- Q: ¿Qué subtítulos se quedan en el corto? → A: Los grabados en el vídeo; se quita la pista de la aplicación.
- Q: ¿Cómo quedan los gestos? → A: Cinco: el gesto actual del «reloj» pasa a bostezo con la mano y la boca muy abierta, se conserva el bostezo estirándose y se añade «tocar el reloj» transmitiendo prisa.
- Q: ¿Ritmo? → A: Más dinámico: del primer gesto al último, unos 22 s (4; 9,5; 15; 20,5 y 26 s; ciclo de 29 s, propuesto por el agente dentro de ese margen).
- Q: ¿Sonido del agua? → A: 4 candidatos de ElevenLabs; la persona usuaria elige.
- Q: ¿Reparto de las columnas? → A: Acciones a la izquierda, listados a la derecha con otro fondo y borde. Avisos: pendientes a la izquierda, vistos a la derecha.
- Q: ¿Avisos y Compras? → A: Avisos pendientes resaltados con «Nuevo»; stock bajo el nombre en Compras; el enlace «Personas» de Copias pasa a «Volver a Administración».
- Q: ¿Corto? → A: Pantalla completa con la portada difuminada a los lados; «Ver el corto» sobre la portada, «Saltar» en una esquina y «Leer la transcripción» abajo, sin título encima.
- Q: ¿Tramitación? → A: Funcionalidad nueva F14 con CAMBIO-026. Sin benchmark completo al cerrarla.
