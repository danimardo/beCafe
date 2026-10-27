# beCafé — Documento maestro de requisitos y diseño (`historias.md`)

## 1. Metadatos y estado del refinamiento

| Campo | Valor |
| --- | --- |
| Proyecto | beCafé: inventario de cápsulas de café y hucha común del departamento de informática |
| Ubicación | `historias.md` en la raíz del repositorio `github.com/danimardo/beCafe` (en el servidor de desarrollo, `/Apps/beCafe/historias.md`) |
| Versión | 0.30.0 — CAMBIO-030 |
| Fecha | 27-10-2026 |
| Responsable de negocio y de protección de datos | Responsable del departamento de informática (usuario de la sesión de refinamiento) |
| Guía aplicada | `docs/Prompts/refinamiento de requisitos.md` (biblioteca local, fuera de Git), versión 2.0.0-candidata |
| Estado del refinamiento | **Cerrado y aprobado sobre v0.14.0 (21-10-2026); CAMBIO-018 (24-10-2026): experiencia visual y Capsulito (F9), reevaluado según la guía de refinamiento, §19. CAMBIO-019 (24-10-2026): visitantes, compras rápidas, estadísticas del departamento y ayuda de Capsulito (F10), según `specs/010-visitantes-compras-ayuda/spec.md`. CAMBIO-022 (25-10-2026): Inicio centrado en el café, Capsulito gamberro y pulido de la interfaz (F11), según `specs/011-inicio-cafe-capsulito/spec.md`. CAMBIO-024 (26-10-2026): pulido de Capsulito, celebración del café y gestión de personas y stock (F12), según `specs/012-pulido-capsulito-celebracion/spec.md`. CAMBIO-025 (26-10-2026): corto de bienvenida «El misterio de la última cápsula» antes de la entrada (F13), según `specs/013-corto-capsulito/spec.md`. CAMBIO-026 (26-10-2026): pulido de pantallas, restauración de copias y Capsulito más vivo (F14), según `specs/014-pulido-pantallas-restauracion/spec.md`. CAMBIO-027 (27-10-2026): mensaje del día de Capsulito, colores y fotos de cápsula, encuadre de fotos y copias más claras (F15), según `specs/015-saludos-colores-fotos/spec.md`. CAMBIO-028 (27-10-2026): registro de quién instala la aplicación y diagnóstico de la instalación (F16), según `specs/016-registro-instalacion/spec.md`. CAMBIO-029 (27-10-2026): descarga de copias, copia manual, origen de cada copia y registro de la restauración (F17), según `specs/017-descarga-copia-manual/spec.md`. Sin bloqueantes.** PEND-034 a PEND-036 se resuelven en el plan de F1. Aplazados: PEND-014 (texto de privacidad, antes del uso con datos reales), PEND-033 (resuelto en F8) y PEND-037 (gamificación ligera). |
| Estado de traspaso a Spec Kit | Pendiente de traspaso de requisitos y diseño de funcionalidades. Módulos (§10.6) traspasados a `ARCHITECTURE.md` §3 (CAMBIO-005). División en funcionalidades acordada (§15, DEC-058). |
| Gobernanza técnica | Constitución (`.specify/memory/constitution.md`), `ARCHITECTURE.md`, `AGENTS.md` (reglas del agente, cargadas por `CLAUDE.md`), `docs/adr/`, `docs/pruebas.md` (estrategia de pruebas) y `docs/agentes.md` (controles del agente). |

**Convenciones de estado.** Cada elemento indica su estado de validación:

- **Confirmado**: decidido por el responsable durante las sesiones del 20-10-2026 y del 21-10-2026.
- **Propuesto**: sugerencia del agente sin aprobación. No forma parte del alcance implementable.
- **Restricción**: condición obligatoria con origen identificado.
- **Exclusión**: fuera del alcance de la versión 1, por decisión confirmada.

Las referencias «PREG-NNN» remiten a las preguntas de la sesión de refinamiento. Su respuesta constituye la evidencia de aprobación.

---

## 2. Contexto, problema y objetivos

### ORIG-001 — Petición original (20-10-2026, resumen fiel)

> En el departamento de informática hay una cafetera de cápsulas para todos sus miembros. Se quiere una aplicación móvil en formato PWA, posiblemente con SvelteKit, mobile first y Tailwind CSS, para llevar el inventario de cápsulas. Cuando alguien se hace un café, selecciona la cápsula que ha usado, de modo que se conozca el stock y cuándo hay que comprar. Una persona entra con su cuenta y selecciona la cápsula. Un panel de administración permite dar de alta cápsulas, actualizar el stock, gestionar los usuarios «y demás cosas».

### ORIG-002 — Ampliación (respuesta a PREG-001)

> Hay que llevar control de gastos: cuando se compra, saber quién ha pagado y quién debe dinero al bote común. Se quieren estadísticas por persona.

### ORIG-003 — Ampliación (21-10-2026, resumen fiel)

> La aplicación se va a llamar «beCafé». Se quiere una opción para que el usuario indique que ha añadido agua a la cafetera, de modo que quede reflejado quién la rellena y se vea en las estadísticas, porque quien rellena el agua tiene que ser premiado de alguna forma.

### Necesidades

| ID | Necesidad | Origen | Estado |
| --- | --- | --- | --- |
| NEC-001 | Conocer en todo momento cuántas cápsulas de cada tipo quedan. | ORIG-001 | Confirmado |
| NEC-002 | Saber cuándo hay que comprar cápsulas antes de quedarse sin ellas. | ORIG-001 | Confirmado |
| NEC-003 | Repartir el coste de las cápsulas de forma justa según el consumo de cada persona. | ORIG-002, PREG-002/003 | Confirmado |
| NEC-004 | Saber cuánto debe o tiene a favor cada persona respecto a la hucha común. | ORIG-002 | Confirmado |
| NEC-005 | Disponer de estadísticas de consumo por persona y globales. | ORIG-002 | Confirmado |
| NEC-006 | Administrar el catálogo de cápsulas, los usuarios y la configuración. | ORIG-001 | Confirmado |
| NEC-007 | Mantener la confianza entre compañeros mediante transparencia y trazabilidad del dinero. | PREG-006, PREG-009, PREG-022 | Confirmado |
| NEC-008 | Reconocer a quien se ocupa de rellenar el agua de la cafetera. | ORIG-003 | Confirmado |

### Éxito observable (propuesto)

Estos indicadores son propuestas para evaluar la aplicación tras su puesta en marcha. No hay línea base medida.

| ID | Indicador propuesto | Cómo obtenerlo |
| --- | --- | --- |
| NEC-EX-01 | Diferencia entre stock registrado y contado en cada recuento menor del 10 % por tipo. | Histórico de recuentos (RF-090). |
| NEC-EX-02 | Ningún tipo de cápsula activo llega a stock físico 0 sin aviso previo de stock bajo. | Histórico de avisos y recuentos. |
| NEC-EX-03 | Diferencia absoluta de cada arqueo inferior a 5 €. | Histórico de arqueos (RF-080). |

---

## 3. Actores, glosario y conceptos del dominio

### Actores

| ID | Actor | Descripción | Estado |
| --- | --- | --- | --- |
| ACT-01 | Miembro | Persona del departamento con cuenta activa. Consume, aporta y registra compras. | Confirmado (PREG-016) |
| ACT-02 | Administrador | Miembro con permisos adicionales. También consume y tiene saldo. Puede haber varios. | Confirmado (PREG-016) |
| ACT-03 | Invitado | Persona sin cuenta a la que un miembro invita a un café. No usa la aplicación. | Confirmado (PREG-023) |
| ACT-04 | Operador del servidor | Persona con acceso a Coolify. Configura el despliegue y el primer administrador. | Confirmado (PREG-027, PREG-032) |
| ACT-05 | Sistema (tareas programadas) | Procesos automáticos: recordatorios, resumen mensual y copias de seguridad. | Confirmado |

Volumen: unas **10 personas**, con ligeras variaciones (PREG-037).

### Glosario (regla de univocidad: un término = un concepto)

| Término | Significado | No confundir con |
| --- | --- | --- |
| **Tipo de cápsula** | Variedad de cápsula del catálogo (p. ej., «Ristretto»). Tiene stock, coste medio y umbral. | Una cápsula física concreta. |
| **Consumo** | Registro de que un miembro ha usado una cápsula de un tipo. Siempre es de una cápsula. | El cargo económico que genera. |
| **Consumo de invitado** | Consumo marcado como destinado a un invitado. Se carga a quien lo registra. | Consumo para otro miembro, que no existe. |
| **Visitante** | Persona sin cuenta que entra con un enlace de visitante y registra cafés que un administrador aprueba. No paga sus cafés (RN-086). | Invitado de un consumo de invitado, que paga el miembro que lo registra. |
| **Café de visitante** | Registro de una cápsula que un visitante dice haber usado. Queda pendiente hasta que un administrador lo aprueba o lo rechaza. | Consumo de invitado. |
| **Aportación** | Registro de dinero metido en la hucha a nombre de un miembro (la persona beneficiaria). Lo registra esa persona o un administrador (RN-087). | Compra. |
| **Compra** | Registro de una adquisición de cápsulas pagada con dinero de la hucha. | Aportación. |
| **Hucha** | Recipiente físico de efectivo en el departamento. | Saldo de una persona. |
| **Saldo teórico de la hucha** | Dinero que debería haber en la hucha según los registros. | Dinero contado en un arqueo. |
| **Saldo (de una persona)** | Suma de los movimientos de esa persona. Negativo: debe dinero. Positivo: tiene dinero a favor. | Saldo teórico de la hucha. |
| **Movimiento** | Apunte del libro de movimientos, con importe con signo, sobre una persona o sobre la hucha. | Registro (consumo, aportación o compra) que lo origina. |
| **Cargo** | Movimiento negativo en el saldo de una persona. | — |
| **Abono** | Movimiento positivo en el saldo de una persona. | — |
| **Coste medio** | Precio unitario ponderado de un tipo de cápsula, recalculado en cada compra. | Precio de una compra concreta. |
| **Anular** | Marcar un registro como no vigente, con autor, fecha y motivo. El registro se conserva. Es la única forma de corregir. | Borrar, que no existe para registros económicos. |
| **Regularización** | Movimiento automático que corrige la diferencia de precio de consumos afectados por una compra anulada. | Reparto. |
| **Arqueo** | Recuento del dinero real de la hucha por un administrador y su comparación con el saldo teórico. | Recuento de stock. |
| **Recuento de stock** | Recuento físico de cápsulas por tipo y su comparación con el stock registrado. | Arqueo. |
| **Reparto** | Distribución a partes iguales de un importe entre los miembros activos. | Regularización. |
| **Miembro activo** | Usuario con estado «activo», de cualquier rol. | Usuario dado de baja. |
| **Baja** | Desactivación de un usuario con liquidación de su saldo. No borra datos. | Borrado. |
| **Liquidación** | Conjunto de movimientos que dejan el saldo de una persona en 0 al darla de baja. | — |
| **Stock bajo** | Estado de un tipo cuyo stock es igual o menor que su umbral mínimo. | Stock negativo. |
| **Enlace de acceso** | Enlace de un solo uso y caducidad corta para definir la contraseña (invitación o recuperación). | Sesión. |
| **Panel de administración** | Zona de la misma PWA solo accesible para administradores. Equivale al «backend» de ORIG-001. | La parte servidor de la aplicación. |
| **Relleno de agua** | Registro de que un miembro ha rellenado el depósito de agua de la cafetera. No es un registro económico. | Consumo; movimiento. |
| **Intervalo mínimo entre rellenos** | Tiempo durante el que, tras un relleno vigente, no se admite otro de nadie. | Plazo de autoanulación. |
| **Aguador del mes** | Título de reconocimiento para quien más rellenos vigentes registró en un mes natural. Puede ser compartido. | Ranking de rellenos, que es por periodo y no otorga título. |
| **Registro** | Hecho guardado por la aplicación a petición de una persona: consumo, aportación, compra, arqueo, recuento o relleno. Se anula; no se borra ni se modifica. «Registrar» es crear uno. | Registro técnico; registro de auditoría. |
| **Registro técnico** | Evento de diagnóstico (log) que escriben el servidor y el cliente (constitución XVI). No contiene datos personales y no sirve como auditoría ni para reconstruir datos. En el código, `registrar(codigo, campos)`. | Registro; registro de auditoría. |
| **Registro de auditoría** | Fila de la tabla `registro_auditoria` que anota una acción administrativa (cambio de rol, baja, configuración, enlace generado) con su autor. | Registro técnico. |
| **Tema Automático** | Opción del selector de tema que sigue la apariencia clara u oscura del dispositivo, también si cambia durante la sesión (RF-180). Equivale a «Sistema» en otras aplicaciones. | Tema Claro u Oscuro elegido por la persona. |
| **Reducir transparencia** | Ajuste de Perfil que muestra todas las superficies opacas, con las mismas acciones e información (RF-181). | La preferencia del sistema operativo, que produce el mismo efecto sin activar el ajuste. |
| **Capsulito** | Mascota de beCafé: una cápsula de café con cara, brazos y zapatillas. Acompaña con animaciones Rive (`.riv`), ilustraciones SVG por capas, frases cortas y voz sintetizada opcional con sincronización labial (RF-186). Es decorativa: nunca sustituye al mensaje funcional ni bloquea operaciones. | El logotipo de beCafé (marca); la ilustración de cápsula de un tipo (RF-185). |
| **Momento** (de la mascota) | Situación o evento de presentación en que aparece Capsulito, con una pose, una expresión, un tono, una frase visible y un guion opcional de voz fijados en un catálogo cerrado (`momentos.ts`). | Aviso (RF-107); notificación push. |
| **Bienvenida** | Invitación opcional y recorrido interactivo animado de nueve escenas que explica el funcionamiento de beCafé tras aceptar la privacidad, reabrible desde Perfil y Ayuda (RF-188, RF-247). Antes de entrar va precedida del corto (RF-249). | El texto de privacidad (RF-160). |
| **Corto** | Vídeo vertical de 72 s, «El misterio de la última cápsula», que explica con humor el problema que resuelve beCafé. Se ve desde su portada con «Ver el corto» (RF-249, RF-251). | La bienvenida de nueve escenas (RF-188). |
| **Restauración** | Sustitución de todos los datos (base de datos y fotos) por los de una copia de seguridad del bucket, desde la pantalla de copias (RF-254). Lo registrado después de la fecha de la copia se pierde. | La copia diaria (RF-140), que no sustituye datos. |
| **Copia de resguardo** | Copia del estado actual que la aplicación hace y sube al bucket justo antes de una restauración, para poder deshacerla (RF-255). | La copia diaria (RF-140). |
| **Saludo** | Frase con la que Capsulito recibe a una persona al abrir Inicio, como máximo una vez cada 2 horas (RF-214). | La bienvenida (RF-188). |
| **Mensaje del día** | Texto del bocadillo de Capsulito en Inicio cuando no hay saludo, evento ni aviso: uno por persona y día, elegido sin repetir de un catálogo de al menos 40 (RF-266, RN-091). | El saludo (RF-214), que dura 6 s. |
| **Copia manual** | Copia de seguridad que un administrador lanza desde la pantalla de copias (RF-286). Tiene el mismo contenido que la diaria y se marca «Manual» en la lista (RF-287). | La copia diaria (RF-140) y la copia de resguardo (RF-255). |
| **Origen de una copia** | Sistema donde se hizo una copia: el dominio de su `ORIGIN`, o «Local» si es `localhost` o `127.0.0.1` (RF-289). | El bucket, que es el destino de la copia, no su origen. |
| **Identificador de restauración** | ULID que comparten todos los eventos técnicos de una misma restauración, también los posteriores al reinicio (RF-291). | El identificador de operación de una petición (constitución XVI). |
| **Color propio** | Color de un tipo de cápsula elegido con el selector libre, fuera de los colores fijos; la aplicación calcula el texto y los límites para el contraste (RF-269, RF-270). | Los colores fijos del sistema de diseño. |
| **Encuadre** | Zona cuadrada de una foto que la persona elige antes de guardarla; el servidor recorta esa zona (RF-273, RF-274). | El redimensionado de RF-005. |
| **Estado de instalación** | Dato por persona (`instalada` o `rechazada`) con el instante del último cambio. Lo ven los administradores en la ficha (RF-278, RF-281). |
| **Aviso de instalación** | Evento `beforeinstallprompt` con que Chrome indica que la aplicación se puede instalar. Se lanza una vez por carga de página (RF-276). |
| **Diagnóstico de instalación** | Lista de Ajustes que explica por qué se ofrece o no instalar. Solo se muestra, no se guarda (RF-277). |
| **Frase de registro** | Frase que Capsulito muestra y dice cuando el servidor confirma un café propio o de invitado (RF-213). | El saludo. |
| **Ajustes** | Sección personal de cada persona con apariencia, Capsulito y voz, notificaciones e instalación (RF-220). | Configuración, que es del departamento y solo de administradores. |

---

## 4. Alcance, exclusiones, restricciones y dependencias

### Alcance de la versión 1 (confirmado)

Registro de consumos, catálogo de tipos de cápsula con foto, stock, compras, aportaciones, hucha, coste medio, regularizaciones, arqueos, recuentos, repartos, usuarios con dos roles, bajas con liquidación, notificaciones en la aplicación y push, estadísticas, resumen mensual, funcionamiento sin conexión de los consumos, copias de seguridad, registro de rellenos de agua con ranking y título de aguador del mes (ORIG-003).

### Exclusiones

| ID | Exclusión | Origen | Estado |
| --- | --- | --- | --- |
| EXC-001 | Modos de reparto distintos de «por consumo» (cuota fija, mixta) y su pantalla de configuración. | PREG-003 | Exclusión temporal confirmada |
| EXC-002 | Cargos periódicos automáticos (cuotas). | PREG-003 | Exclusión temporal confirmada |
| EXC-003 | Envío de correos electrónicos (invitaciones y recuperación). | PREG-015 | Exclusión temporal confirmada |
| EXC-004 | Cierres periódicos de cuentas. | PREG-030 | Exclusión confirmada |
| EXC-005 | Pagar compras con dinero propio, reembolsos de compras. | PREG-007 | Exclusión confirmada |
| EXC-006 | Registrar consumos a nombre de otro miembro. | PREG-023 | Exclusión confirmada |
| EXC-007 | Funcionamiento sin conexión de aportaciones, compras, rellenos de agua y acciones de administración. | PREG-025, PREG-046 | Exclusión confirmada |
| EXC-008 | Inicio de sesión corporativo (SSO) y autenticación multifactor. | PREG-014 | Exclusión confirmada |
| EXC-009 | Idiomas distintos del español. | PREG-037 | Exclusión confirmada |
| EXC-010 | Varias cafeteras o cápsulas incompatibles. | ORIG-001 («una cafetera») | Exclusión confirmada |
| EXC-011 | Seudonimización o borrado de datos de personas dadas de baja. | PREG-033 | Exclusión confirmada, con condición de revisión (DEC-033) |
| EXC-012 | Premios económicos (cafés gratis, abonos), insignias y logros por rellenar el agua. | PREG-045 | Exclusión confirmada |
| EXC-013 | Otras tareas de mantenimiento de la cafetera (vaciar el cajón de cápsulas usadas, descalcificar, limpiar). | PREG-045 | Exclusión confirmada |
| EXC-014 | Estimación del nivel de agua y avisos de «toca rellenar». | PREG-046 | Exclusión confirmada |

### Restricciones

| ID | Restricción | Origen y autoridad | Estado |
| --- | --- | --- | --- |
| RT-001 | La aplicación es una PWA mobile first. | ORIG-001 | Restricción |
| RT-002 | Framework SvelteKit y estilos con Tailwind CSS. | ORIG-001, PREG-041 | Restricción confirmada |
| RT-003 | Despliegue en servidor propio o VPS gestionado con Coolify, contenedores Docker. | PREG-027 | Restricción confirmada |
| RT-004 | Base de datos SQLite. | PREG-028 (sustituye a PostgreSQL, propuesto en PREG-027) | Restricción confirmada |
| RT-005 | Copia de seguridad diaria de madrugada a un bucket S3. | PREG-028, PREG-029, PREG-036 | Restricción confirmada |
| RT-006 | Servidor accesible desde internet por HTTPS y con salida a internet. | PREG-027, PREG-037 | Restricción confirmada |
| RT-007 | Contraseñas de 15 caracteres como mínimo. | Política de la empresa (PREG-037) | Restricción confirmada |
| RT-008 | Accesibilidad WCAG 2.2 nivel AA. | PREG-034 | Restricción confirmada |
| RT-009 | Interfaz solo en español. | PREG-037 | Restricción confirmada |
| RT-010 | Una única instancia de la aplicación en ejecución. Las tareas programadas y SQLite lo requieren. | RT-004, DT-040, PREG-041 | Restricción confirmada |
| RT-011 | La aplicación se llama «beCafé», escrito exactamente así. Es el nombre visible en la interfaz, la PWA instalada, las notificaciones y el texto de privacidad. «Cápsula» sigue siendo el término del dominio. | ORIG-003, PREG-047 | Restricción confirmada |

### Dependencias externas

| ID | Dependencia | Uso |
| --- | --- | --- |
| DEP-01 | Servicios push de los navegadores (Apple, Google, Mozilla) | Entrega de notificaciones push (RF-100). |
| DEP-02 | Bucket compatible con S3 | Destino de las copias de seguridad (RF-140). |
| DEP-03 | Coolify | Despliegue, variables de entorno, logs y terminal del contenedor. |

---

## 5. Historias de usuario

| ID | Historia | Requisitos |
| --- | --- | --- |
| HU-01 | Como miembro, quiero registrar con un toque la cápsula que uso, para que el stock y mi saldo se actualicen sin esfuerzo. | RF-010 a RF-016 |
| HU-02 | Como miembro, quiero deshacer un registro equivocado, para no pagar por un error. | RF-013, RF-060 a RF-063 |
| HU-03 | Como miembro, quiero registrar el café de un invitado, para que se me cobre sin distorsionar mis estadísticas. | RF-014 |
| HU-04 | Como miembro, quiero registrar mi café aunque no tenga cobertura, para que no se pierda. | RF-015, RF-016 |
| HU-05 | Como miembro, quiero registrar el dinero que meto en la hucha, para reducir mi deuda. | RF-030 a RF-032 |
| HU-06 | Como miembro, quiero registrar una compra de cápsulas, para que el stock y la hucha reflejen la realidad. | RF-040 a RF-046 |
| HU-07 | Como miembro, quiero ver mi saldo, los saldos de todos y el historial económico, para confiar en el reparto. | RF-110 a RF-113 |
| HU-08 | Como miembro, quiero saber cuándo hay que comprar, para que no nos quedemos sin café. | RF-020 a RF-023, RF-100 |
| HU-09 | Como miembro, quiero recibir avisos de stock bajo, de mi deuda y un resumen mensual, y elegir cuáles, para estar informado sin saturarme. | RF-100 a RF-106 |
| HU-10 | Como miembro, quiero ver mis estadísticas de consumo, para conocer mis hábitos. | RF-120 a RF-122 |
| HU-11 | Como administrador, quiero gestionar el catálogo de tipos de cápsula, para que la pantalla principal muestre lo que hay. | RF-001 a RF-005 |
| HU-12 | Como administrador, quiero hacer arqueos de la hucha y recuentos de stock, para corregir desfases y repartirlos. | RF-080 a RF-092 |
| HU-13 | Como administrador, quiero dar de alta, dar de baja y reactivar usuarios, para que solo el equipo actual use la aplicación. | RF-130 a RF-139c |
| HU-14 | Como administrador, quiero anular registros de cualquiera, para corregir errores fuera del plazo de autoanulación. | RF-061 |
| HU-15 | Como administrador, quiero configurar los parámetros del sistema, para adaptarlo al equipo. | RF-150 |
| HU-16 | Como operador del servidor, quiero que existan copias diarias restaurables, para no perder los datos económicos. | RF-140 a RF-143 |
| HU-17 | Como miembro, quiero registrar que he rellenado el agua de la cafetera, para que el equipo sepa quién se ocupa de ella y se le reconozca. | RF-170 a RF-176 |
| HU-18 | Como miembro, quiero dar un enlace a un visitante para que registre su café sin cuenta, y como administrador quiero aprobarlo, para que el stock cuadre sin que nadie registre cafés falsos. | RF-189 a RF-194, RF-210 |
| HU-19 | Como miembro, quiero registrar de una vez una compra de varios tipos, para apuntar la compra del supermercado en un momento. | RF-197, RF-198 |
| HU-20 | Como miembro, quiero ver de un vistazo el consumo de todo el departamento y lo que aporta cada persona, para confiar en el reparto. | RF-199, RF-201, RF-202 |
| HU-21 | Como miembro, quiero que Capsulito me explique cada pantalla cuando lo pida, para usar bien la aplicación. | RF-203 a RF-205 |

---

## 6. Reglas de negocio, estados e invariantes

### 6.1 Reglas económicas

| ID | Regla | Origen | Estado |
| --- | --- | --- | --- |
| RN-001 | El modo de reparto es **por consumo**: cada consumo vigente genera un cargo a quien lo registró por el precio aplicado. | PREG-003 | Confirmado |
| RN-002 | El precio aplicado a un consumo es el **coste medio vigente** de su tipo en el momento en que el servidor recibe el consumo. | PREG-004, PREG-036 (PEND-016) | Confirmado |
| RN-003 | Al registrar una compra de un tipo con stock S > 0, coste medio C y una línea de Q cápsulas por importe I: nuevo coste medio = (S × C + I) ÷ (S + Q). | PREG-004 | Confirmado |
| RN-004 | Si el stock S del tipo es ≤ 0 al registrar la compra, el nuevo coste medio = I ÷ Q. | PREG-017 | Confirmado |
| RN-005 | Un consumo con stock ≤ 0 usa el **último coste medio conocido** del tipo. | PREG-017 | Confirmado |
| RN-006 | Un tipo que nunca se ha comprado no tiene coste medio y no se muestra para registrar consumos. | PREG-036 (PEND-010) | Confirmado |
| RN-007 | Los cargos ya generados nunca se recalculan ni se modifican. Las diferencias se corrigen con movimientos nuevos. | PREG-004, PREG-009 | Confirmado |
| RN-008 | Una aportación vigente genera un abono a su persona beneficiaria y un aumento igual del saldo teórico de la hucha. | PREG-006, CAMBIO-019 (DEC-117) | Confirmado |
| RN-009 | Una compra vigente se paga solo con dinero de la hucha: reduce el saldo teórico de la hucha por su importe total y no modifica ningún saldo personal. | PREG-007 | Confirmado |
| RN-010 | **Saldo de una persona** = suma de sus movimientos vigentes. | PREG-002/003 | Confirmado |
| RN-011 | **Saldo teórico de la hucha** = aportaciones vigentes − compras vigentes ± ajustes de arqueo − devoluciones por baja. | PREG-005, PREG-012, PREG-013 | Confirmado |
| RN-012 | Al anular una compra, el sistema reconstruye el coste medio del tipo afectado con las compras vigentes y genera, para cada persona con consumos posteriores a la compra, una **regularización** por la diferencia entre el precio aplicado y el que debió aplicarse. | PREG-011 | Confirmado |
| RN-013 | Al anular un consumo, el stock aumenta en 1 y su cargo deja de contar. No se recalcula ningún otro cargo ni el coste medio. | PREG-036 (HALL-005) | Confirmado |
| RN-014 | Un **reparto** divide un importe en céntimos entre los miembros activos en el momento del reparto. Los céntimos sobrantes se asignan de uno en uno a miembros elegidos al azar. La asignación queda registrada y la suma es exactamente el importe. | PREG-012, PREG-036 (HALL-006) | Confirmado |
| RN-015 | En un arqueo con diferencia D = contado − saldo teórico ≠ 0: el saldo teórico se ajusta en D y se reparte D entre los miembros activos (D negativa genera cargos; D positiva, abonos). | PREG-012 | Confirmado |
| RN-016 | En un recuento de stock, si faltan F cápsulas de un tipo: el stock se reduce en F y se reparte en cargos el valor F × coste medio vigente. Si sobran, el stock aumenta sin movimiento económico ni cambio de coste medio. | PREG-018 | Confirmado |
| RN-017 | Al dar de baja a una persona con saldo negativo, se registra lo que pague como aportación. Si no paga, un administrador registra la **deuda incobrable**: un abono a la persona que deja su saldo en 0 y un reparto en cargos del mismo importe entre los demás miembros activos. | PREG-013 | Confirmado |
| RN-018 | Al dar de baja a una persona con saldo positivo, se registra la **devolución** de efectivo desde la hucha: un cargo a la persona que deja su saldo en 0 y una reducción igual del saldo teórico de la hucha. | PREG-013 | Confirmado |
| RN-019 | Si una compra deja el saldo teórico de la hucha negativo, el sistema pide confirmación antes de registrarla. Tras confirmar, la registra y notifica a los administradores. | PREG-035 | Confirmado |
| RN-020 | Los importes se guardan como enteros en céntimos. El coste medio se guarda en diezmilésimas de euro. | PREG-028, PREG-041 (apartado 10) | Confirmado |
| RN-021 | El cargo de un consumo es el coste medio redondeado al céntimo (mitad hacia arriba). Las diferencias de redondeo se absorben en los arqueos. | PREG-041 (PEND-021) | Confirmado |
| RN-086 | Un café de visitante aprobado reduce en 1 el stock de su tipo y no genera movimientos personales ni cambia el saldo teórico de la hucha, que ya pagó la cápsula al comprarla: el departamento asume el coste. El café guarda como valor informativo el coste medio vigente al aprobarlo. Pendiente o rechazado, no tiene ningún efecto. | CAMBIO-019 (DEC-116) | Confirmado |
| RN-087 | Una aportación guarda a su persona beneficiaria, que recibe el abono, y a la persona que la registró. Solo un administrador puede registrar una aportación cuya beneficiaria sea otra persona. | CAMBIO-019 (DEC-117) | Confirmado |
| RN-088 | Para cada persona y cada lista de frases (registro, saludo), una frase no se repite hasta que la persona ha recibido todas las de la lista. Cada frase se elige al azar entre las no recibidas del ciclo actual; cuando no queda ninguna, empieza un ciclo nuevo con todas. Una frase cuenta como recibida cuando el servidor la entrega, aunque después se deshaga el café. El ciclo se guarda en la cuenta. | CAMBIO-022 (DEC-121) | Confirmado |
| RN-089 | El instante del último saludo se guarda en UTC en la cuenta; el intervalo de 2 horas se mide con el reloj del servidor. | CAMBIO-022 | Confirmado |
| RN-090 | Inicio ordena las cápsulas de más a menos consumos vigentes registrados por la persona (propios y de invitado) en los últimos 30 días naturales (Europe/Madrid). Si la persona no tiene ninguno, usa los consumos vigentes del departamento en ese periodo. A igualdad, por orden alfabético del nombre. | CAMBIO-024 | Confirmado |
| RN-091 | Cada persona tiene como máximo un mensaje del día por día natural (Europe/Madrid), el mismo en todos sus dispositivos. El primer día que Inicio lo muestra, el servidor lo elige al azar entre los del catálogo que la persona no ha recibido en la vuelta actual; cuando no queda ninguno, empieza una vuelta nueva con todos. Un día en que el bocadillo muestra un aviso, no se asigna mensaje del día y no se gasta ninguno. La asignación se guarda en la cuenta. | CAMBIO-027 (DEC-135) | Confirmado |

### 6.2 Reglas de anulación y permisos

| ID | Regla | Origen | Estado |
| --- | --- | --- | --- |
| RN-030 | Los consumos, aportaciones y compras nunca se modifican ni se borran. Para corregirlos se anulan con autor, fecha y motivo obligatorio. | PREG-009 | Confirmado |
| RN-031 | Cuando el autor usa «Deshacer» en los 5 segundos siguientes al registro, el sistema no pide motivo y guarda «Deshecho por el autor». | PREG-041 (PEND-023) | Confirmado |
| RN-032 | Un miembro puede anular sus propios registros durante el **plazo de autoanulación** (15 minutos por defecto, configurable). | PREG-010, PREG-036 | Confirmado |
| RN-033 | Un administrador puede anular cualquier registro en cualquier momento. | PREG-010 | Confirmado |
| RN-034 | Nadie puede registrar consumos ni aportaciones a nombre de otra persona. | PREG-006, PREG-023 | Confirmado |
| RN-035 | Los registros anulados no cuentan en saldos, stock ni coste medio. | PREG-009 | Confirmado |
| RN-036 | Un administrador solo puede anular el último arqueo registrado y, para cada tipo de cápsula, el último recuento que lo incluyó. La anulación exige motivo y revierte el ajuste y los repartos de ese registro. | PREG-039 | Confirmado |
| RN-037 | Una compra tiene una o varias líneas (tipo, cantidad, importe). Su importe total es la suma de las líneas. Anular una compra anula todas sus líneas y aplica RN-012 a cada tipo afectado. | PREG-038 | Confirmado |

### 6.3 Reglas de usuarios y acceso

| ID | Regla | Origen | Estado |
| --- | --- | --- | --- |
| RN-040 | Hay dos roles: miembro y administrador. Un administrador es también miembro. | PREG-016 | Confirmado |
| RN-041 | Siempre debe existir al menos un administrador activo. | PREG-016 | Confirmado |
| RN-042 | La aplicación recomienda (sin obligar) tener al menos dos administradores activos. | PREG-036 (HALL-007) | Confirmado |
| RN-043 | Solo un administrador puede dar de alta, dar de baja, reactivar y cambiar el rol de un usuario. | PREG-013, PREG-016 | Confirmado |
| RN-044 | Una baja exige que el saldo de la persona quede en 0 mediante RN-017 o RN-018. | PREG-013 | Confirmado |
| RN-045 | Un usuario reactivado vuelve con saldo 0. | PREG-036 (PEND-007) | Confirmado |
| RN-046 | Los datos de los usuarios dados de baja se conservan identificados sin límite de tiempo. | PREG-033, PREG-040 | Confirmado (riesgo HALL-008 aceptado expresamente) |
| RN-047 | Las contraseñas tienen 15 caracteres como mínimo. | RT-007 | Restricción |
| RN-048 | Tras 5 intentos fallidos de inicio de sesión, la cuenta queda bloqueada 15 minutos. | PREG-036 | Confirmado |
| RN-049 | La sesión dura 90 días y se renueva con el uso. | PREG-031 | Confirmado |
| RN-050 | Las acciones de administrador exigen haber introducido la contraseña en los últimos 15 minutos. | PREG-031 | Confirmado |
| RN-051 | Restablecer la contraseña, dar de baja o pulsar «Cerrar sesión en todos los dispositivos» invalida todas las sesiones del usuario. | PREG-031 | Confirmado |
| RN-052 | Un enlace de invitación caduca a las 24 horas; uno de recuperación, a la hora. Ambos son de un solo uso. Generar uno nuevo anula los anteriores del mismo usuario. | PREG-015, PREG-036 | Confirmado |
| RN-053 | Una contraseña nueva se rechaza si tiene menos de 15 caracteres o figura en la lista de bloqueo de contraseñas comunes. No se imponen reglas de composición. | PREG-041 (PEND-029), FUENTE-02 | Confirmado |
| RN-054 | El servidor rechaza los consumos que lleguen de un usuario dado de baja, también los de la cola sin conexión, y el móvil informa de ello. | PREG-041 (PEND-032) | Confirmado |
| RN-055 | Un usuario dado de baja no puede iniciar sesión. El sistema lo rechaza con el mismo mensaje que un correo inexistente o una contraseña incorrecta (RF-133). | Especificación de F1, 21-10-2026 (HALL-016) | Confirmado |

### 6.4 Reglas de visibilidad

| ID | Regla | Origen | Estado |
| --- | --- | --- | --- |
| RN-060 | Todos los miembros ven los saldos de todos, el historial de aportaciones y compras y las estadísticas globales. | PREG-022 | Confirmado |
| RN-061 | Todos los miembros ven las estadísticas de consumo de todas las personas activas. | PREG-022, CAMBIO-019 (DEC-118) | Confirmado |
| RN-062 | Los registros anulados están ocultos por defecto en los historiales y se muestran con el filtro «Mostrar anulados». | PREG-036 (PEND-005) | Confirmado |
| RN-063 | Todos los miembros ven los rellenos de agua de todos (autor, fecha y hora), el ranking de rellenos y el aguador del mes. | PREG-045 | Confirmado |

### 6.5 Reglas de stock y avisos

| ID | Regla | Origen | Estado |
| --- | --- | --- | --- |
| RN-070 | Stock de un tipo = cápsulas de compras vigentes − consumos vigentes ± ajustes de recuento. Puede ser negativo. | PREG-017, PREG-018 | Confirmado |
| RN-071 | Un tipo está en **stock bajo** cuando su stock es menor o igual que su umbral mínimo. | PREG-019 | Confirmado |
| RN-072 | El aviso de stock bajo se envía una sola vez cuando el tipo entra en stock bajo. Se vuelve a enviar solo después de que el tipo haya salido de stock bajo. | PREG-020 | Confirmado |
| RN-073 | Los días estimados restantes de un tipo = stock ÷ consumo medio diario de los últimos 30 días. Es informativo y no dispara avisos. | PREG-036 (PEND-011) | Confirmado |
| RN-074 | El aviso personal de deuda se envía cuando el saldo baja del límite de deuda L (−5 € por defecto). Mientras siga por debajo, se recuerda con una frecuencia que aumenta con la deuda, según tramos calculados a partir de L: saldo por debajo de L, cada 7 días; por debajo de 2 × L, cada 3 días; por debajo de 4 × L, cada día. El intervalo se cuenta desde el último recordatorio enviado: pasar a un tramo superior no provoca un envío inmediato. No se puede desactivar. | PREG-021, PREG-036, PREG-042 | Confirmado |

### 6.6 Estados

**Registro económico (consumo, aportación, compra)**

| Estado previo | Acción | Actor y condición | Estado resultante | Efectos |
| --- | --- | --- | --- | --- |
| — | Registrar | Miembro autenticado | Vigente | Movimientos, stock y coste medio según RN-001 a RN-009 |
| Vigente | Anular | Autor dentro del plazo (RN-032) o administrador (RN-033) | Anulado | Deja de contar (RN-035); compra: regularización (RN-012) |
| Anulado | Anular o reactivar | Cualquiera | **Prohibido** | — |

**Arqueo y recuento**

| Estado previo | Acción | Actor y condición | Estado resultante | Efectos |
| --- | --- | --- | --- | --- |
| — | Registrar | Administrador reautenticado | Vigente | Ajuste y reparto (RN-015, RN-016) |
| Vigente | Anular | Administrador; es el último arqueo, o el último recuento de cada tipo incluido (RN-036) | Anulado | Revierte ajuste y repartos |
| Vigente, no último | Anular | Cualquiera | **Prohibido** | — |

**Usuario**

| Estado previo | Acción | Actor y condición | Estado resultante |
| --- | --- | --- | --- |
| — | Alta | Administrador | Activo, sin contraseña (pendiente de invitación) |
| Activo | Baja | Administrador, saldo liquidado a 0, no es el último administrador activo | Dado de baja |
| Dado de baja | Reactivar | Administrador | Activo, saldo 0 |

**Tipo de cápsula**: activo ⇄ retirado (administrador). Un tipo con registros nunca se borra. Un tipo sin registros puede borrarse (PREG-041).

**Relleno de agua**: vigente → anulado, con los mismos actores y condiciones que un registro económico (RN-083). Un relleno anulado nunca vuelve a estar vigente.

### 6.7 Invariantes

| ID | Invariante | Ejemplo que intenta violarla | Verificación futura |
| --- | --- | --- | --- |
| INV-01 | La suma de los movimientos de un reparto es exactamente el importe repartido. | Reparto de 7,00 € entre 6 personas. | EV-020 |
| INV-02 | El stock y el coste medio guardados coinciden con su recálculo desde los registros vigentes. | Anulación concurrente de una compra y registro de un consumo. | EV-030 |
| INV-03 | Siempre hay al menos un administrador activo. | Dar de baja o quitar el rol al último administrador. | EV-040 |
| INV-04 | Un mismo identificador de cliente produce como máximo un consumo. | El móvil reenvía un consumo tras perder la respuesta. | EV-010 |
| INV-05 | Ningún registro anulado vuelve a estar vigente. | Petición directa a la URL de anulación de un registro ya anulado. | EV-011 |
| INV-06 | Tras la baja, el saldo de la persona es 0. | Baja con un consumo en la cola sin conexión. | EV-041 |
| INV-07 | Entre dos rellenos vigentes nunca hay menos tiempo que el intervalo mínimo vigente al registrar el segundo. | Dos personas pulsan «He rellenado el agua» a la vez. | EV-100 |

### 6.8 Reglas del relleno de agua

| ID | Regla | Origen | Estado |
| --- | --- | --- | --- |
| RN-080 | Un relleno de agua es un registro no económico a nombre de quien lo registra: no genera movimientos ni modifica saldos, stock, coste medio ni la hucha. Nadie puede registrar un relleno a nombre de otra persona. | ORIG-003, PREG-045, PREG-047 | Confirmado |
| RN-081 | Registrar un relleno requiere conexión. No entra en la cola sin conexión (EXC-007). | PREG-046 | Confirmado |
| RN-082 | El sistema rechaza un relleno si existe otro relleno vigente, de cualquier persona, registrado hace menos del **intervalo mínimo entre rellenos** (60 minutos por defecto, configurable). Los rellenos anulados no cuentan para el intervalo. | PREG-045, PREG-046 | Confirmado |
| RN-083 | Un relleno se anula como un consumo: «Deshacer» en los 5 segundos siguientes, sin motivo (RN-031); el autor, con motivo, dentro del plazo de autoanulación (RN-032); un administrador, con motivo, en cualquier momento (RN-033). Los rellenos anulados no cuentan en el ranking ni en el aguador del mes. | PREG-047 | Confirmado |
| RN-084 | El **aguador del mes** es la persona, o las personas en caso de empate, con más rellenos vigentes en el mes natural (hora de Madrid). Se determina el día 1 del mes siguiente. Si nadie registró rellenos, no hay título. Solo optan los miembros activos en el momento de determinarlo. | PREG-046, PREG-047 | Confirmado |
| RN-085 | Los rellenos de las personas dadas de baja se conservan y cuentan en el ranking de los periodos en que se registraron. | PREG-047 | Confirmado |

---

## 7. Requisitos funcionales

Formato: enunciado canónico en EARS cuando aporta claridad. «El sistema» es la aplicación servidor salvo indicación.

### 7.1 Catálogo de tipos de cápsula

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-001 | Un administrador deberá poder dar de alta un tipo de cápsula con nombre, marca, intensidad opcional (1–13), color (uno de 7 fijos o un color propio, RF-269), foto y umbral mínimo. | PREG-026, CAMBIO-027 | Confirmado | CA-001 |
| RF-002 | El sistema deberá rechazar un nombre igual al de otro tipo activo, sin distinguir mayúsculas. | PREG-026 | Confirmado | CA-002 |
| RF-003 | Un administrador deberá poder editar los datos descriptivos y el umbral de un tipo. Editar no modifica stock ni coste medio. Puede quitar la foto del tipo (RF-272). | PREG-026, CAMBIO-027 | Confirmado | CA-003 |
| RF-004 | Un administrador deberá poder retirar y volver a activar un tipo. Un tipo retirado no se muestra para registrar consumos ni compras y conserva su historial. | PREG-026 | Confirmado | CA-004 |
| RF-005 | Cuando un administrador sube una foto, el sistema deberá validar el tipo real del fichero (JPEG, PNG o WebP), rechazar ficheros de más de 5 MB, recortarla con la zona de encuadre o, sin ella, por el centro (RF-274), redimensionar la imagen y eliminar sus metadatos. | PREG-026, PREG-041, CAMBIO-027 | Confirmado | CA-005 |
| RF-006 | Un administrador deberá poder borrar un tipo de cápsula sin ningún registro. Si tiene registros, el sistema solo permite retirarlo. | PREG-041 (PEND-024) | Confirmado | CA-006 |

### 7.2 Registro de consumos

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-010 | La pantalla principal deberá mostrar los tipos activos con coste medio, con foto, color, nombre, marca, intensidad, stock y estado de stock bajo. | PREG-024, PREG-026 | Confirmado | CA-010 |
| RF-011 | Cuando un miembro toca un tipo, el sistema deberá registrar un consumo de una cápsula a su nombre sin pasos adicionales, salvo cuando el stock del tipo es ≤ 0, en que pide antes una confirmación (RF-217). | PREG-024, CAMBIO-022 | Confirmado | CA-011, CA-217 |
| RF-012 | Cuando se registra un consumo, el sistema deberá reducir en 1 el stock del tipo y generar un cargo al autor según RN-002 y RN-021. | RN-001 | Confirmado | CA-012 |
| RF-013 | Tras registrar un consumo, el cliente deberá mostrar durante 5 segundos una confirmación con el botón «Deshacer», anunciada al lector de pantalla. | PREG-024, PREG-034 | Confirmado | CA-013 |
| RF-014 | El miembro deberá poder marcar un consumo como «para un invitado» mediante una opción secundaria. El cargo va al autor. | PREG-023 | Confirmado | CA-014 |
| RF-015 | Si no hay conexión al registrar un consumo, el cliente deberá guardarlo en una cola local, mostrarlo como «pendiente de enviar» y enviarlo al recuperar la conexión. | PREG-025 | Confirmado | CA-015 |
| RF-016 | Cada consumo deberá llevar un identificador único generado en el cliente. El sistema deberá ignorar un consumo cuyo identificador ya exista y devolver el registro original. | PREG-024 | Confirmado | CA-016 |
| RF-017 | Si el stock del tipo es ≤ 0, el sistema deberá registrar el consumo, avisar al autor del descuadre y notificar a los administradores. | PREG-017 | Confirmado | CA-017 |
| RF-018 | El sistema deberá guardar en cada consumo la hora del toque en el cliente y la hora de recepción en el servidor. | PREG-025 | Confirmado | CA-015 |
| RF-019 | Mientras haya consumos pendientes de enviar, el cliente deberá mostrar un aviso visible de que se perderán si se borran los datos del navegador. | PREG-025 | Confirmado | CA-015 |

### 7.3 Stock bajo y estimación

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-020 | El sistema deberá marcar como «stock bajo» los tipos que cumplan RN-071. | PREG-019 | Confirmado | CA-020 |
| RF-021 | La aplicación deberá mostrar al abrirla un panel de avisos con los tipos en stock bajo, el saldo teórico de la hucha y las personas con saldo por debajo del límite de deuda. | PREG-020 | Confirmado | CA-021 |
| RF-022 | La aplicación deberá mostrar para cada tipo los días estimados restantes según RN-073, o «sin datos» si no hay consumos en los últimos 30 días. | PREG-036 | Confirmado | CA-022 |
| RF-023 | Cuando un tipo entra en stock bajo, el sistema deberá generar el aviso según RN-072. | PREG-020 | Confirmado | CA-023 |

### 7.4 Aportaciones

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-030 | Un miembro deberá poder registrar una aportación propia con un importe mayor que 0. Un administrador también deberá poder registrarla en nombre de otra persona activa (RF-200, RN-087). | PREG-006, CAMBIO-019 | Confirmado | CA-030, CA-200 |
| RF-031 | Cuando se registra una aportación, el sistema deberá generar un abono al autor y aumentar el saldo teórico de la hucha. | RN-008 | Confirmado | CA-030 |
| RF-032 | El sistema deberá rechazar importes ≤ 0 o superiores a 500 €. | PREG-041 (PEND-026) | Confirmado | CA-031 |

### 7.5 Compras

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-040 | Un miembro deberá poder registrar una compra con una o varias líneas (RN-037). Cada línea indica tipo, cantidad (> 0) e importe (> 0). Con una sola línea, el formulario pide el importe una vez. Con varias, muestra el total calculado para compararlo con el ticket. | PREG-008, PREG-038 | Confirmado | CA-040 |
| RF-041 | Cuando se registra una compra, el sistema deberá aumentar el stock de cada tipo, recalcular su coste medio según RN-003/RN-004 y reducir el saldo teórico de la hucha. | RN-003, RN-009 | Confirmado | CA-041 |
| RF-042 | La compra deberá registrar quién la hizo y permitir adjuntar una foto opcional del ticket, con las validaciones de RF-005. | PREG-007, PREG-036 | Confirmado | CA-042 |
| RF-043 | Si el importe deja el saldo teórico de la hucha negativo, el cliente deberá mostrar el saldo teórico y pedir confirmación antes de registrar, según RF-198. | PREG-035, CAMBIO-019 | Confirmado | CA-043, CA-198 |
| RF-044 | Cuando se confirma una compra que deja el saldo teórico negativo, el sistema deberá notificar a los administradores. | PREG-035 | Confirmado | CA-043 |
| RF-045 | Cuando se anula una compra, el sistema deberá aplicar RN-012 y mostrar al autor de la anulación el resumen de regularizaciones generadas. | PREG-011 | Confirmado | CA-045 |
| RF-046 | Las compras y las aportaciones deberán ser idempotentes mediante identificador de cliente, como en RF-016. | PREG-041 | Confirmado | CA-016 |

### 7.6 Anulaciones

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-060 | Un miembro deberá poder anular sus propios registros dentro del plazo de autoanulación, indicando un motivo. | PREG-010 | Confirmado | CA-060 |
| RF-061 | Un administrador deberá poder anular cualquier consumo, aportación o compra, indicando un motivo. | PREG-010 | Confirmado | CA-061 |
| RF-062 | Si un miembro intenta anular un registro ajeno o fuera de plazo, el sistema deberá rechazarlo con un mensaje que indique que debe pedirlo a un administrador. | PREG-010 | Confirmado | CA-062 |
| RF-063 | Si se pulsa «Deshacer» sobre un consumo aún en la cola local, el cliente deberá eliminarlo de la cola sin enviarlo. | PREG-025 | Confirmado | CA-063 |
| RF-064 | Un administrador deberá poder anular, con motivo, el último arqueo y el último recuento de cada tipo según RN-036. Si el registro no es el último, el sistema deberá rechazar la anulación. | PREG-039 | Confirmado | CA-064 |

### 7.7 Arqueos y recuentos

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-080 | Un administrador deberá poder registrar un arqueo indicando el importe contado. El sistema guarda saldo teórico, contado y diferencia. | PREG-012 | Confirmado | CA-080 |
| RF-081 | Cuando un arqueo tiene diferencia ≠ 0, el sistema deberá aplicar RN-015 y RN-014. | PREG-012 | Confirmado | CA-081 |
| RF-082 | Antes de confirmar un arqueo o un recuento, el cliente deberá mostrar el importe por persona que generará el reparto. | PREG-041 | Confirmado | CA-081 |
| RF-090 | Un administrador deberá poder registrar un recuento de stock con la cantidad contada de uno o varios tipos. | PREG-018 | Confirmado | CA-090 |
| RF-091 | Cuando un recuento detecta un faltante, el sistema deberá aplicar RN-016 y RN-014. | PREG-018 | Confirmado | CA-091 |
| RF-092 | Cuando un recuento detecta un sobrante, el sistema deberá aumentar el stock sin movimientos económicos. | PREG-018 | Confirmado | CA-092 |
| RF-093 | El arqueo y el recuento deberán poder hacerse desde una pantalla común, como operaciones independientes. | PREG-018, PREG-041 | Confirmado | CA-093 |

### 7.8 Notificaciones

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-100 | El sistema deberá enviar notificaciones push a las suscripciones de los usuarios que las hayan aceptado y activado. | PREG-020 | Confirmado | CA-100 |
| RF-101 | El catálogo de notificaciones será: stock bajo (todos), deuda bajo límite (personal), resumen mensual (personal), stock negativo (administradores), hucha con saldo teórico negativo (administradores), fallo de copia de seguridad (administradores), café de visitante pendiente (administradores, RF-192) aportación registrada en tu nombre (personal, RF-200) y recuento registrado o anulado (todas las personas, RF-246). | PREG-021, PREG-029, PREG-030, CAMBIO-019, CAMBIO-024 | Confirmado | CA-101 |
| RF-102 | Cada usuario deberá poder activar o desactivar en su perfil cada tipo de notificación, salvo la de deuda. Todos los tipos están activados por defecto (RF-207). | PREG-021, PREG-036, CAMBIO-019 | Confirmado | CA-102, CA-207 |
| RF-103 | El sistema deberá registrar cada notificación enviada para aplicar RN-072 y RN-074 sin duplicados. | PREG-021 | Confirmado | CA-023 |
| RF-104 | El día 1 de cada mes, el sistema deberá enviar a cada miembro activo con la notificación activada su consumo del mes anterior, su saldo actual y el aguador del mes anterior (RF-176). | PREG-030, PREG-046 | Confirmado | CA-104 |
| RF-105 | Si el envío de una notificación falla, el sistema deberá reintentarlo y nunca deberá bloquear ni deshacer el registro que la originó. Si el servicio push indica que la suscripción ya no existe, el sistema la elimina. | PREG-020 | Confirmado | CA-105 |
| RF-106 | La aplicación deberá incluir una pantalla de ayuda para instalar la PWA y activar las notificaciones, que explique que en iPhone y iPad hay que añadirla a la pantalla de inicio. | PREG-020, FUENTE-01 | Confirmado | CA-106 |
| RF-107 | Todas las notificaciones deberán estar también disponibles en el panel de avisos de la aplicación. | PREG-020 | Confirmado | CA-021 |

### 7.9 Saldos, historial y estadísticas

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-110 | Todos los miembros deberán poder ver el saldo de cada miembro activo. | PREG-022 | Confirmado | CA-110 |
| RF-111 | Todos los miembros deberán poder ver el historial de aportaciones, compras, arqueos, recuentos y repartos. | PREG-006, PREG-022 | Confirmado | CA-110 |
| RF-112 | Cada miembro deberá poder ver el detalle de los movimientos de su saldo. | PREG-022 | Confirmado | CA-112 |
| RF-113 | Los historiales deberán aplicar RN-062. | PREG-036 | Confirmado | CA-113 |
| RF-120 | Todos los miembros deberán poder ver estadísticas globales de consumo por tipo y por mes, separando invitados. | PREG-022, PREG-023 | Confirmado | CA-120 |
| RF-121 | Cada miembro deberá poder ver las estadísticas de consumo de cada persona activa, también las suyas, por tipo y por periodo (RN-061). | PREG-022, CAMBIO-019 | Confirmado | CA-121 |
| RF-122 | Si alguien sin sesión de miembro (también un visitante) pide estadísticas, incluso por URL directa, el sistema deberá denegarlo. | RN-061, CAMBIO-019 | Confirmado | CA-122 |
| RF-123 | Un administrador deberá poder ver las estadísticas de cualquier persona, también de las dadas de baja. | RN-061, CAMBIO-019 | Confirmado | CA-121 |

### 7.10 Usuarios y acceso

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-130 | Un administrador deberá poder dar de alta un usuario con nombre, correo y rol. | PREG-014 | Confirmado | CA-130 |
| RF-131 | Un administrador deberá poder generar un enlace de invitación o de recuperación según RN-052, que la aplicación muestra para copiarlo. | PREG-015 | Confirmado | CA-131 |
| RF-132 | Mediante un enlace válido, el usuario deberá definir una contraseña que cumpla RN-053. | PREG-015, PREG-041, FUENTE-02 | Confirmado | CA-132 |
| RF-133 | El sistema deberá autenticar con correo y contraseña, aplicar RN-048 y mostrar el mismo mensaje de error si el correo no existe o la contraseña es incorrecta. | PREG-014 | Confirmado | CA-133 |
| RF-134 | Un administrador deberá poder cambiar el rol de un usuario, respetando RN-041. | PREG-016 | Confirmado | CA-134 |
| RF-135 | Un administrador deberá poder dar de baja a un usuario mediante un asistente que muestre su saldo y exija liquidarlo (pago, devolución o deuda incobrable) antes de confirmar. | PREG-013 | Confirmado | CA-135 |
| RF-136 | Un administrador deberá poder reactivar a un usuario dado de baja. | PREG-036 | Confirmado | CA-136 |
| RF-137 | Cada usuario deberá poder cerrar sesión en todos sus dispositivos y cambiar su contraseña desde su perfil. | PREG-031 | Confirmado | CA-137 |
| RF-138 | Si una acción de administrador llega sin autenticación en los últimos 15 minutos, el sistema deberá pedir la contraseña antes de ejecutarla. | PREG-031 | Confirmado | CA-138 |
| RF-139 | Al primer arranque, y solo si no existe ningún usuario, el sistema deberá crear el administrador indicado en la variable de entorno `ADMIN_INICIAL_EMAIL` y escribir en la salida estándar (log de Coolify) un enlace de invitación válido 24 horas. El fichero de log guarda el evento sin el enlace (DEC-081). Si no existe ningún usuario y falta la variable, la aplicación no arranca y registra el nombre de la variable (DEC-104). | PREG-032 | Confirmado | CA-139 |
| RF-139b | Un comando ejecutable en el contenedor deberá generar un enlace de recuperación para un administrador existente o crear uno nuevo. | PREG-036 (HALL-007) | Confirmado | CA-139 |
| RF-139c | El sistema deberá anotar en el registro de auditoría, con su autor y su fecha, cada alta, cambio de rol, baja, reactivación y enlace generado. La baja se anota con RF-135 (F4). | Glosario («Registro de auditoría»), anexo A, DEC-103 | Confirmado | CA-139c |

### 7.11 Copias de seguridad

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-140 | Cada día a las 03:00 (hora de Madrid), el sistema deberá generar una copia coherente de la base de datos con `VACUUM INTO`, empaquetarla con las fotos y subirla al bucket S3. | PREG-028, PREG-029, FUENTE-04 | Confirmado | CA-140 |
| RF-141 | El bucket deberá conservar las copias de los últimos 30 días mediante una regla de ciclo de vida. | PREG-029 | Confirmado | — (inspección) |
| RF-142 | Si una copia falla, el sistema deberá registrar el error y notificar a los administradores. | PREG-029 | Confirmado | CA-142 |
| RF-143 | Un administrador deberá poder consultar las copias de seguridad en un único listado, descargarlas, restaurarlas y hacer una copia ahora (RF-253 a RF-256, RF-284 a RF-292). | PREG-036 (PEND-019), CAMBIO-026, CAMBIO-029, CAMBIO-030 | Confirmado | CA-143 |
| RF-144 | Retirado por CAMBIO-030: ya no se registran pruebas de restauración ni hay aviso de 100 días. El ID no se reutiliza. | PREG-041, CAMBIO-030 | Retirado | — |

### 7.12 Configuración

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-150 | Un administrador deberá poder modificar: plazo de autoanulación, límite de deuda e intervalo mínimo entre rellenos de agua. La frecuencia del recordatorio de deuda no se configura: se deriva del límite (RN-074) y la pantalla la muestra como información. Cada cambio queda registrado con autor y fecha. | PREG-010, PREG-021, PREG-042, PREG-046 | Confirmado | CA-150, CA-074 |

### 7.13 Privacidad

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-160 | Cuando un usuario entra por primera vez, o cuando la versión vigente del texto de privacidad no coincide con la última que leyó, la aplicación deberá mostrarle el texto (anexo A) y registrar la fecha y la versión leídas antes de permitirle continuar. | PREG-040 | Confirmado; contenido del texto aplazado (PEND-014) | CA-160 |
| RF-161 | El perfil deberá incluir un enlace permanente al texto de privacidad vigente. | PREG-040 | Confirmado | CA-160 |

### 7.14 Relleno de agua

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-170 | La pantalla principal deberá mostrar, encima de los tipos de cápsula, la acción «He rellenado el agua» con el autor y la antigüedad del último relleno vigente (p. ej., «Último: Jorge, hace 3 h»), o «Sin rellenos registrados». | PREG-046 | Confirmado | CA-170 |
| RF-171 | Cuando un miembro pulsa «He rellenado el agua», el sistema deberá registrar un relleno a su nombre sin pasos adicionales, y el cliente deberá mostrar durante 5 segundos una confirmación con «Deshacer», anunciada al lector de pantalla. | PREG-046 | Confirmado | CA-171 |
| RF-172 | Si se intenta registrar un relleno dentro del intervalo mínimo (RN-082), el sistema deberá rechazarlo y el cliente deberá indicar quién registró el último y hace cuánto (p. ej., «Ana la rellenó hace 20 min»). | PREG-045 | Confirmado | CA-172 |
| RF-173 | Sin conexión, el cliente deberá mostrar la acción desactivada con una explicación (RN-081). | PREG-046 | Confirmado | CA-173 |
| RF-174 | El autor y los administradores deberán poder anular un relleno según RN-083. | PREG-047 | Confirmado | CA-174 |
| RF-175 | Las estadísticas deberán mostrar a todos los miembros el ranking de rellenos vigentes por persona en el periodo elegido. Las estadísticas personales deberán incluir el número de rellenos propios. | PREG-045, PREG-047 | Confirmado | CA-175 |
| RF-176 | El día 1 de cada mes, el sistema deberá determinar el aguador del mes anterior según RN-084. La pantalla principal deberá mostrarlo durante todo el mes en curso y el resumen mensual deberá incluirlo (RF-104). | PREG-046 | Confirmado | CA-176 |

### 7.15 Experiencia transversal

Reglas transversales de interfaz: constitución, principios X, XI y XVIII. Identidad, tokens y componentes: sistema de diseño Latte (`design-system/`).

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-180 | El cliente deberá ofrecer en Perfil el tema Automático, Claro u Oscuro, con Automático como valor inicial. Automático deberá seguir la apariencia del dispositivo y actualizarse si cambia durante la sesión. La preferencia se guarda en el dispositivo y cambiarla no pierde datos escritos ni foco. | Sistema de diseño Latte, DEC-099 | Confirmado | CA-180 |
| RF-181 | El cliente deberá ofrecer en Perfil el ajuste «Reducir transparencia», desactivado por defecto, que muestra todas las superficies opacas con las mismas acciones e información. Si el dispositivo pide reducir la transparencia, las superficies son opacas aunque el ajuste esté desactivado. La preferencia se guarda en el dispositivo. | DEC-095 | Confirmado | CA-181 |
| RF-182 | Toda pantalla del grupo `(app)`, salvo `/aceptar-privacidad`, deberá mostrar la navegación principal (Inicio, Saldos, Compras, Estadísticas y Perfil) y la campana de avisos (RF-107). Por debajo de 768 px, como barra inferior; de 768 a 1023 px, como carril de iconos con etiqueta; desde 1024 px, como barra lateral que añade el grupo «Administración» para administradores. La navegación son enlaces y funciona sin JavaScript. En Perfil estarán el botón para cerrar la sesión actual y, para administradores, el acceso a Administración. | Sistema de diseño Latte, HALL-017, DEC-108 | Confirmado | CA-182 |
| RF-183 | Desde 1024 px de ancho, Inicio, Saldos, Historial, Compras y Estadísticas deberán repartir su contenido en dos columnas: el contenido principal a la izquierda, y el resumen y lo secundario a la derecha. El orden de lectura y de tabulación será el mismo que en móvil. Perfil, Ayuda y Privacidad mantienen una columna de lectura, y Administración su ancho de tablas. | DEC-108 | Confirmado | CA-183 |
| RF-184 | Por debajo de 1024 px, Inicio deberá mostrar la lista de cápsulas justo después del resumen de hucha y saldo (`AlertsPanel`), antes de la tarjeta del agua y de «Tus últimos consumos», de forma que en una pantalla de 390 × 844 px se vea la primera fila de cápsulas sin desplazarse. | DEC-111, DEC-072 (rapidez del registro), constitución X | Confirmado | CA-184 |
| RF-185 | Cada tipo de cápsula deberá mostrarse con su foto (RF-005) o, si no la tiene o no se puede cargar, con una ilustración vectorial de cápsula de su color (RF-001). Ningún tipo se muestra sin imagen. En Inicio, cada tipo es una tarjeta (`CapsuleTile`) con su imagen, su nombre, sus unidades y días estimados con icono, su precio y el botón «+1»; tocar la tarjeta registra el consumo (RF-011) y el botón de persona lo registra para un invitado (RF-014). | DEC-109 | Confirmado | CA-185 |
| RF-186 | La aplicación deberá mostrar a Capsulito mediante su motor Rive (`.riv`, con control de gesto y 8 formas de boca sincronizables con voz MP3) y alternativa estática SVG en: la historia de bienvenida (RF-188); los estados vacíos y las páginas de error y sin conexión; las reacciones a eventos confirmados, pendientes, anulados o rechazados de consumo, relleno de agua, aportación, compra, deuda saldada, stock bajo y stock negativo; los avisos contextuales de Inicio y Saldos; el saludo de escritorio en Inicio; y el laboratorio de demostración en `/ayuda/capsulito`. En operaciones repetidas varía las frases o limita la repetición sin ocultar ni retrasar el mensaje funcional ni el botón «Deshacer». No aparece con bromas en deudas personales, textos legales, diálogos de confirmación económica, seguridad o tablas de administración. Habrá como mucho una mascota en la página más el aviso flotante. | DEC-105, DEC-106, DEC-107, DEC-115 | Confirmado | CA-186 |
| RF-187 | Ajustes (RF-220) deberá ofrecer el ajuste «Mostrar a Capsulito» (activado por defecto) y el ajuste para activar o silenciar la voz de Capsulito, ambos guardados en el dispositivo. Con la mascota desactivada, no aparece y, donde sustituía a un icono, se muestra ese icono. Si el dispositivo pide reducir el movimiento (`prefers-reduced-motion`), la mascota se muestra en pose estática sin parpadeo ni boca animada. Sin preferencia guardada, la voz está activa (RF-196). Las frases de café apuntado y de café de invitado son las de RF-213. | DEC-110, DEC-115, CAMBIO-019, CAMBIO-022 | Confirmado | CA-187, CA-196, CA-213 |
| RF-188 | La primera vez que una persona entra en la aplicación desde un dispositivo, después de aceptar la privacidad, la aplicación deberá ofrecerle una invitación opcional a recorrer la historia animada de bienvenida de nueve escenas (presentación, alerta de caja vacía, registro de un toque, stock y compras, el dinero (RF-247), hucha común, relleno de agua, aguador del mes y cierre), que se puede saltar, avanzar, retroceder o cerrar sin esperas obligatorias. El contenido estará siempre en `/ayuda` (también sin JavaScript), junto con el enlace al laboratorio interactivo `/ayuda/capsulito`, y desde Perfil y Ayuda se podrá volver a abrir la bienvenida. | DEC-112, CAMBIO-024 | Confirmado | CA-188 |

---

### 7.16 Visitantes, compras rápidas, estadísticas del departamento y ayuda (F10)

Especificación: `specs/010-visitantes-compras-ayuda/spec.md` (aprobada el 24-10-2026).

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-189 | Cualquier miembro activo deberá poder generar un enlace de visitante con su código QR. El enlace caduca 24 horas después de crearse. Quien lo creó y los administradores deberán poder revocarlo antes. | CAMBIO-019 | Confirmado | CA-189 |
| RF-190 | Una persona sin sesión que abre un enlace vigente deberá poder entrar como visitante tras escribir un nombre de 1 a 60 caracteres, sin cuenta ni contraseña. La sesión de visitante termina cuando caduca o se revoca el enlace. | CAMBIO-019, CAMBIO-021 | Confirmado | CA-190 |
| RF-191 | El visitante deberá poder registrar un café con un solo toque sobre un tipo activo con coste medio. El café queda pendiente, no cambia el stock, el coste medio ni ningún saldo, y es idempotente por identificador de cliente (RF-016). La confirmación dice «Pendiente de aprobación». | CAMBIO-019 | Confirmado | CA-191 |
| RF-192 | Cada café de visitante pendiente deberá notificarse a los administradores con el tipo de aviso «Café de visitante pendiente» y mostrarse en una lista de pendientes con el nombre del visitante, el tipo, la hora y quién generó el enlace. | CAMBIO-019 | Confirmado | CA-192 |
| RF-193 | Un administrador deberá poder aprobar o rechazar cada café de visitante pendiente, o varios a la vez. Aprobar aplica RN-086. Rechazar lo deja rechazado sin efectos. Un café aprobado se puede anular después: el stock vuelve a subir en 1. | CAMBIO-019 | Confirmado | CA-193 |
| RF-194 | Un visitante no deberá poder ver ni pedir saldos, nombres de miembros, historial, estadísticas ni ninguna pantalla autenticada, ni siquiera por URL directa. | CAMBIO-019 | Confirmado | CA-194 |
| RF-195 | Si el dispositivo no tiene la marca de bienvenida vista, la pantalla de entrada y el enlace de visitante deberán mostrar antes la portada del corto (RF-249) y, después de ella, la historia de bienvenida (RF-188). La historia empieza con el botón «Empezar» y termina con «Entrar» o, si se llegó con un enlace de visitante, con «Soy visitante». | CAMBIO-019, CAMBIO-025 | Confirmado | CA-195 |
| RF-196 | La voz de Capsulito deberá estar activa por defecto en un dispositivo sin preferencia guardada (modifica RF-187). | CAMBIO-019 | Confirmado | CA-196 |
| RF-197 | El formulario de compra deberá mostrar todos los tipos activos, cada uno con un contador de 0 a 999 que se cambia con «−» y «+» o escribiendo la cifra. Cada tipo con cantidad mayor que 0 pide su importe. El formulario muestra el número de líneas y el total. El envío crea una sola compra con una línea por tipo con cantidad mayor que 0 (RF-040). Funciona sin JavaScript. | CAMBIO-019 | Confirmado | CA-197 |
| RF-198 | Si la compra deja el saldo teórico de la hucha en negativo, al pulsar «Registrar compra» el cliente deberá mostrar el saldo actual, el importe de la compra, el saldo resultante y el aviso a los administradores, y pedir confirmación con «Cancelar» y «Registrar igualmente», sin casilla. Sin JavaScript, la confirmación es un paso intermedio. Si el saldo cambió desde que se mostró, el servidor la vuelve a pedir. | CAMBIO-019 | Confirmado | CA-198 |
| RF-199 | Saldos deberá mostrar, para cada persona activa, su saldo y el total de sus aportaciones vigentes, con acceso a su detalle (fecha, importe y quién la registró). | CAMBIO-019 | Confirmado | CA-199 |
| RF-200 | Un administrador deberá poder registrar una aportación en nombre de otra persona activa (RN-087). Un miembro que no es administrador solo puede registrar aportaciones propias. La persona beneficiaria recibe un aviso en el panel de avisos. | CAMBIO-019 | Confirmado | CA-200 |
| RF-201 | Todos los miembros deberán poder ver las estadísticas de consumo de todas las personas activas, sin elegir a una persona (RN-061). | CAMBIO-019 | Confirmado | CA-201 |
| RF-202 | Estadísticas deberá mostrar, para el periodo elegido (mes actual, últimos 3 meses o últimos 12 meses): cifras clave (cafés, cafés de invitados, cafés de visitantes y coste), cafés por persona ordenados, consumo por tipo, evolución mensual de 12 meses con propios, invitados y visitantes separados, y evolución del saldo teórico de la hucha. Cada gráfico tiene su alternativa en texto o en tabla. El periodo por defecto es el mes actual. | CAMBIO-019 | Confirmado | CA-202 |
| RF-203 | Cada pantalla autenticada deberá tener un botón «Ayuda» que abre un panel donde Capsulito explica el propósito de la pantalla, sus acciones y sus campos, con textos de un catálogo por pantalla y con voz opcional. Sin JavaScript, el botón lleva a la sección de esa pantalla en `/ayuda`. | CAMBIO-019 | Confirmado | CA-203 |
| RF-204 | La primera vez que una persona entra en Inicio tras la bienvenida, Capsulito deberá mostrar un tour de 4 pasos (registrar un café, café para un invitado, «Deshacer» y navegación) que se puede saltar y repetir desde la ayuda de Inicio. Terminarlo o saltarlo se guarda en la cuenta. Capsulito narra cada paso (RF-227) y «Repetir el tour» funciona desde cualquier pantalla (RF-228). | CAMBIO-019, CAMBIO-022 | Confirmado | CA-204, CA-227, CA-228 |
| RF-205 | Los campos técnicos de los formularios (umbral mínimo, arqueo, recuento, plazo de autoanulación, límite de deuda e intervalo de rellenos) deberán mostrar una línea de ayuda fija bajo el campo. | CAMBIO-019 | Confirmado | CA-205 |
| RF-206 | Inicio deberá mostrar una tarjeta para instalar la aplicación cuando el navegador lo permite y no está instalada: en Android y en Chrome con el diálogo del sistema; en Safari de iPhone y iPad con las instrucciones de RF-106. Descartar la tarjeta se guarda en la cuenta. Ajustes ofrece siempre la opción, con el diagnóstico y las instrucciones a mano (RF-276, RF-277). | CAMBIO-019, CAMBIO-028 | Confirmado | CA-206 |
| RF-207 | Todos los tipos de aviso deberán estar activados por defecto en las cuentas nuevas y en las existentes que nunca los han cambiado. Tras la bienvenida, Capsulito deberá ofrecer una vez activar los avisos, lo que pide el permiso del navegador. | CAMBIO-019 | Confirmado | CA-207 |
| RF-208 | Cada persona deberá poder subir, cambiar o quitar su foto en Perfil. Un administrador deberá poder hacerlo para cualquier persona en Usuarios, también al darla de alta (RF-223). Al elegir la foto se puede encuadrar (RF-273). Se aplican las validaciones de RF-005 y queda en la auditoría. | CAMBIO-019, CAMBIO-022, CAMBIO-027 | Confirmado | CA-208, CA-223 |
| RF-209 | Una persona sin foto deberá mostrarse con un avatar ilustrado según RF-222, sobre un color cálido de los tokens del tema asignado de forma estable a esa persona. El nombre accesible es el nombre de la persona. | CAMBIO-019, CAMBIO-022 | Confirmado | CA-209, CA-222 |
| RF-210 | El nombre del visitante deberá conservarse mientras exista el café, salvo que un administrador lo elimine. Eliminarlo lo sustituye por «Visitante» de forma irreversible, conserva el resto del café y se registra en la auditoría sin copiar el nombre. | CAMBIO-019 | Confirmado | CA-210 |

### 7.17 Inicio centrado en el café, Capsulito gamberro y pulido de la interfaz (F11)

Especificación: `specs/011-inicio-cafe-capsulito/spec.md` (aprobada el 25-10-2026). Anexo de frases: `specs/011-inicio-cafe-capsulito/frases.md`. Todo movimiento de esta sección se desactiva con `prefers-reduced-motion: reduce` (constitución XI y XVIII).

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-211 | Una línea de compra con cantidad mayor que 0 y sin importe, o con importe 0, deberá rechazarse con un error en el campo de importe de esa línea. La comprobación se hace antes de evaluar la hucha negativa: con una línea así no se abre el diálogo de RF-198. | CAMBIO-022 | Confirmado | CA-211 |
| RF-212 | Ningún error de envío deberá quedar tapado por un diálogo. Si el envío desde un diálogo falla, el diálogo se cierra y el foco va al resumen de errores, o el error se muestra dentro del diálogo. | CAMBIO-022 | Confirmado | CA-212 |
| RF-213 | Cuando el servidor confirma un café propio o de invitado, Capsulito deberá mostrar y, con la voz activa, decir una frase de registro del anexo `specs/011-inicio-cafe-capsulito/frases.md`, elegida según RN-088. Un café pendiente de enviar no muestra frase. Con la mascota desactivada no hay frase ni se avanza el ciclo. | CAMBIO-022 | Confirmado | CA-213 |
| RF-214 | Al abrir Inicio, si la persona no ha recibido ningún saludo o el último se mostró hace 2 horas o más (RN-089), Capsulito deberá mostrar y, con la voz activa, decir un saludo del mismo anexo, elegido según RN-088. El saludo tiene prioridad sobre el aviso de stock bajo, que se muestra después. Pasado el saludo, el bocadillo muestra el mensaje del día (RF-266). | CAMBIO-022, CAMBIO-027 | Confirmado | CA-214 |
| RF-215 | El servidor deberá elegir cada frase de registro y cada saludo, y guardar el ciclo de cada lista en la cuenta de la persona (RN-088). | CAMBIO-022 | Confirmado | CA-215 |
| RF-216 | Inicio deberá mostrar, en este orden: Capsulito con su mensaje; las cápsulas; la hucha, el saldo propio, el agua y los últimos consumos. A 1024 px o más, las cápsulas ocupan la columna principal y el resto, una columna lateral estrecha (sustituye a DEC-111). | CAMBIO-022 | Confirmado | CA-216 |
| RF-217 | Inicio deberá mostrar todos los tipos activos con coste medio, también los de stock ≤ 0. Un tipo con stock ≤ 0 se muestra atenuado con icono y el texto «Sin stock». Al tocarlo, el sistema deberá preguntar «El sistema dice que no quedan. ¿Has cogido una igualmente?» con «Sí, registrar» y «Cancelar». Al confirmar, se aplica RF-017. Sin JavaScript, la pregunta es una página intermedia. Los tipos sin coste medio siguen sin mostrarse (RN-006). | CAMBIO-022 | Confirmado | CA-217 |
| RF-218 | Un tipo con stock mayor que 0 y menor o igual que su umbral deberá llevar una marca con icono y el texto «Quedan pocas». | CAMBIO-022 | Confirmado | CA-218 |
| RF-219 | Al registrar el relleno del agua, Capsulito deberá mostrar en pantalla el mismo mensaje que dice con la voz, anunciado al lector de pantalla. | CAMBIO-022 | Confirmado | CA-219 |
| RF-220 | Toda persona con sesión deberá tener una sección «Ajustes» con: tema, «Reducir transparencia», «Mostrar a Capsulito», la voz, las notificaciones y la instalación de la app. Cada ajuste se guarda donde se guardaba (dispositivo o cuenta). «Configuración» sigue siendo solo para administradores. | CAMBIO-022 | Confirmado | CA-220 |
| RF-221 | Perfil deberá contener los datos de la persona, su foto, el cambio de contraseña y las sesiones, en dos columnas a 1024 px o más. | CAMBIO-022 | Confirmado | CA-221 |
| RF-222 | Una persona sin foto deberá mostrarse con una ilustración de un catálogo (taza, cápsula, grano y otras), elegida de forma estable a partir de su identificador, sobre su color cálido estable de los tokens, con contraste de 3:1 como mínimo en claro y oscuro. | CAMBIO-022 | Confirmado | CA-222 |
| RF-223 | El alta de usuario deberá permitir adjuntar una foto opcional con las validaciones de RF-005. Una foto no válida rechaza el alta con un error de campo. | CAMBIO-022 | Confirmado | CA-223 |
| RF-224 | El texto de privacidad (anexo A, versión 5) deberá nombrar como responsable a «Mardomingo Software» y como gestor a «Daniel Diez Mardomingo», con la indicación «contacta con él en persona o por el canal interno del departamento», sin correo ni teléfono, y deberá incluir entre los datos guardados las frases de Capsulito ya dichas, la hora del último saludo y los mensajes del día ya mostrados (RN-088, RN-089, RN-091), y el estado de instalación de la aplicación y quién lo ve (RF-278, RF-281). Es una versión nueva del texto (RF-160). | CAMBIO-022, CAMBIO-027, CAMBIO-028 | Confirmado | CA-224, CA-282 |
| RF-225 | La pantalla de entrada deberá mostrar a Capsulito animado, que mira hacia el texto del correo mientras se escribe, se tapa los ojos con el foco en la contraseña, pone cara triste tras una entrada fallida y celebra tras una correcta. Tiene respaldo SVG estático inmediato y queda estático con `prefers-reduced-motion: reduce` o sin JavaScript. | CAMBIO-022 | Confirmado | CA-225 |
| RF-226 | Las respuestas de error 400, 403, 404 y 500 deberán mostrar una página con Capsulito, una pose y un texto propios de cada tipo, qué ha pasado, qué puede hacer la persona y un enlace a Inicio. La 500 muestra el identificador de operación como código de incidencia. Otros 4xx usan la página 400 y otros 5xx, la 500. | CAMBIO-022 | Confirmado | CA-226 |
| RF-227 | En el tour de Inicio y en el panel de ayuda, Capsulito deberá aparecer junto al texto de cada paso, con la pose del catálogo para ese paso, y decirlo con la voz activa. En el tour habla el Capsulito de la tarjeta del paso; el de Inicio queda quieto y callado mientras dura el tour (RF-240). | CAMBIO-022, CAMBIO-024 | Confirmado | CA-227 |
| RF-228 | «Repetir el tour» deberá empezar el tour de Inicio desde el primer paso desde cualquier pantalla, también estando ya en Inicio y sin JavaScript. | CAMBIO-022 | Confirmado | CA-228 |
| RF-229 | La navegación deberá mostrar cada destino una sola vez para cada rol. | CAMBIO-022 | Confirmado | CA-229 |
| RF-230 | A 1024 px o más, la ficha de cápsula deberá repartir sus campos en dos columnas, y el detalle de compra deberá acotar el ancho del motivo de anulación y de su botón y repartir las líneas y el resumen en columnas. | CAMBIO-022 | Confirmado | CA-230 |
| RF-231 | Saldos deberá alinear las filas de sus columnas y mostrar la columna derecha sobre un panel con borde y fondo de una superficie más clara de los tokens. | CAMBIO-022 | Confirmado | CA-231 |
| RF-232 | En Estadísticas, cada «Ver datos» deberá estar abierto por defecto. | CAMBIO-022 | Confirmado | CA-232 |
| RF-233 | Los campos deberán mostrar un haz al recibir el foco, una sacudida única al mostrarse su error y una entrada suave del mensaje de error. | CAMBIO-022 | Confirmado | CA-233 |
| RF-234 | Casillas, botones de opción e interruptores deberán responder con un movimiento breve al cambiar. El selector de tema y los grupos de pestañas deberán tener un indicador que se desliza hasta la opción elegida. | CAMBIO-022 | Confirmado | CA-234 |
| RF-235 | Con un puntero fino, las tarjetas deberán mostrar un brillo de borde alrededor del puntero. Las tarjetas sobre cristal no lo duplican. | CAMBIO-022 | Confirmado | CA-235 |
| RF-236 | Un botón de guardar deberá mostrar un check breve solo cuando el servidor confirma el guardado. Las cifras de saldo y de hucha deberán pasar del valor anterior al nuevo en 300 ms o menos, y el lector de pantalla recibe solo el valor final. | CAMBIO-022 | Confirmado | CA-236 |
| RF-237 | El catálogo de locuciones deberá incluir las 160 frases, con el texto visible literal del anexo y el texto de voz con etiquetas de expresión de ElevenLabs v3. La persona usuaria genera los audios con `./voces.sh` o `./voces.ps1`. | CAMBIO-022 | Confirmado | CA-237 |

### 7.18 Pulido de Capsulito, celebración del café y gestión de personas y stock (F12)

Especificación: `specs/012-pulido-capsulito-celebracion/spec.md` (aprobada el 26-10-2026).

| ID | Enunciado | Origen | Estado | CA |
| --- | --- | --- | --- | --- |
| RF-238 | «Copiar enlace» deberá copiar el enlace también cuando la aplicación se abre sin conexión segura (http). Si el navegador no permite copiar de ninguna forma, el enlace queda seleccionado y se muestra «No se pudo copiar solo. Selecciona el texto y cópialo». | CAMBIO-024 | Confirmado | CA-238 |
| RF-239 | El enlace que devuelve el alta, «Generar enlace» o «Reactivar» deberá mostrarse justo debajo del botón que lo generó, con la vista desplazada hasta él y un anuncio al lector de pantalla. | CAMBIO-024 | Confirmado | CA-239 |
| RF-240 | En el tour de Inicio deberá hablar (mover la boca con la voz) el Capsulito de la tarjeta del paso. El Capsulito de Inicio queda quieto y callado mientras dura el tour. Precisa RF-227. | CAMBIO-024 | Confirmado | CA-240 |
| RF-241 | La pantalla de un enlace de invitación o de recuperación deberá mostrar a Capsulito con el comportamiento de RF-225 en sus campos de contraseña. | CAMBIO-024 | Confirmado | CA-241 |
| RF-242 | El listado de personas de administración deberá mostrar la foto de cada persona a la izquierda de su nombre, o su avatar ilustrado (RF-222) si no tiene foto. | CAMBIO-024 | Confirmado | CA-242 |
| RF-243 | Cuando el servidor confirma un café propio, un café de invitado o el relleno del agua, la aplicación deberá mostrar sobre la tarjeta o el botón pulsado un confeti de 1 s como máximo y reproducir un sonido corto de celebración (en el relleno del agua, su propio sonido de agua, RF-260), sin ventana, sin bloquear ningún control y sin retrasar el mensaje de confirmación ni «Deshacer». La frase de Capsulito empieza al terminar el sonido; una confirmación nueva corta la frase en curso. | CAMBIO-024, CAMBIO-026 | Confirmado | CA-243 |
| RF-244 | El sonido de celebración deberá sonar solo con la voz de Capsulito activa (RF-187). Con «Reducir movimiento» no hay confeti. Un registro pendiente de enviar no tiene celebración ni sonido. | CAMBIO-024 | Confirmado | CA-244 |
| RF-245 | Inicio deberá ordenar las cápsulas según RN-090, con las marcas de RF-217 y RF-218 en el puesto que les corresponda. El orden se calcula al entrar en la pantalla y se conserva durante la visita (RF-258). | CAMBIO-024, CAMBIO-026 | Confirmado | CA-245 |
| RF-246 | Cuando un administrador registra o anula un recuento con diferencias, el sistema deberá avisar a todas las personas activas con un resumen: fecha, tipos y cápsulas que faltaban o sobraban, importe repartido, número de personas y cantidad por persona. El aviso entra en el catálogo de RF-101, en el panel de avisos (RF-107) y se muestra una vez en Inicio a cada persona. Un recuento sin diferencias no avisa. | CAMBIO-024 | Confirmado | CA-246 |
| RF-247 | La historia de bienvenida (RF-188) deberá incluir, después de «stock y compras» y antes de «hucha común», la escena «el dinero» con el texto «La hucha común paga las cápsulas. Tú pones dinero con una aportación y cada café descuenta de tu saldo lo que cuesta. De vez en cuando, los administradores cuentan la caja para que todo cuadre.» y su locución en tono alegre. | CAMBIO-024 | Confirmado | CA-247 |
| RF-248 | Donde Capsulito se muestra a 112 px o más y está en reposo (sin hablar ni hacer una pose), deberá parpadear cada 3 s y hacer los gestos de reposo en un orden fijo de impaciencia creciente, contado desde que entra en reposo, con los cinco gestos y los instantes de RF-259; después el ciclo vuelve a empezar. Hablar o hacer una pose interrumpe el gesto y reinicia el ciclo. Con movimiento reducido, Capsulito queda quieto. | CAMBIO-024, CAMBIO-026 | Confirmado | CA-248 |
| RF-249 | Si el dispositivo no tiene la marca de bienvenida vista, la pantalla de entrada, el enlace de visitante y los enlaces de alta o recuperación (`acceso/[token]`) deberán mostrar antes una portada con el corto «El misterio de la última cápsula»: el botón «Ver el corto» como acción principal y «Saltar» como acción secundaria. Al terminar el corto o saltarlo, sigue la historia de bienvenida (RF-195) o, en los enlaces de alta y recuperación, su formulario. Con la marca puesta no se muestra. Sin conexión no se ofrece. Quien tiene la sesión abierta no lo ve. | CAMBIO-025 | Confirmado | CA-249 |
| RF-250 | Ajustes y Ayuda deberán ofrecer «Ver el corto otra vez», junto a «Ver la bienvenida otra vez»; abre el corto en un diálogo con las mismas opciones. | CAMBIO-025 | Confirmado | CA-250 |
| RF-251 | El corto solo se reproduce cuando la persona pulsa «Ver el corto», con sonido y con los subtítulos grabados en el vídeo (RF-265). Ofrece pausa, saltar y un enlace a su transcripción, que se abre en una hoja sobre el vídeo (RF-264). Se descarga solo al pulsar, no entra en la precarga de la aplicación y nunca bloquea entrar, usar la aplicación ni registrar un café. No guarda nada nuevo en el navegador: usa la marca de bienvenida vista (constitución V). | CAMBIO-025, CAMBIO-026 | Confirmado | CA-251 |
| RF-252 | «Saltar» deberá ser una acción visible y accesible aunque secundaria: texto pequeño sin relleno, contraste de al menos 4,5:1, objetivo de al menos 24 × 24 px y nombre accesible (constitución X y XI). | CAMBIO-025 | Confirmado | CA-252 |
| RF-253 | La pantalla «Copias de seguridad» deberá mostrar un único listado de copias, de la más reciente a la más antigua (como máximo 30, paginado de 8 en 8 con un `<form method="get">` que funciona sin JavaScript). Cada fila deberá mostrar su fecha y hora de Madrid, su tamaño, su etiqueta (Diaria, Manual, Resguardo o Fallida), su origen (RF-287, RF-289) y los botones «Descargar» y «Restaurar» juntos. Una copia fallida (solo registrada en local) deberá mostrarse en el mismo listado con la etiqueta «Fallida» y sin botones. Sin S3 configurado, deberá explicar que hace falta configurarlo y no ofrecer «Descargar» ni «Restaurar». El enlace de vuelta deberá decir «Volver a Administración». | CAMBIO-026, CAMBIO-029, CAMBIO-030 | Confirmado | CA-253 |
| RF-254 | Un administrador deberá poder restaurar cualquier copia de la lista. Antes de confirmar, la aplicación deberá mostrar el efecto: la fecha de la copia, que se sustituyen todos los datos, qué se pierde (lo registrado después de esa fecha), que las sesiones y contraseñas pasan a ser las de la copia y que antes se guardará una copia de resguardo. La confirmación muestra también el origen de la copia y el del sistema (RF-290) y exige la contraseña del administrador. Solo puede haber una restauración en curso. | CAMBIO-026, CAMBIO-029 | Confirmado | CA-254 |
| RF-255 | Antes de sustituir ningún dato, la aplicación deberá: (a) dejar de aceptar registros; (b) hacer una copia de resguardo del estado actual y subirla al bucket; (c) descargar la copia elegida y comprobar su integridad, su suma de verificación y que no tiene migraciones más nuevas que la aplicación. Si cualquier paso falla, no se sustituye nada, la aplicación vuelve a aceptar registros y el administrador ve el motivo. Cada paso emite su evento técnico (RF-291, RF-292). | CAMBIO-026, CAMBIO-029 | Confirmado | CA-255 |
| RF-256 | Tras sustituir los datos, la aplicación deberá reiniciarse. Al arrancar, deberá dejar constancia de la restauración en el registro de auditoría (fecha, administrador, copia restaurada y copia de resguardo) y la pantalla de copias deberá mostrar un aviso con esos datos. | CAMBIO-026 | Confirmado | CA-256 |
| RF-257 | Retirado por CAMBIO-030 (sección «Anotar una prueba de restauración»). El enlace «Volver a Administración» pasa a RF-253. | CAMBIO-026, CAMBIO-030 | Retirado | — |
| RF-258 | Inicio deberá conservar el orden de las cápsulas calculado al entrar en la pantalla mientras la persona siga en ella: registrar, deshacer o actualizar los datos no cambia el puesto de ninguna tarjeta, y un tipo que aparece durante la visita va al final. El orden se recalcula según RN-090 al volver a entrar o al recargar. | CAMBIO-026 | Confirmado | CA-258 |
| RF-259 | Los gestos de reposo (RF-248) deberán ser cinco, en orden fijo, contados desde que Capsulito entra en reposo: a los 4 s mira a los lados, a los 9,5 s golpea el suelo con el pie, a los 15 s bosteza tapándose la boca con la boca muy abierta, a los 20,5 s se da toquecitos en el reloj de la muñeca con la otra mano, con cara de prisa, y a los 26 s bosteza estirándose. A los 29 s el ciclo vuelve a empezar. | CAMBIO-026 | Confirmado | CA-259 |
| RF-260 | El relleno del agua deberá tener un sonido propio, relacionado con el agua, de 1,5 s y 30 KB como máximo, distinto del de los cafés. Sigue RF-244. | CAMBIO-026 | Confirmado | CA-260 |
| RF-261 | Con 1024 px o más de ancho, Usuarios, Arqueos y recuentos, Cápsulas, Compras y Avisos deberán mostrar dos columnas: acciones y formularios a la izquierda, listados e historial a la derecha sobre otro fondo y con borde. En Avisos, los pendientes a la izquierda y los vistos a la derecha. Con menos ancho, una columna con las acciones primero. | CAMBIO-026 | Confirmado | CA-261 |
| RF-262 | En Avisos, un aviso sin «Entendido» deberá distinguirse con fondo de acento suave, borde de color y la etiqueta «Nuevo»; los vistos, con fondo neutro. El color no es la única señal. | CAMBIO-026 | Confirmado | CA-262 |
| RF-263 | Al registrar una compra, cada cápsula deberá mostrar bajo su nombre su stock actual («Quedan N»). Con stock bajo (RF-218), «Quedan pocas» con icono, en color de aviso, junto a la cifra. | CAMBIO-026 | Confirmado | CA-263 |
| RF-264 | La portada y el vídeo del corto deberán ocupar toda la pantalla, con la portada difuminada a los lados si la proporción no es 9:16 y sin título ni descripción encima. «Ver el corto» es el botón principal sobre la portada; «Saltar» va en una esquina superior sobre una pastilla opaca y cumple RF-252; «Leer la transcripción» va abajo y abre la transcripción en una hoja que se puede cerrar. | CAMBIO-026 | Confirmado | CA-264 |
| RF-265 | El corto deberá mostrar solo los subtítulos grabados en el vídeo; la aplicación no añade otra pista de subtítulos. | CAMBIO-026 | Confirmado | CA-265 |
| RF-266 | El bocadillo de Capsulito en Inicio deberá mostrar el mensaje del día de la persona (RN-091) cuando no muestra un saludo (RF-214), la reacción a un evento ni un aviso (rechazo, pendientes, deuda, stock bajo o aguador del mes). Sustituye a los mensajes fijos de mañana y de tarde. Es solo texto y vale a cualquier hora. | CAMBIO-027 | Confirmado | CA-266 |
| RF-267 | El catálogo de mensajes del día deberá tener al menos 40 textos, campechanos y con humor, sin datos de la persona (saldo, consumos ni deudas). Un texto puede incluir el nombre de pila de la persona. | CAMBIO-027 | Confirmado | CA-267 |
| RF-268 | El servidor deberá asignar y guardar el mensaje del día de cada persona (RN-091), de forma que dos peticiones simultáneas del mismo día reciban el mismo mensaje. | CAMBIO-027 | Confirmado | CA-268 |
| RF-269 | El campo de color de un tipo de cápsula deberá ofrecer 7 colores fijos (los anteriores sin el rosa) y la opción «Otro color» con un selector de color libre. Un tipo que ya tiene el rosa lo conserva y lo muestra como su color actual, pero el rosa no se ofrece para elegirlo. | CAMBIO-027 | Confirmado | CA-269 |
| RF-270 | Con un color propio, la aplicación deberá elegir el color del texto y de los límites de la tarjeta y de la ilustración del tipo para cumplir un contraste de al menos 4,5:1 en el texto y 3:1 en los límites, en tema claro y oscuro, y deberá ajustar el tono en tema oscuro de forma estable (el mismo resultado para el mismo color). | CAMBIO-027 | Confirmado | CA-270 |
| RF-271 | El servidor deberá aceptar como color propio solo un color sRGB opaco en formato hexadecimal de 6 cifras y rechazar cualquier otro valor con un mensaje en el campo. | CAMBIO-027 | Confirmado | CA-271 |
| RF-272 | Un administrador deberá poder quitar la foto de un tipo de cápsula desde su edición. El tipo queda sin foto, se muestra con su ilustración (RF-185) y el archivo se borra. Funciona sin JavaScript y queda en la auditoría. | CAMBIO-027 | Confirmado | CA-272 |
| RF-273 | Al elegir una foto de persona (alta, cambio en Usuarios y Perfil) o de tipo de cápsula (alta y edición), la aplicación deberá permitir encuadrarla en un marco cuadrado moviéndola y ampliándola con el ratón, el dedo y el teclado. En las fotos de persona, una guía redonda muestra el avatar; en las de cápsula, no. | CAMBIO-027 | Confirmado | CA-273 |
| RF-274 | El servidor deberá recortar la foto con la zona elegida, después de aplicar su orientación, y aplicar RF-005. Sin zona elegida (por ejemplo, sin JavaScript), deberá guardar el cuadrado central. Una zona fuera de la foto o no válida se rechaza con un mensaje en el campo y no se guarda nada. | CAMBIO-027 | Confirmado | CA-274 |
| RF-275 | La pantalla «Copias de seguridad» deberá distinguir «Hacer copia ahora» con fondo de acento suave y el listado de copias sobre superficie elevada con borde, con un icono junto a cada título. Desde 1024 px deberá usar dos columnas: las acciones a la izquierda y el listado a la derecha. La advertencia de restaurar (fondo de advertencia suave) deberá estar en la pantalla de confirmación. | CAMBIO-027, CAMBIO-030 | Confirmado | CA-275 |
| RF-276 | El navegador deberá guardar en memoria el aviso de instalación desde que arranca el cliente, en cualquier pantalla, para que Inicio y Ajustes puedan ofrecerlo después sin recargar. Precisa RF-206. | CAMBIO-028 | Confirmado | CA-276 |
| RF-277 | Ajustes deberá mostrar, en «Instalar la aplicación», el diagnóstico de instalación y, si el navegador no ha ofrecido instalar, las instrucciones para instalar a mano desde el menú del navegador. El diagnóstico no se guarda en el navegador ni en el servidor. | CAMBIO-028 | Confirmado | CA-277 |
| RF-278 | El servidor deberá guardar por persona su estado de instalación (`instalada` o `rechazada`) y el instante del último cambio. Cada persona tiene como máximo un estado. | CAMBIO-028 | Confirmado | CA-278 |
| RF-279 | El navegador deberá enviar el estado al servidor mediante un formulario con *action*, enviado por código tras: aceptar el diálogo del sistema, el evento `appinstalled`, cancelar el diálogo, o cargar la aplicación en modo `standalone`. | CAMBIO-028 | Confirmado | CA-279 |
| RF-280 | El servidor deberá aplicar estas transiciones: de «sin datos» a cualquiera; de `rechazada` a `instalada`; `instalada` no pasa a `rechazada`; repetir el mismo estado no cambia el instante. | CAMBIO-028 | Confirmado | CA-280, EV-116 |
| RF-281 | La ficha de una persona en Usuarios deberá mostrar a los administradores su estado de instalación con la fecha («Aplicación instalada desde…», «Rechazó instalarla el…» o «Sin datos»). Ninguna otra pantalla lo muestra. | CAMBIO-028 | Confirmado | CA-281 |
| RF-282 | El texto de privacidad (anexo A, versión 5) deberá incluir entre los datos guardados el estado de instalación y quién puede verlo (los administradores). Es una versión nueva del texto (RF-160): todas las personas la vuelven a aceptar. | CAMBIO-028 | Confirmado | CA-282 |
| RF-283 | El servidor deberá registrar cada cambio de estado con el evento técnico `instalacion.registrada`, con el identificador de la persona y el estado, sin otros datos personales (constitución XVI). | CAMBIO-028 | Confirmado | CA-283 |
| RF-284 | La lista de copias del bucket deberá ofrecer a un administrador un enlace «Descargar» por cada copia. El servidor deberá comprobar sesión y permiso de administrador en el caso de uso, validar la clave con su esquema, bajarla del bucket y entregarla en flujo con su nombre original y `Cache-Control: no-store`. | CAMBIO-029 | Confirmado | CA-284 |
| RF-285 | Cada descarga de una copia deberá quedar en el registro de auditoría con la persona, la copia y el instante, y emitir un evento técnico sin datos personales. La copia contiene toda la base de datos: solo los administradores pueden descargarla. | CAMBIO-029 | Confirmado | CA-285 |
| RF-286 | La pantalla deberá ofrecer a un administrador «Hacer copia ahora», con confirmación previa que explique que se sube una copia completa al bucket. El servidor deberá hacer y subir una copia con el mismo contenido y proceso que la diaria (RF-140), registrarla como manual y no ejecutar dos copias manuales a la vez ni una manual con otra copia en curso. La copia diaria no depende de la manual. | CAMBIO-029 | Confirmado | CA-286 |
| RF-287 | La lista deberá marcar con la etiqueta «Manual» las copias hechas con RF-286, junto a la etiqueta de resguardo ya existente (RF-253). El registro de auditoría deberá guardar quién la lanzó. | CAMBIO-029 | Confirmado | CA-287 |
| RF-288 | Sin S3 configurado, la pantalla deberá explicar que hace falta configurarlo y no ofrecer «Descargar» ni «Hacer copia ahora» (precisa RF-253). | CAMBIO-029 | Confirmado | CA-288 |
| RF-289 | Cada copia nueva (diaria, manual o de resguardo) deberá guardar su origen, el dominio de `ORIGIN`, en la clave del objeto. La lista deberá mostrarlo («Local» para `localhost` y `127.0.0.1`) y, en las copias anteriores, mostrar «Origen no registrado». | CAMBIO-029 | Confirmado | CA-289 |
| RF-290 | La confirmación de restaurar (RF-254) deberá mostrar el origen de la copia y el del sistema actual. Si difieren, deberá destacarlo con texto y con icono, sin impedir la restauración. | CAMBIO-029 | Confirmado | CA-290 |
| RF-291 | Cada paso de una copia manual, una descarga y una restauración (RF-255, RF-256) deberá emitir un evento técnico con su código estable, duración y tamaño cuando proceda. Todos los eventos de una restauración deberán llevar el mismo identificador de restauración, también los posteriores al reinicio. Un fallo deberá emitir el paso y el código del fallo. | CAMBIO-029 | Confirmado | CA-291, EV-117 |
| RF-292 | La verificación de una copia (RF-255 c) deberá registrar el origen de la copia, el origen del sistema y las versiones de esquema comparadas, sin datos personales ni contenido de la copia. | CAMBIO-029 | Confirmado | CA-292, EV-117 |

## 8. Requisitos no funcionales

| ID | Requisito | Métrica y umbral | Verificación | Estado |
| --- | --- | --- | --- | --- |
| RNF-001 | Accesibilidad | WCAG 2.2 AA: contraste ≥ 4,5:1 (texto normal), objetivos táctiles ≥ 24×24 px CSS (44×44 px en botones de cápsula), mensajes de estado anunciados (4.1.3), el color no es la única señal (1.4.1). | Herramienta automática (axe) en cada pantalla + revisión manual con VoiceOver y TalkBack. | Confirmado |
| RNF-002 | Rapidez del registro | Con red, el consumo se confirma en pantalla en ≤ 1 s en el percentil 95, con 30 usuarios registrados. | Medición en entorno de producción durante 2 semanas. | Confirmado (PREG-041) |
| RNF-003 | Capacidad | Diseñado para 30 usuarios y 50 tipos de cápsula sin cambios de arquitectura. | Análisis y prueba de carga ligera. | Confirmado (PREG-041) |
| RNF-004 | Seguridad de contraseñas | Argon2id con m ≥ 19 MiB, t ≥ 2, p = 1. | Inspección de código y configuración. | Confirmado (PREG-041) |
| RNF-005 | Seguridad de sesión | Cookie `HttpOnly`, `Secure`, `SameSite=Lax`; identificador de sesión aleatorio guardado como hash. | Inspección y prueba. | Confirmado (PREG-031) |
| RNF-006 | Protección CSRF | Las acciones que modifican datos solo aceptan peticiones del mismo origen. | Prueba. | Confirmado (PREG-041) |
| RNF-007 | Autorización en servidor | Todos los permisos se comprueban en el servidor, nunca solo ocultando botones. | Pruebas de acceso directo por URL (EV-050). | Confirmado (PREG-041) |
| RNF-008 | Resiliencia de notificaciones | El fallo de una notificación nunca bloquea un registro. | Prueba con servicio push simulado caído. | Confirmado |
| RNF-009 | Copias de seguridad | RPO ≤ 24 h; retención 30 días. | Registro de copias. | Confirmado |
| RNF-010 | Integridad transaccional | Cada registro económico y sus efectos (movimientos, stock, coste medio) se guardan en una única transacción. | Pruebas de fallo a mitad de operación. | Confirmado (PREG-041) |
| RNF-011 | Disponibilidad | Sin objetivo formal. Se acepta indisponibilidad durante despliegues y caídas del servidor. Los consumos se conservan en la cola local. | — | Confirmado (PREG-041) |
| RNF-012 | Idioma | Toda la interfaz en español, con textos centralizados. | Inspección. | Confirmado |
| RNF-013 | Navegadores | Últimas dos versiones de Safari (iOS ≥ 16.4) y Chrome (Android). | Prueba manual en ambos. | Confirmado (PREG-041) |
| RNF-014 | Observabilidad | Logs estructurados de errores, de tareas programadas y de envíos fallidos, visibles en Coolify y guardados en ficheros diarios en el volumen durante 30 días (DEC-076, DEC-077). Los errores del móvil llegan al mismo log (DEC-079). Endpoint de salud para Coolify. | Inspección. | Confirmado (PREG-041) |
| RNF-015 | Adaptación y preferencias | Con `prefers-contrast: more` se refuerzan texto, límites y foco; con `forced-colors` siguen visibles controles, límites y foco; con el texto ampliado al 200 % y a 320 px de ancho no se pierde contenido ni función. | E2E con emulación (EV-061) y revisión manual. | Confirmado (DEC-095) |
| RNF-016 | Exclusión de buscadores | La aplicación no se publica en buscadores: `/robots.txt` responde `Disallow: /` y todas las respuestas llevan la cabecera `X-Robots-Tag: noindex, nofollow`. | Prueba de la suite `api`: `/robots.txt`, `/login` y una ruta con sesión. | Confirmado (DEC-102) |

---

## 9. Criterios de aceptación y escenarios futuros de verificación

Formato Given/When/Then. Los escenarios EV están **pendientes de creación en fase posterior**. El nivel de prueba previsto para cada grupo de CA y EV está en `docs/pruebas.md` §14; al traspasar, cada `spec.md` lo concreta en su matriz de trazabilidad.

### Catálogo
- **CA-001** — Dado un administrador autenticado, cuando da de alta «Ristretto» con todos los datos y una foto JPEG de 2 MB, entonces el tipo aparece en el catálogo como activo, sin coste medio y no visible en la pantalla principal (RN-006).
- **CA-002** — Dado un tipo activo «Ristretto», cuando un administrador da de alta «ristretto», entonces el sistema rechaza el alta con «Ya existe un tipo activo con ese nombre».
- **CA-003** — Dado un tipo con stock 20, cuando un administrador cambia su umbral de 5 a 25, entonces el stock sigue en 20 y el tipo pasa a stock bajo.
- **CA-004** — Dado un tipo retirado con consumos previos, entonces no aparece en la pantalla principal ni en el formulario de compra y sus consumos siguen en las estadísticas.
- **CA-006** — Dado un tipo sin registros, un administrador puede borrarlo. Dado un tipo con un consumo, la opción de borrar no aparece y el servidor rechaza la petición directa.
- **CA-005** — Dado un fichero `.jpg` cuyo contenido real es un ejecutable, cuando se sube como foto, entonces el sistema lo rechaza. Dada una foto válida con datos GPS, entonces la imagen guardada no contiene metadatos EXIF.

### Consumo
- **CA-010** — Dado un tipo activo con coste medio, entonces aparece en la pantalla principal con su nombre visible en texto, además de foto y color.
- **CA-011/CA-012** — Dado un tipo con stock 10 y coste medio 0,3483 €, cuando Ana lo toca, entonces se crea un consumo, el stock pasa a 9 y Ana recibe un cargo de 0,35 €.
- **CA-013** — Cuando Ana toca un tipo, entonces aparece durante 5 segundos un aviso con «Deshacer» que el lector de pantalla anuncia. Si lo pulsa, el consumo queda anulado y el stock vuelve a 10.
- **CA-014** — Cuando Ana registra un consumo marcado como invitado, entonces el cargo va a Ana y las estadísticas lo cuentan como invitado.
- **CA-015** — Dado el móvil sin conexión, cuando Ana toca un tipo, entonces el consumo aparece como «pendiente de enviar» y un aviso indica el riesgo de borrar datos. Al recuperar la conexión, el consumo se envía con la hora del toque y se le aplica el coste medio vigente en ese momento.
- **CA-016** — Dado un consumo ya recibido con identificador X, cuando el cliente reenvía X, entonces el sistema no crea otro consumo y responde con el original.
- **CA-017** — Dado un tipo con stock 0 y último coste conocido 0,40 €, cuando Luis lo toca, entonces se registra el consumo, el stock pasa a −1, Luis recibe un cargo de 0,40 € y un aviso del descuadre, y los administradores reciben «stock negativo».

### Stock bajo
- **CA-020** — Dado un umbral de 10 y stock 11, cuando se registra un consumo, entonces el tipo pasa a stock bajo.
- **CA-021** — Cuando cualquier miembro abre la aplicación, entonces ve el panel de avisos con los tipos en stock bajo, el saldo teórico de la hucha y las personas por debajo del límite de deuda.
- **CA-022** — Dado un tipo con stock 30 y 60 consumos en los últimos 30 días, entonces muestra «15 días estimados».
- **CA-023** — Dado un tipo que entra en stock bajo, cuando se registran 3 consumos más, entonces solo se ha enviado un aviso de stock bajo. Tras una compra que lo saca de stock bajo, una nueva entrada genera un nuevo aviso.

### Aportaciones
- **CA-030** — Dado un saldo de Luis de −4,00 € y una hucha teórica de 10,00 €, cuando Luis registra una aportación de 5,00 €, entonces su saldo es +1,00 € y la hucha teórica 15,00 €.
- **CA-031** — Cuando se envía una aportación de 0 € o de −3 €, entonces el sistema la rechaza.

### Compras
- **CA-040** — Cuando Marta registra una compra con dos líneas (50 Ristretto por 17,00 € y 20 Decaf por 7,00 €), entonces el formulario muestra un total calculado de 24,00 € y la compra se guarda con ese total. Con una sola línea, el formulario pide un único importe.
- **CA-041** — Dado Ristretto con stock 10 y coste medio 0,4000 €, cuando se registra una línea de 50 por 17,00 €, entonces el stock pasa a 60 y el coste medio a (10 × 0,40 + 17,00) ÷ 60 = 0,3500 €. Dado stock −2, una línea de 50 por 17,00 € deja el coste medio en 0,3400 € y el stock en 48.
- **CA-042** — La compra muestra a Marta como autora, y su saldo personal no cambia.
- **CA-043** — Dada una hucha teórica de 12,00 €, cuando Marta introduce una compra de 20,00 €, entonces la aplicación muestra «La hucha debería tener 12,00 €» y pide confirmación. Si confirma, la hucha teórica queda en −8,00 € y los administradores reciben la notificación.
- **CA-045** — Dada una compra errónea de 50 cápsulas por 200,00 € que elevó el coste medio a 3,6000 €, y tres consumos posteriores de Ana, Luis y Marta a 3,60 €, cuando un administrador anula la compra, entonces el coste medio vuelve al valor reconstruido (p. ej., 0,4000 €), y Ana, Luis y Marta reciben cada uno una regularización de +3,20 €. Los cargos originales no cambian.

### Anulaciones
- **CA-060** — Dado un consumo de Ana registrado hace 10 minutos, cuando Ana lo anula con motivo, entonces queda anulado y el cargo deja de contar.
- **CA-061** — Dado un consumo de Ana de hace 3 días, cuando un administrador lo anula con motivo, entonces queda anulado con el administrador como autor de la anulación.
- **CA-062** — Dado un consumo de Ana de hace 20 minutos, cuando Ana intenta anularlo, o Luis intenta anular uno de Ana, entonces el sistema lo rechaza indicando que lo pida a un administrador.
- **CA-063** — Dado un consumo en la cola local, cuando Ana pulsa «Deshacer», entonces el consumo desaparece de la cola y el servidor nunca lo recibe.
- **CA-064** — Dado un arqueo A1 seguido de un arqueo A2, cuando un administrador intenta anular A1, entonces el sistema lo rechaza. Cuando anula A2 con motivo, se revierten su ajuste y sus cargos, y la hucha teórica vuelve al valor previo a A2. Dado un recuento R2 de Ristretto posterior a R1, R1 no se puede anular para Ristretto.

### Arqueos y recuentos
- **CA-080** — Dada una hucha teórica de 42,00 €, cuando un administrador registra un arqueo con 35,00 € contados, entonces el arqueo guarda saldo teórico 42,00 €, contado 35,00 € y diferencia −7,00 €.
- **CA-081** — Con 6 miembros activos y diferencia −7,00 €, entonces el cliente muestra el reparto previsto, y al confirmar se generan 6 cargos que suman exactamente 7,00 € (cuatro de 1,17 € y dos de 1,16 €, con los cuatro céntimos sobrantes asignados al azar y registrados), y la hucha teórica pasa a 35,00 €.
- **CA-090/CA-091** — Dado Ristretto con stock registrado 30 y coste medio 0,4000 €, cuando un administrador cuenta 24, entonces el stock pasa a 24 y se reparten 2,40 € en cargos entre los miembros activos.
- **CA-093** — El administrador abre la pantalla de control y puede registrar un arqueo, un recuento o los dos, cada uno con su propia confirmación y su propio registro.
- **CA-092** — Dado stock registrado 20, cuando se cuentan 23, entonces el stock pasa a 23 sin movimientos económicos y con el mismo coste medio.

### Notificaciones
- **CA-100** — Dado un usuario sin permiso de notificaciones en su navegador, entonces el sistema no intenta enviarle push y los avisos aparecen solo en la aplicación.
- **CA-101** — Cada tipo del catálogo de RF-101 llega solo a sus destinatarios: un miembro no administrador nunca recibe «stock negativo».
- **CA-102** — Dado un usuario que desactiva «stock bajo», cuando un tipo entra en stock bajo, entonces no recibe push. En su perfil, el interruptor del aviso de deuda aparece activado y no se puede cambiar.
- **CA-104** — El día 1 a las 09:00 (hora de Madrid), cada miembro con el resumen activado recibe su consumo del mes anterior y su saldo.
- **CA-105** — Dado el servicio push devolviendo error, cuando se registra un consumo que provoca stock bajo, entonces el consumo queda registrado y el envío se reintenta. Si el servicio responde que la suscripción no existe, esta se elimina.
- **CA-106** — La pantalla de ayuda explica la instalación en Android y en iPhone/iPad, incluida la condición de añadir a la pantalla de inicio.
- **CA-074** — Con un límite de deuda de −5 €: con saldo −6 €, Ana recibe el recordatorio cada 7 días; con −12 €, cada 3 días; con −25 €, cada día. Si Ana pasa de −6 € a −12 € dos días después de un recordatorio, el siguiente le llega al tercer día de ese recordatorio, no en el momento del cambio. Si un administrador cambia el límite a −10 €, con −12 € Ana pasa a recibirlo cada 7 días. La pantalla de configuración muestra los tramos vigentes.

### Saldos y estadísticas
- **CA-110** — Cualquier miembro ve los saldos de todos los miembros activos y el historial económico.
- **CA-112** — Ana ve el detalle de los movimientos de su saldo, con el origen de cada uno.
- **CA-113** — Por defecto, el historial no muestra registros anulados. Con «Mostrar anulados», aparecen marcados con autor, fecha y motivo.
- **CA-120** — Las estadísticas globales muestran consumos por tipo y mes, con los de invitados separados.
- **CA-121** — Ana ve sus estadísticas y las de Luis. Un administrador ve también las de una persona dada de baja.
- **CA-122** — Cuando un visitante o una persona sin sesión abre la URL de estadísticas, entonces el sistema no muestra datos y lleva a la entrada. Luis (miembro) sí ve las estadísticas de Ana (RN-061, CAMBIO-019).
- **CA-111** — La pantalla de saldos muestra la hucha, los saldos de todos y los últimos 5 movimientos, con un enlace a `/historial`. Solo la fila del propio usuario es pulsable y abre `/historial` filtrado por sus movimientos.

### Usuarios y acceso
- **CA-130/CA-131** — Cuando un administrador da de alta a Pedro, entonces Pedro queda activo sin contraseña y la aplicación muestra un enlace de invitación válido 24 horas para copiarlo.
- **CA-132** — Con un enlace válido, una contraseña de 14 caracteres se rechaza y una de 15 se acepta. Un enlace usado o caducado muestra «Enlace no válido o caducado». Generar un enlace nuevo invalida el anterior.
- **CA-133** — Tras 5 contraseñas incorrectas, el sexto intento, aunque sea correcto, se rechaza durante 15 minutos. El mensaje no revela si el correo existe.
- **CA-134** — Dado un único administrador activo, cuando intenta quitarse el rol, entonces el sistema lo rechaza.
- **CA-135** — Dado Luis con saldo −6,00 € que no paga, cuando un administrador lo da de baja registrando deuda incobrable, entonces Luis queda con saldo 0 y dado de baja, se reparten 6,00 € en cargos entre los demás activos, y sus sesiones quedan invalidadas. Dada Ana con +10,00 €, la baja registra una devolución de 10,00 € y la hucha teórica baja 10,00 €.
- **CA-136** — Cuando un administrador reactiva a Luis, Luis vuelve activo con saldo 0 y necesita un enlace nuevo para entrar.
- **CA-137** — Cuando Ana pulsa «Cerrar sesión en todos los dispositivos», sus otras sesiones dejan de ser válidas en la siguiente petición.
- **CA-138** — Dado un administrador que introdujo la contraseña hace 20 minutos, cuando intenta registrar una baja, entonces la aplicación le pide la contraseña antes de continuar.
- **CA-139** — Dada una base de datos sin usuarios y `ADMIN_INICIAL_EMAIL` definido, al arrancar se crea el administrador y el log de Coolify muestra un enlace válido 24 horas; el fichero de log contiene el evento, pero no el enlace. Al reiniciar con usuarios existentes, no se crea nada. El comando de recuperación genera un enlace para un administrador existente. Sin usuarios y sin `ADMIN_INICIAL_EMAIL`, la aplicación no arranca y registra el nombre de la variable.
- **CA-139c** — Cuando un administrador da de alta a Pedro, cambia su rol, lo reactiva o genera un enlace para él, cada acción queda en el registro de auditoría con su autor y su fecha.

### Privacidad
- **CA-160** — Dado Pedro, que entra por primera vez, cuando define su contraseña, entonces ve el texto de privacidad y no puede usar la aplicación hasta pulsar «He leído el texto». Se registran la fecha y la versión. Si se publica una versión nueva, se le vuelve a mostrar. Desde el perfil puede abrir el texto en cualquier momento.

### Copias y configuración
- **CA-140** — A las 03:00 se sube al bucket un archivo con la copia de la base de datos y las fotos. Restaurado en un entorno aparte, la aplicación arranca con los mismos saldos.
- **CA-142** — Con credenciales S3 incorrectas, la copia falla, se registra el error y los administradores reciben la notificación.
- **CA-144** — Retirado por CAMBIO-030.
- **CA-143** — El administrador ve las copias en un único listado, con «Descargar» y «Restaurar» en cada fila, y ya no ve ninguna sección para anotar pruebas de restauración ni aviso de 100 días.
- **CA-150** — Cuando un administrador cambia el plazo de autoanulación a 30 minutos, el cambio queda registrado y se aplica a las anulaciones posteriores.

### Relleno de agua
- **CA-170** — Dado un último relleno vigente de Jorge hace 3 horas, cuando Ana abre la aplicación, entonces ve «He rellenado el agua» con «Último: Jorge, hace 3 h» encima de las cápsulas.
- **CA-171** — Cuando Ana pulsa «He rellenado el agua», entonces se registra un relleno a su nombre y aparece durante 5 segundos un aviso con «Deshacer» que el lector de pantalla anuncia. Si lo pulsa, el relleno queda anulado como «Deshecho por el autor» y no cuenta.
- **CA-172** — Dado un intervalo mínimo de 60 minutos y un relleno vigente de Ana hace 20 minutos, cuando Luis pulsa «He rellenado el agua», entonces el sistema lo rechaza y la aplicación muestra «Ana la rellenó hace 20 min». Si el relleno de Ana se anula, Luis sí puede registrar el suyo.
- **CA-173** — Dado el móvil sin conexión, entonces la acción aparece desactivada con el texto «Necesitas conexión para registrar el relleno».
- **CA-174** — Ana anula con motivo su relleno de hace 10 minutos. Uno de hace 20 minutos se rechaza indicando que lo pida a un administrador. Un administrador anula con motivo un relleno de hace 3 días.
- **CA-175** — Luis (miembro) ve el ranking de rellenos de todos en el periodo elegido. Ana ve en sus estadísticas cuántos rellenos ha registrado.
- **CA-176** — En octubre, Ana y Jorge registran 6 rellenos vigentes cada uno y Luis 4. El 1 de noviembre, la pantalla principal muestra a Ana y Jorge como aguadores del mes durante todo noviembre, y el resumen mensual lo incluye. Un mes sin rellenos no tiene título. Una persona dada de baja antes del día 1 no opta al título, aunque sus rellenos siguen en el ranking.

### Experiencia transversal
- **CA-180** — Dado un móvil en modo oscuro sin preferencia guardada, la aplicación se muestra en oscuro con «Automático» seleccionado. Si el sistema pasa a claro durante la sesión, la aplicación cambia sin recargar. Si Ana elige «Claro» con un importe a medio escribir, el importe y el foco se conservan, y al volver a abrir la aplicación sigue en claro.
- **CA-181** — Cuando Ana activa «Reducir transparencia», todas las superficies pasan a opacas y siguen visibles las mismas acciones y datos. Con la preferencia del sistema de reducir transparencia, las superficies son opacas aunque el ajuste esté desactivado.
- **CA-182** — Luis (miembro), con el móvil a 390 px, ve en Inicio, Saldos, Historial, Compras, Estadísticas, Perfil y Ayuda la barra inferior con las 5 secciones, la activa marcada y la campana. A 900 px ve el carril de iconos y a 1440 px la barra lateral. Ana (administradora) ve además «Administración» en la barra lateral y en Perfil. En `/aceptar-privacidad` no hay navegación. En Perfil puede cerrar su sesión actual. Con JavaScript desactivado, los enlaces y formularios funcionan.
- **CA-183** — Ana abre Inicio a 1440 px: las cápsulas están en la columna izquierda, con al menos 3 tarjetas por fila, y hucha, saldo, agua y «Tus últimos consumos» en la derecha. Con el tabulador recorre primero el resumen, después las cápsulas y luego lo secundario, igual que en móvil.
- **CA-184** — Luis abre Inicio en un móvil de 390 × 844 px con 6 tipos activos y sin avisos persistentes: la primera fila de tarjetas de cápsula se ve entera sin desplazarse.
- **CA-185** — Un tipo con foto se ve con la foto en círculo y un aro de su color. Un tipo sin foto, o con una foto que no carga, se ve con la ilustración vectorial en su color. Tocar la tarjeta registra un consumo; el botón de persona lo registra para un invitado. El lector de pantalla anuncia el tipo, marca, precio, unidades y días.
- **CA-186** — Luis registra un café o un relleno de agua: el aviso muestra la confirmación funcional con «Deshacer» durante 5 segundos acompañada de la reacción contextual de Capsulito (con rotación de frases y control de repetición en toques consecutivos) y su voz sincronizada si está activa. Con stock bajo, Inicio muestra a Capsulito con la campana; en listas vacías y páginas de error aparece con su pose correspondiente. En `/ayuda/capsulito` puede simular todos los eventos, poses y formas de boca (`0..7`) sin alterar datos reales. Ninguna pantalla muestra dos mascotas simultáneamente fuera del aviso flotante.
- **CA-187** — Luis apaga «Mostrar a Capsulito» en Perfil: al recargar, en ninguna pantalla aparece la mascota y los vacíos muestran su icono. Si silencia la voz de Capsulito, las reacciones se muestran sin reproducir audio. Con `prefers-reduced-motion` del dispositivo, la mascota permanece en pose estática sin parpadeo ni boca animada.
- **CA-188** — Pedro entra por primera vez tras aceptar la privacidad: ve la invitación a la historia de bienvenida de nueve escenas y puede recorrerla, saltarla o cerrarla; al recargar no vuelve a abrirse sola. Desde Perfil y desde Ayuda puede volver a abrirla. Con JavaScript desactivado, `/ayuda` muestra las escenas en formato estático.

### Visitantes, compras rápidas, estadísticas del departamento y ayuda (F10)
- **CA-189** — Ana genera un enlace de visitante: ve el enlace, el QR, la hora de caducidad (24 h después) y «Revocar». Tras revocarlo, o 24 h después, quien lo abre ve que el enlace ya no vale y que debe pedir otro a un miembro.
- **CA-190** — Lucía abre un enlace vigente sin sesión, escribe su nombre y ve solo las cápsulas disponibles: ni saldos, ni nombres de miembros, ni historial, ni estadísticas.
- **CA-191** — Lucía toca «Ristretto» y ve «Pendiente de aprobación» en 1 s o menos. El stock de Ristretto, su coste medio y todos los saldos siguen igual. Si el toque se reenvía, solo hay un café.
- **CA-192** — Tras el café de Lucía, los administradores con el aviso activo reciben «Café de visitante pendiente» y lo ven en la lista de pendientes con su nombre, el tipo, la hora y que el enlace lo generó Ana.
- **CA-193** — Con un Ristretto en stock 10, un administrador aprueba el café de Lucía: el stock queda en 9, no aparece ningún movimiento en ningún saldo y la hucha teórica no cambia. Si lo rechaza, el stock sigue en 10. Si después anula el café aprobado, el stock vuelve a 10.
- **CA-194** — Con la sesión de visitante, Lucía abre `/saldos`, `/estadisticas` y `/historial` por URL directa y no ve datos.
- **CA-195** — Un navegador sin datos abre la aplicación: ve primero la bienvenida con «Empezar». Al terminarla ve «Entrar». Si llegó con un enlace de visitante, ve además «Soy visitante».
- **CA-196** — En un dispositivo sin preferencia de voz, la voz de Capsulito está activa. Si Luis la silencia, sigue silenciada al recargar.
- **CA-197** — Luis registra en una sola pantalla 16 cápsulas de A por 6,40 €, 16 de B por 6,40 € y 8 de C por 3,60 €: ve 3 líneas y un total de 16,40 €; al registrar hay una compra con tres líneas, cada stock sube en su cantidad y la hucha baja 16,40 €. Con todas las cantidades a 0 no puede registrar.
- **CA-198** — Con la hucha teórica en 3,20 €, Luis registra una compra de 24,00 €: un diálogo muestra «3,20 €», «24,00 €», «−20,80 €» y que se avisará a los administradores, con «Cancelar» y «Registrar igualmente». Sin JavaScript ve lo mismo como paso intermedio.
- **CA-199** — En Saldos, cada persona activa muestra su saldo y el total de sus aportaciones. El detalle de Marta lista cada aportación con fecha, importe y quién la registró.
- **CA-200** — Ana (administradora) registra 20,00 € a nombre de Marta: el saldo de Marta sube 20,00 €, la hucha teórica sube 20,00 €, la aportación muestra que la registró Ana y Marta recibe el aviso. Si Luis (miembro) envía a mano una aportación a nombre de Marta, se rechaza.
- **CA-201** — Luis abre Estadísticas y, sin elegir a nadie, ve los cafés de todas las personas activas.
- **CA-202** — Estadísticas muestra en el mes actual las cifras clave, los cafés por persona ordenados, el consumo por tipo, la evolución de 12 meses (propios, invitados y visitantes) y la evolución de la hucha, cada gráfico con su tabla. Al elegir «Últimos 3 meses», todo cambia de periodo, también sin JavaScript.
- **CA-203** — En Arqueos y recuentos, Ana pulsa «Ayuda»: el panel explica la pantalla, el saldo teórico, el arqueo, el recuento y la diferencia. El foco entra en el panel y vuelve al botón al cerrarlo. Sin JavaScript, el botón lleva a esa sección de `/ayuda`.
- **CA-204** — Tras la bienvenida, el primer Inicio de Pedro muestra el tour de 4 pasos. Lo salta y no vuelve a aparecer en ningún dispositivo, y lo puede repetir desde la ayuda de Inicio.
- **CA-205** — El umbral mínimo, el arqueo, el recuento, el plazo de autoanulación, el límite de deuda y el intervalo de rellenos muestran su línea de ayuda bajo el campo.
- **CA-206** — En Chrome de Android sin la aplicación instalada, Inicio muestra «Instalar beCafé» y su botón abre el diálogo del sistema. En Safari de iPhone, la tarjeta explica los pasos. Tras descartarla no vuelve a aparecer para esa cuenta, y Perfil conserva la opción.
- **CA-207** — Una cuenta nueva tiene todos los avisos activados. Tras la bienvenida, Capsulito ofrece «Activar avisos». Si Pedro rechaza el permiso, no se le vuelve a ofrecer y Perfil explica cómo activarlo.
- **CA-208** — Luis sube una foto JPEG de 3 MB en Perfil y la ve en Perfil, Saldos, Estadísticas y la navegación, sin metadatos. Un administrador quita la foto de Luis desde Usuarios y queda en la auditoría. Un fichero de 6 MB o que no es una imagen se rechaza.
- **CA-209** — Marta, sin foto, aparece con la misma ilustración sobre el mismo color cálido en todas las pantallas (RF-222, CAMBIO-022).
- **CA-210** — Un administrador elimina el nombre de Lucía de su café aprobado: el café sigue aprobado, con su tipo y su hora, y en todas las pantallas aparece «Visitante». La auditoría registra la eliminación sin el nombre.

### Inicio centrado en el café, Capsulito gamberro y pulido de la interfaz (F11)
- **CA-211** — Luis registra una compra con 16 cápsulas de A sin importe y la hucha en negativo: el importe de A muestra un error de campo y no aparece el diálogo de hucha negativa, con o sin JavaScript.
- **CA-212** — Con el diálogo de hucha negativa abierto, el envío falla: el error queda visible en primer plano y el foco está en él.
- **CA-213** — Ana registra un café propio y después uno de invitado: tras cada confirmación del servidor, Capsulito muestra una frase de registro del anexo y, con la voz activa, la dice. Sin conexión, el café queda «Pendiente de enviar» sin frase. Con la mascota desactivada no hay frase.
- **CA-214** — Pedro abre Inicio por primera vez en el día: recibe un saludo y, después, el aviso de stock bajo. Vuelve a Inicio 30 minutos después: no hay saludo. Vuelve 2 horas después del último saludo: recibe otro.
- **CA-215** — Marta recibe 80 frases de registro desde su móvil y su ordenador: ninguna se repite. La frase 81 empieza un ciclo nuevo.
- **CA-216** — Inicio muestra a Capsulito arriba, las cápsulas debajo y después hucha, saldo, agua y últimos consumos. A 1440 px, las cápsulas van a la izquierda y el resto en una columna estrecha.
- **CA-217** — Con Ristretto en stock 0, Inicio lo muestra atenuado con «Sin stock». Luis lo toca y ve «El sistema dice que no quedan. ¿Has cogido una igualmente?». Con «Cancelar» no pasa nada. Con «Sí, registrar» se aplica CA-017. Sin JavaScript, la pregunta es una página intermedia. Un tipo nunca comprado no aparece.
- **CA-218** — Con Lungo en stock 3 y umbral 5, su tarjeta muestra un icono y «Quedan pocas», y se registra con un toque.
- **CA-219** — Ana pulsa «He rellenado el agua»: Capsulito muestra en pantalla el mismo mensaje que dice, y el lector de pantalla lo anuncia.
- **CA-220** — Luis (no administrador) abre «Ajustes» y encuentra tema, «Reducir transparencia», «Mostrar a Capsulito», voz, notificaciones e instalación. No ve «Configuración». Perfil ya no contiene esos ajustes.
- **CA-221** — A 1440 px, Perfil muestra datos y foto en una columna, y contraseña y sesiones en otra.
- **CA-222** — Marta, sin foto, aparece con la misma ilustración sobre el mismo color cálido en todas las pantallas, con contraste de 3:1 como mínimo en claro y oscuro; su nombre es el nombre accesible.
- **CA-223** — Ana da de alta a Pedro con una foto JPEG válida: Pedro aparece con su foto. Con un archivo de 6 MB, el alta se rechaza con un error en el campo de foto y Pedro no se crea.
- **CA-224** — El texto de privacidad nombra a «Mardomingo Software» y a «Daniel Diez Mardomingo», sin correo ni teléfono. Al publicarse, cada persona lo vuelve a ver al entrar.
- **CA-225** — En la entrada, Capsulito mira al escribir el correo, se tapa los ojos en la contraseña, pone cara triste tras un fallo y celebra tras acertar. Con movimiento reducido o sin JavaScript se ve la imagen estática y el formulario funciona igual.
- **CA-226** — Una ruta inexistente muestra la página 404 con Capsulito, qué ha pasado y un enlace a Inicio; igual con 400 y 403. Un fallo interno muestra la 500 con el código de incidencia y sin detalles internos.
- **CA-227** — En el tour de Inicio y en el panel de ayuda, Capsulito aparece junto a cada paso y lo dice con la voz activa; el texto contiene el mensaje completo.
- **CA-228** — En Inicio, Luis abre la ayuda y pulsa «Repetir el tour»: el tour empieza desde el primer paso, también sin JavaScript.
- **CA-229** — En cada rol, la navegación muestra cada destino una sola vez.
- **CA-230** — A 1440 px, la ficha de cápsula reparte sus campos en dos columnas y el detalle de compra acota el motivo de anulación y su botón.
- **CA-231** — En Saldos, las filas están alineadas y la columna derecha va sobre un panel con borde y fondo más claro.
- **CA-232** — En Estadísticas, cada «Ver datos» aparece abierto al cargar.
- **CA-233** — Tras un envío con error, el campo se sacude una vez y el mensaje entra suavemente; con movimiento reducido no hay movimiento.
- **CA-234** — Al cambiar el tema, el indicador del selector se desliza hasta la opción elegida y sigue bien colocado al cambiar el tamaño de la ventana.
- **CA-235** — Con ratón, el borde de una tarjeta brilla alrededor del puntero; en una pantalla táctil no brilla.
- **CA-236** — Al guardar Perfil, el botón muestra un check solo si el servidor confirma. Tras una aportación, la cifra del saldo pasa al valor nuevo en 300 ms o menos y el lector de pantalla lee solo el valor final.
- **CA-237** — El catálogo de locuciones contiene las 160 frases con el texto visible idéntico al del anexo y un texto de voz con etiquetas de ElevenLabs v3 que conserva las mismas palabras.
- **CA-238** — Lucía da de alta a una persona con la aplicación abierta por http y pulsa «Copiar enlace»: el enlace queda en el portapapeles y el botón dice «Enlace copiado». En un navegador que no permite copiar, el enlace queda seleccionado y se muestra el mensaje para copiarlo a mano.
- **CA-239** — Lucía pulsa «Generar enlace» en la ficha de una persona: el enlace aparece justo debajo del botón, la vista se desplaza hasta él y el lector de pantalla anuncia que está listo. Lo mismo al dar de alta y al reactivar, también sin JavaScript.
- **CA-240** — Pedro recorre el tour de Inicio con la voz activa: en cada paso mueve la boca el Capsulito de la tarjeta del paso y el de arriba de Inicio queda quieto y callado hasta que termina el tour.
- **CA-241** — Ana abre su enlace de invitación y escribe la contraseña: Capsulito se tapa los ojos; si las contraseñas no coinciden, pone cara triste; con una válida, celebra. Con movimiento reducido o sin JavaScript, Capsulito queda estático y la pantalla funciona igual.
- **CA-242** — Lucía abre el listado de personas: cada persona con foto la muestra a la izquierda del nombre, y una persona sin foto muestra su avatar ilustrado.
- **CA-243** — Pedro toca su cápsula con la voz activa: al confirmar el servidor, salta un confeti de 1 s como máximo sobre la tarjeta y suena el sonido de celebración; al terminar, Capsulito dice su frase. Durante la celebración, otro toque o «Deshacer» funcionan a la primera. Lo mismo con un café de invitado, el agua y la tarjeta «Sin stock» confirmada.
- **CA-244** — Con la voz silenciada no suena nada; con «Reducir movimiento» no hay confeti; sin conexión, el café pendiente de enviar no tiene celebración ni sonido.
- **CA-245** — Pedro toma sobre todo Ristretto y Ana sobre todo Lungo: cada uno ve primero su cápsula más tomada en 30 días. Una persona sin consumos en 30 días ve el orden del departamento; a igualdad, alfabético.
- **CA-246** — Lucía registra un recuento en el que faltaban 3 Ristretto: cada persona activa ve en el panel de avisos y una vez en Inicio «Recuento del 26/10: faltaban 3 Ristretto; 1,05 € repartidos entre 8 personas (0,13 € cada una)». Un recuento con sobrantes dice que no hay cargos; su anulación también avisa; un recuento sin diferencias no avisa.
- **CA-247** — Pedro recorre la historia de bienvenida: después de «stock y compras» ve la escena «el dinero» con su texto y, con la voz activa, la oye; la historia tiene nueve escenas, también en `/ayuda` sin JavaScript.
- **CA-248** — Ana deja Inicio abierto: Capsulito parpadea cada 3 s y hace los cinco gestos de RF-259 (CA-259), y vuelve a empezar. Si habla, el gesto se corta y el ciclo empieza de nuevo. A 64 px no hace gestos; con movimiento reducido, queda quieto.
- **CA-249** — Un navegador sin datos abre `/login`, el enlace de visitante o un enlace de alta o recuperación: ve primero la portada del corto con «Ver el corto» y «Saltar». Al terminar el corto o saltarlo ve la bienvenida («Empezar») o, en el enlace de alta o recuperación, el formulario. Con la marca de bienvenida vista no ve el corto. Sin conexión no se ofrece. Con la sesión abierta no lo ve.
- **CA-250** — Ana pulsa «Ver el corto otra vez» en Ajustes o en Ayuda: se abre el corto en un diálogo con sus controles, y al cerrarlo vuelve a la pantalla donde estaba.
- **CA-251** — Beto pulsa «Ver el corto»: el vídeo suena con sus subtítulos grabados y tiene pausa y saltar. Antes de pulsar no se ha descargado el vídeo ni suena nada. «Leer la transcripción» la abre en una hoja. Sin JavaScript no se muestra la portada y las pantallas siguen funcionando.
- **CA-252** — En la portada, «Saltar» está a la vista, mide al menos 24 × 24 px, tiene un contraste de al menos 4,5:1 en tema claro y oscuro y se alcanza con el teclado. Las pantallas con la portada no tienen infracciones de axe.
- **CA-253** — Un administrador con S3 configurado abre «Copias de seguridad»: ve un único listado, de la más reciente a la más antigua, con fecha, tamaño, etiqueta, origen, «Descargar» y «Restaurar». Con más de 8 copias, la paginación muestra 8 por página y llega a un máximo de 30. Una copia fallida aparece con la etiqueta «Fallida» y sin botones. Sin S3, ve la explicación y ningún botón.
- **CA-254** — El administrador pulsa «Restaurar» en la copia del 25/10/2026 03:00: el diálogo dice qué se sustituye y qué se pierde y pide su contraseña. Con una contraseña incorrecta no se restaura nada. Un miembro no puede restaurar por ninguna vía. Con otra restauración en curso, se rechaza.
- **CA-255** — Con un fallo en la copia de resguardo, la descarga, la suma de verificación o una copia de una versión más nueva, la restauración se detiene, los saldos no cambian y la aplicación vuelve a aceptar cafés.
- **CA-256** — Tras una restauración correcta, la aplicación vuelve a responder con los saldos de la copia, el bucket tiene una copia de resguardo nueva y la auditoría y la pantalla de copias muestran la restauración.
- **CA-257** — Retirado por CAMBIO-030. El enlace de vuelta dice «Volver a Administración» (CA-253).
- **CA-258** — Ana pulsa la segunda cápsula, que pasa a ser la que más ha tomado: sigue en el segundo puesto y el confeti sale sobre ella. Al recargar Inicio, aparece primera.
- **CA-259** — Ana deja Inicio abierto: a los 4 s Capsulito mira a los lados, a los 9,5 s golpea el pie, a los 15 s bosteza tapándose la boca, a los 20,5 s se da toquecitos en el reloj y a los 26 s bosteza estirándose; a los 29 s vuelve a empezar. Con movimiento reducido, queda quieto.
- **CA-260** — Beto pulsa «He rellenado el agua» con la voz activa: suena el sonido del agua y no el de los cafés. Con la voz silenciada, no suena nada.
- **CA-261** — A 1280 px, Usuarios, Arqueos y recuentos, Cápsulas, Compras y Avisos se ven en dos columnas, con la derecha sobre otro fondo y con borde. A 390 px, una columna y sin desplazamiento horizontal.
- **CA-262** — En Avisos, un aviso pendiente lleva fondo de acento, borde y «Nuevo»; uno visto, fondo neutro y sin etiqueta. Axe sin infracciones en claro y oscuro.
- **CA-263** — En Compras, cada cápsula muestra «Quedan N»; una con stock bajo muestra además «Quedan pocas» con icono.
- **CA-264** — La portada del corto ocupa la pantalla con la portada difuminada a los lados, «Ver el corto» sobre ella, «Saltar» en una esquina (≥ 24 × 24 px, contraste ≥ 4,5:1) y «Leer la transcripción» abajo, que abre una hoja que se puede cerrar.
- **CA-265** — Con el corto en marcha solo se ven los subtítulos grabados: el reproductor no tiene ninguna pista de subtítulos de la aplicación.
- **CA-266** — Con el reloj simulado y sin avisos, el bocadillo de Inicio muestra el mensaje del día tras el saludo; el mismo mensaje en dos visitas y dos dispositivos del mismo día, y otro al día siguiente. No se oye voz.
- **CA-267** — El catálogo tiene al menos 40 mensajes con identificador único; ninguno contiene marcadores distintos de `{nombre}`.
- **CA-268** — Dos peticiones simultáneas de Inicio de la misma persona el mismo día reciben el mismo mensaje; en 40 días no se repite ninguno; un día con aviso no gasta mensaje.
- **CA-269** — El campo de color ofrece 7 colores fijos sin el rosa y «Otro color»; un tipo rosa se edita y muestra el rosa como actual; al guardar otro color, el rosa ya no aparece.
- **CA-270** — Para una muestra de colores propios (blanco, negro, grises, saturados y casi iguales al fondo), el texto y los límites calculados cumplen 4,5:1 y 3:1 en claro y oscuro.
- **CA-271** — El servidor rechaza un color propio que no es hexadecimal de 6 cifras con un mensaje en el campo.
- **CA-272** — «Quitar foto» deja el tipo sin foto, con su ilustración, y borra el archivo; con y sin JavaScript; sin foto no aparece el botón.
- **CA-273** — Al elegir una foto en los cinco formularios aparece el encuadre cuadrado (con guía redonda en personas); se mueve y amplía con el teclado y los controles tienen nombre accesible.
- **CA-274** — Con una zona de encuadre en la parte superior de una foto vertical, la foto guardada contiene solo esa zona; sin zona, el cuadrado central; una zona fuera de la foto se rechaza sin guardar nada.
- **CA-275** — En Copias de seguridad, «Hacer copia ahora» y el listado tienen su fondo y su icono, desde 1024 px hay dos columnas, y la pantalla pasa axe en claro y oscuro.
- **CA-284** — Un administrador descarga una copia íntegra; un miembro y una persona sin sesión no pueden; una clave no válida se rechaza sin consultar el bucket.
- **CA-285** — Cada descarga deja auditoría y un evento técnico sin datos personales.
- **CA-286** — «Hacer copia ahora» sube una copia completa al bucket; una segunda a la vez no se ejecuta; un fallo se explica y el servidor sigue aceptando registros; funciona sin JavaScript.
- **CA-287** — La copia manual aparece con la etiqueta «Manual» y su auditoría guarda quién la lanzó.
- **CA-288** — Sin S3 no hay «Descargar» ni «Hacer copia ahora» y se explica por qué.
- **CA-289** — La lista muestra el origen de cada copia: «Local» en localhost, el dominio en producción y «Origen no registrado» en las anteriores.
- **CA-290** — La confirmación de restaurar muestra el origen de la copia y el del sistema, y destaca la diferencia sin bloquear.
- **CA-291** — Cada paso de una restauración emite su evento con el mismo identificador de restauración, también tras el reinicio, y un fallo indica el paso y el código.
- **CA-292** — La verificación registra el origen de la copia, el origen del sistema y las versiones de esquema comparadas.

### Escenarios futuros de verificación (EV)

| ID | Escenario | Requisitos | Método |
| --- | --- | --- | --- |
| EV-010 | Reenvío del mismo consumo con respuesta perdida | RF-016, INV-04 | Prueba de integración |
| EV-011 | Anular dos veces el mismo registro, también en paralelo | RN-030, INV-05 | Prueba de integración |
| EV-020 | Repartos con importes no divisibles (7,00 € entre 6; 0,01 € entre 10) | RN-014, INV-01 | Prueba unitaria con propiedades |
| EV-030 | Recalcular stock y coste medio desde cero y compararlos con los guardados tras secuencias aleatorias de compras, consumos y anulaciones | INV-02, RN-003 a RN-013 | Prueba basada en propiedades |
| EV-031 | Anulación de una compra con consumos posteriores, compras posteriores y stock negativo intermedio | RN-012 | Prueba unitaria |
| EV-040 | Baja, cambio de rol y baja simultánea de los dos últimos administradores | RN-041, INV-03 | Prueba de integración con concurrencia |
| EV-041 | Baja con consumos en la cola local del usuario: se rechazan al llegar (RN-054) | INV-06, RN-054 | Prueba de integración |
| EV-050 | Acceso directo por URL a todas las rutas de administración y estadísticas ajenas con rol miembro | RNF-007 | Prueba de extremo a extremo |
| EV-060 | Accesibilidad de la pantalla principal y formularios | RNF-001 | axe + revisión manual |
| EV-070 | Retirado por CAMBIO-030 (prueba trimestral de restauración) | RNF-009 | — |
| EV-080 | Anulación del último arqueo y rechazo de uno anterior; recuentos con varios tipos | RN-036, RF-064 | Prueba de integración |
| EV-090 | Compra con varias líneas anulada con consumos posteriores de los dos tipos | RN-037, RN-012 | Prueba unitaria |
| EV-100 | Dos rellenos simultáneos de personas distintas: solo uno queda vigente | RN-082, INV-07 | Prueba de integración con concurrencia |
| EV-101 | Recordatorio de deuda progresivo: cambios de tramo y de límite | RN-074 | Prueba unitaria con reloj simulado |
| EV-061 | Temas y preferencias de apariencia: claro, oscuro, contraste elevado, colores forzados, movimiento reducido, texto al 200 % y 320 px | RF-180, RF-181, RNF-015 | E2E con emulación de Playwright + revisión manual de lo no emulable (transparencia del sistema) |
| EV-102 | Apariencia y experiencia de F9 en los cinco proyectos de Playwright: navegación en 390, 900 y 1440 px; regresión visual con referencias nuevas (DEC-091); axe en claro y oscuro; EV-061 aplicado a la mascota, la historia y el laboratorio (contraste elevado, colores forzados, movimiento reducido, texto al 200 % y 320 px); `sin-js` en Inicio, Ayuda y navegación | RF-182 a RF-188, RNF-015 | E2E con emulación y revisión manual con VoiceOver y TalkBack |
| EV-103 | Visitante con enlace caducado, revocado o falsificado: no registra cafés ni abre pantallas autenticadas | RF-189, RF-190, RF-194 | Prueba de API y E2E |
| EV-104 | Dos administradores aprueban a la vez el mismo café de visitante: el stock baja una sola vez | RF-193, RN-086, INV-02 | Prueba de integración con concurrencia |
| EV-105 | Un miembro no administrador envía a mano una aportación a nombre de otra persona: se rechaza | RF-200, RN-087 | Prueba de acción y E2E |
| EV-106 | Compra múltiple, confirmación de hucha negativa, acceso de visitante, aportación en nombre de otro, subida de fotos y periodo de estadísticas sin JavaScript | RF-190, RF-197, RF-198, RF-200, RF-202, RF-208 | E2E `sin-js` |
| EV-107 | Confirmación de stock 0, compra con un importe vacío, «Repetir el tour» desde Inicio y alta con foto sin JavaScript | RF-211, RF-217, RF-223, RF-228 | E2E `sin-js` |
| EV-108 | Dos peticiones simultáneas de frase de la misma persona reciben frases distintas y el ciclo no pierde ni duplica ninguna | RF-215, RN-088 | Prueba de integración con concurrencia |
| EV-109 | Ajustes, Perfil, Inicio con los tres estados de stock, la entrada y las páginas 400, 403, 404 y 500 sin infracciones de axe en claro y oscuro | RF-216 a RF-218, RF-220 a RF-222, RF-225, RF-226 | E2E con axe |
| EV-110 | Con movimiento reducido, ninguna microinteracción ni Capsulito anima nada | RF-225, RF-233 a RF-236 | E2E |
| EV-111 | La ruta de Ajustes entra en la suite `acceso` (EV-050) | RF-220 | E2E `acceso` |
| EV-112 | Restauración completa contra un bucket de pruebas: saldos iguales a los de la copia, copia de resguardo en el bucket y entrada en el registro de auditoría | RF-253 a RF-256 | Integración + manual |
| EV-113 | Restauración con un fallo inyectado en cada paso (resguardo, descarga, suma de verificación, migración más nueva): ningún dato cambia y la aplicación sigue aceptando registros | RF-255 | Integración |
| EV-114 | Mensaje del día con el reloj simulado: 40 días sin repetir, el mismo mensaje en dos peticiones simultáneas del mismo día y ningún mensaje gastado en un día con aviso | RN-091, RF-268 | Integración con reloj simulado |
| EV-115 | Contraste de un color propio: para una muestra de colores, el texto y los límites calculados cumplen 4,5:1 y 3:1 en los dos temas | RF-270 | Prueba unitaria |
| EV-116 | Transiciones del estado de instalación: para cualquier secuencia de eventos, `instalada` nunca vuelve a `rechazada` y repetir un estado no cambia el instante | RF-280 | Prueba de propiedades |
| EV-117 | Fallo inyectado en cada paso de una restauración (ampliando EV-113): el último evento con el identificador de restauración nombra el paso y el código, y ningún evento contiene un campo no permitido | RF-291, RF-292 | Integración con SQLite real y bucket falso |

---

## 10. Diseño técnico

Todo el apartado está **aceptado como base del plan** (DEC-041). Donde dice «propuesto», se lee «base aceptada, revisable en la fase de plan».

### 10.1 Restricciones, decisiones y propuestas técnicas

| Tipo | Elementos |
| --- | --- |
| Restricciones confirmadas | RT-001, RT-003 a RT-009 |
| Decisiones aprobadas | SQLite (DEC-028), Coolify (DEC-027), copia S3 diaria (DEC-028/029), Web Push (DEC-020), cola local de consumos (DEC-025), almacenamiento de fotos en volumen (DEC-029) |
| Decididas en CAMBIO-006 | Tecnologías y versiones de referencia (§10.3, DEC-061 a DEC-069) |
| Base aceptada para el plan | Modelo de datos y rutas de este apartado, aceptados como base del plan de Spec Kit y revisables en esa fase (DEC-041). Módulos: traspasados a `ARCHITECTURE.md` (§10.6) |

### 10.2 Arquitectura (propuesta, salvo lo indicado)

```text
 Móvil (PWA)                                   Servidor (Coolify, 1 contenedor)
┌──────────────────────────┐   HTTPS   ┌──────────────────────────────────────────┐
│ SvelteKit (cliente)      │──────────▶│ SvelteKit + adaptador Node               │
│ Service worker           │           │  ├─ Rutas y acciones (UI + API JSON)      │
│  ├─ Caché de la app/fotos│           │  ├─ Dominio (stock, economía, usuarios)   │
│  ├─ Cola IndexedDB de    │           │  ├─ Planificador interno (tareas)         │
│  │  consumos             │           │  └─ SQLite (WAL) ── volumen /data         │
│  └─ Recepción de push    │◀─ push ───│        fotos ───── volumen /data/fotos    │
└──────────────────────────┘           └───────┬───────────────────┬──────────────┘
                                               │ Web Push          │ S3 API
                                     Servicios push         Bucket S3 (copias)
```

- **Límite de confianza**: todo lo que llega del cliente es no confiable. Validación y autorización en el servidor.
- **Una sola instancia** (RT-010): el planificador interno y SQLite asumen un único proceso.
- **DDD proporcional**: el núcleo del dominio es la **economía** (coste medio, regularización, repartos, liquidaciones), donde hay invariantes entrelazadas y dinero. Se modela con módulos de dominio puros y probados. El catálogo, los usuarios y las notificaciones son capacidades de apoyo con operaciones directas. No se usan CQRS, *event sourcing* ni mensajería: el libro de movimientos ya da trazabilidad.

### 10.3 Tecnologías (decididas, CAMBIO-006)

Versiones de referencia comprobadas en npm el 21-10-2026. Las versiones exactas las fija `package-lock.json` en la preparación de F1. Subir una versión mayor exige justificarlo en el `plan.md` correspondiente (`ARCHITECTURE.md` §13). Las librerías marcadas «aislada» se importan desde un único archivo (`ARCHITECTURE.md` §11).

| Componente | Elección | Versión de referencia | Motivo | Decisión |
| --- | --- | --- | --- | --- |
| Entorno de ejecución | Node 24 LTS (`.nvmrc` y `engines`) | 24.22 | LTS con soporte hasta abril de 2028 | DEC-061 |
| Gestor de paquetes | npm con `package-lock.json` | 11.19 | Ya lo usa la plantilla (FUENTE-09) | DEC-069 |
| Framework | SvelteKit 3 con Svelte 5 en modo runes, adaptador Node, TypeScript 6 estricto | 3.1 / 5.57 / 6.0 | RT-002, FUENTE-09 | DEC-057, [ADR-0001](docs/adr/0001-sveltekit-3.md) |
| Estilos e interfaz | Tailwind CSS 4, Bits UI, Lucide (`@lucide/svelte`), Fontsource | 4.3 | RT-002, FUENTE-09 | DEC-044 |
| Acceso a datos | Drizzle ORM + drizzle-kit + `better-sqlite3` | 0.45 / 0.31 / 13.0 | Tipado, migraciones, transacciones síncronas `BEGIN IMMEDIATE` | DEC-062 |
| Validación | Zod 4 | 4.6 | Esquemas compartidos por cliente y servidor | DEC-066 |
| Contraseñas | Argon2id con `@node-rs/argon2` (aislada) | 2.2 | RNF-004, FUENTE-03; formato PHC sin código criptográfico propio | DEC-063 |
| Push | `web-push` con claves VAPID (aislada) | 3.6.7 | RF-100. Sin publicaciones desde 01-2024; protocolo estable | DEC-064 |
| Imágenes | `sharp` (aislada) | 0.35 | RF-005 | DEC-069 |
| Copias | `aws4fetch` (aislada) para la subida y `tar` para el empaquetado | 1.0 / 7.5 | RF-140. Sustituye a `@aws-sdk/client-s3`: una subida diaria no justifica el SDK completo | DEC-065, DEC-069 |
| Planificador | `croner` dentro del proceso (aislada) | 10.0 | Tareas a hora fija con zona horaria | DEC-069 |
| PWA | Service worker de SvelteKit + IndexedDB (`idb`, aislada) | 8.0 | RF-015 | DEC-069 |
| Identificadores | ULID (`ulid`) para claves primarias y `clienteId` | 3.0 | Ordenables por fecha; un único formato | DEC-068 |
| Registro en el servidor | `pino` (aislada); `pino-roll` para el fichero diario; `pino-pretty` solo en desarrollo | 10.4 / 4.0 / 13.2 | RNF-014 | DEC-067, DEC-076, DEC-077 |
| Registro en el cliente | `loglevel` (aislada), sin guardar el nivel en el navegador | 1.9 | RNF-014 | DEC-079 |
| Animación de mascota | `@rive-app/canvas` (aislada en `lib/client/rive.ts`) + SVG por capas como reserva estática; sincronización labial con audio MP3 pregenerado con ElevenLabs | 2.x | RF-186, RF-188; máquinas de estados `.riv` con control de gesto y 8 visemas (`mouth` 0..7) | DEC-106, DEC-115, [ADR-0006](docs/adr/0006-rive-y-sincronizacion-voz-capsulito.md) |
| Pruebas | Vitest con `@vitest/coverage-v8`, `fast-check`, Playwright, `@axe-core/playwright` | 5.0 / 5.0 / 4.10 / 1.64 / 4.14 | Apartado 9; cobertura mínima de la constitución (principio VIII); estrategia en `docs/pruebas.md` | DEC-069, DEC-071, DEC-094 |
| Pruebas de componentes | Vitest Browser Mode con `@vitest/browser-playwright` y `vitest-browser-svelte` | 5.0 / 3.1 | Componentes con estado propio | DEC-089 |
| Pruebas de mutación | StrykerJS (`@stryker-mutator/core`, `@stryker-mutator/vitest-runner`) | 10.0 | Solo `dominio/`; piloto en F4 | DEC-092 |
| Calidad | ESLint, typescript-eslint, eslint-plugin-svelte, `@eslint-community/eslint-plugin-eslint-comments`, Prettier con prettier-plugin-svelte y prettier-plugin-tailwindcss, dependency-cruiser | 10.13 / 8.72 / 3.23 / 4.8 / 3.9 / 18.7 | `ARCHITECTURE.md` §12 | DEC-069 |
| Códigos QR | `uqr` (aislada en `plataforma/qr.ts`) | 0.1 | RF-189 (QR del enlace de visitante) | CAMBIO-020 |

### 10.4 Modelo de datos (SQLite, propuesto)

Convenciones: claves primarias de texto con ULID; fechas en UTC (ISO 8601); importes en céntimos (`INTEGER`); coste medio en diezmilésimas de euro (`INTEGER`).

| Tabla | Campos principales | Restricciones e índices |
| --- | --- | --- |
| `usuario` | id, nombre, email, password_hash (nulo hasta definirla), rol (`miembro`/`admin`), estado (`activo`/`baja`), intentos_fallidos, bloqueado_hasta, privacidad_version, privacidad_leida_en, creado_en, baja_en | `email` único; CHECK en rol y estado |
| `sesion` | id_hash, usuario_id, creada_en, ultimo_uso_en, expira_en, ultima_autenticacion_en, user_agent | Índice por usuario_id |
| `enlace_acceso` | id, usuario_id, tipo (`invitacion`/`recuperacion`), token_hash, expira_en, usado_en, anulado_en, creado_por | Índice por token_hash |
| `tipo_capsula` | id, nombre, nombre_normalizado, marca, intensidad (nulo), color, foto_ruta, estado | Dueño `catalogo`. Único parcial sobre `nombre_normalizado` donde estado = activo; CHECK intensidad 1–13 |
| `existencia` | tipo_capsula_id, umbral_minimo, stock, coste_medio (nulo si nunca comprado), en_stock_bajo | Dueño `economia`. Una fila por tipo; `en_stock_bajo` se deriva de `stock` y `umbral_minimo` (RN-071) |
| `entrada_stock_bajo` | id, tipo_capsula_id, registrada_en | Dueño `economia`. Una fila por transición a stock bajo (RN-072) |
| `consumo` | id, cliente_id, usuario_id, tipo_capsula_id, invitado, precio_aplicado, hora_gesto, hora_registro, estado, anulado_por, anulado_en, motivo_anulacion | `cliente_id` único |
| `aportacion` | id, cliente_id, usuario_id, importe, registrada_en, estado + campos de anulación | `cliente_id` único; CHECK importe > 0 |
| `compra` | id, cliente_id, usuario_id, importe_total, foto_ticket_ruta, registrada_en, estado + campos de anulación | `cliente_id` único |
| `linea_compra` | id, compra_id, tipo_capsula_id, cantidad, importe | CHECK cantidad > 0, importe > 0; único por (compra_id, tipo_capsula_id) |
| `arqueo` | id, admin_id, realizado_en, saldo_teorico, contado, diferencia, estado + campos de anulación | — |
| `recuento` / `linea_recuento` | id, admin_id, realizado_en, estado + campos de anulación / id, recuento_id, tipo_capsula_id, registrado (previsto), contado, diferencia, coste_medio_aplicado, estado (`vigente`/`anulado`) + campos de anulación | `linea_recuento`: único por (recuento_id, tipo_capsula_id); CHECK contado ≥ 0 |
| `movimiento` | id, cuenta (`persona`/`hucha`), usuario_id (nulo si hucha), tipo, importe (con signo), origen_tipo, origen_id, creado_en, vigente | Índices por (usuario_id, vigente) y (origen_tipo, origen_id) |
| `regularizacion` | id, compra_id, consumo_id, usuario_id, importe, creada_en | Dueño `economia`. Un consumo posterior a la compra anulada se cobra o se abona a su persona (RN-037, RN-012); CHECK importe ≠ 0 |
| `reparto` | id, origen_tipo, origen_id, importe, miembros, creado_en | Dueño `economia`. Registra el reparto de un arqueo, de un recuento o de una baja entre las personas activas; CHECK importe ≠ 0 y miembros > 0 |
| `aviso_economia` | id, tipo (`hucha_negativa`), origen_tipo, origen_id, registrado_en | Dueño `economia`. Aviso que deja un registro que deja la hucha en negativo (CA-064); no bloquea el registro |
| `suscripcion_push` | id, usuario_id, endpoint, p256dh, auth, creada_en, ultimo_exito_en, fallos | `endpoint` único |
| `preferencia_notificacion` | usuario_id, tipo, activa | PK (usuario_id, tipo) |
| `notificacion` | id, tipo, usuario_id, referencia, creada_en, enviada_en, leida_en | Para el panel de avisos y la deduplicación |
| `entrega_push` | id, notificacion_id, suscripcion_id, estado (`pendiente`, `enviada`, `agotada`, `caducada`), intentos, proximo_intento, ultimo_codigo | Dueño `notificaciones`. Una fila por aviso y dispositivo; `UNIQUE (notificacion_id, suscripcion_id)`; borrado en cascada con la notificación y con la suscripción (plan F6 D6, D9) |
| `ejecucion_tarea` | tarea, periodo, ejecutada_en | Dueño `plataforma` (planificador). PK (tarea, periodo); evita la doble ejecución de una tarea programada (recordatorio de deuda, resumen mensual) |
| `configuracion` | clave, valor, modificado_por, modificado_en | — |
| `registro_auditoria` | id, actor_id, accion, objeto_tipo, objeto_id, detalle (JSON), creado_en | Cambios de rol, bajas, configuración, enlaces generados |
| `copia_seguridad` | id, iniciada_en, finalizada_en, estado, tamano, error | — |
| `relleno_agua` | id, cliente_id, usuario_id, registrado_en, estado + campos de anulación | `cliente_id` único; índice por (estado, registrado_en). No genera movimientos (RN-080) |
| `aguador_mes` | mes (AAAA-MM), usuario_id, rellenos, determinado_en | PK (mes, usuario_id); una fila por ganador, varias si hay empate |
| `enlace_visitante` | id, token_hash, creado_por, creado_en, expira_en (creado_en + 24 h), revocado_en (nulo), revocado_por (nulo) | Dueño `auth`. `token_hash` único |
| `visita` | id, enlace_id, token_hash, nombre (nulo tras RF-210), nombre_eliminado_en (nulo), creada_en | Dueño `auth`. `token_hash` único |
| `cafe_visitante` | id, cliente_id, visita_id, tipo_capsula_id, hora_gesto, hora_registro, estado (`pendiente`/`aprobado`/`rechazado`/`anulado`), revisado_por, revisado_en, coste_medio_aplicado (nulo), anulado_por, anulado_en, motivo_anulacion | Dueño `economia`. `cliente_id` único; índice por (estado, hora_registro); CHECK en estado |
| `preferencia_cuenta` | usuario_id, clave (`tour_inicio_visto`/`instalacion_descartada`/`oferta_avisos_vista`), valor_en | Dueño `usuarios`. PK (usuario_id, clave); CHECK en clave |
| `usuario` (campo nuevo, CAMBIO-020) | foto_ruta (nulo) | Archivo plano en `/data/fotos`; sin foto, ilustración estable (RF-222; CAMBIO-023) |
| `frase_entregada` (CAMBIO-023) | usuario_id, lista (`registro`/`saludo`), ciclo (≥ 1), frase_id, entregada_en | Dueño `usuarios`. PK (usuario_id, lista, ciclo, frase_id); índice por (usuario_id, lista, entregada_en); CHECK en lista y ciclo. Guarda el ciclo de frases sin repetir de cada persona (RN-088, RN-089). Migración `0008_f11-frases` |

**Tipos de movimiento**: `cargo_consumo`, `abono_aportacion`, `hucha_aportacion`, `hucha_compra`, `hucha_ajuste_arqueo`, `reparto_arqueo`, `reparto_recuento`, `regularizacion`, `devolucion_baja`, `hucha_devolucion_baja`, `abono_incobrable`, `reparto_incobrable`.

**Datos derivados guardados**: `existencia.stock`, `coste_medio` y `en_stock_bajo` se actualizan en la misma transacción que el registro que los cambia (RNF-010). INV-02 garantiza su coherencia con el recálculo.

### 10.5 Interfaces (rutas SvelteKit, propuestas)

Las páginas usan *form actions* de SvelteKit. El cliente sin conexión usa endpoints JSON bajo `/api/`, sin versión en la ruta: la compatibilidad con datos en cola la da la versión de cada contrato (DEC-100). Todas exigen sesión salvo las de acceso.

| Método y ruta | Finalidad | Autorización | Notas |
| --- | --- | --- | --- |
| GET `/` | Pantalla principal y panel de avisos | Miembro | — |
| POST `/?/saludo` | Entregar el saludo de Capsulito al abrir Inicio, si han pasado 2 horas desde el último (RF-214, RN-089; CAMBIO-023) | Miembro | Solo con JavaScript; una segunda llamada dentro de las 2 horas no entrega otro |
| POST `/api/consumos` | Registrar consumo `{clienteId, tipoCapsulaId, invitado, horaGesto}` | Miembro | Idempotente por `clienteId`; 201 nuevo, 200 duplicado |
| POST `/api/consumos/{id}/anular` | Anular consumo `{motivo}` | Autor en plazo o admin | 403 fuera de plazo; 409 ya anulado |
| POST `/api/rellenos` | Registrar relleno de agua `{clienteId}` | Miembro | Idempotente por `clienteId`; 409 `RELLENO_RECIENTE` dentro del intervalo, con autor y hora del último |
| POST `/api/rellenos/{id}/anular` | Anular relleno `{motivo}` | Autor en plazo o admin | Como la anulación de consumos |
| GET/POST `/compras` | Listar y registrar compras (multipart con foto) | Miembro | Paso de confirmación si la hucha queda negativa; acción `anular` |
| GET/POST `/saldos` | Saldo teórico de la hucha, saldos de todos, últimos 5 movimientos y registro de aportaciones | Miembro | Acción `aportar`. Sustituye a la antigua ruta `/aportaciones` (DEC-043) |
| GET/POST `/historial` | Historial económico con filtros Todo/Míos, tipo y «Mostrar anulados»; con «Míos», detalle de los movimientos propios (RF-112) | Miembro | Paginado; acción `anular` |
| GET `/estadisticas`, `/estadisticas/{usuarioId}` | Globales y personales | Miembro / propio o admin | 403 si ajeno y no admin |
| GET/POST `/perfil` | Datos, foto, contraseña, cerrar sesiones. `?/preferencia` redirige (308) a `/ajustes?/preferencia` | Usuario | — |
| GET/POST `/ajustes` | Apariencia, Capsulito y voz, avisos e instalación de la app (RF-220; CAMBIO-023) | Usuario | — |
| POST/DELETE `/api/push/suscripcion` | Alta y baja de suscripción push | Usuario | — |
| POST `/api/registro-cliente` | Recibir eventos `warn` y `error` del registro técnico del cliente | Usuario | Cuerpo validado con Zod; límites de tamaño y frecuencia (PEND-034) |
| GET/POST `/login`, POST `/logout` | Acceso | Público / usuario | Bloqueo RN-048 |
| GET/POST `/acceso/{token}` | Definir contraseña con enlace | Público con token válido | — |
| `/admin/usuarios` | Alta, enlaces, rol, baja con liquidación, reactivación | Admin + reautenticación | — |
| `/admin/capsulas` | Catálogo y fotos | Admin | — |
| `/admin/control` | Arqueos y recuentos | Admin + reautenticación | — |
| `/admin/configuracion` | Parámetros | Admin + reautenticación | — |
| `/admin/copias` | Copias de seguridad (listado único) | Admin | — |
| GET `/fotos/{id}` | Servir fotos | Usuario | Caché larga con versión en la URL |
| GET/POST `/privacidad` | Ver el texto vigente y registrar su lectura | Usuario | Redirección obligatoria según RF-160 |
| GET `/api/salud` | Comprobación de salud para Coolify | Público | Sin datos sensibles |
| GET `/robots.txt` | Excluir la aplicación de los buscadores (RNF-016) | Público | `Disallow: /` |
| GET/POST `/visitantes` | Crear (acción `crear`) y revocar (`revocar`) enlaces de visitante | Miembro | Devuelve URL y QR; caduca a las 24 h |
| GET/POST `/visita/[token]` | Entrada del visitante: nombre y privacidad (acción `entrar`) | Sin cuenta | 410 `ENLACE_NO_VALIDO` si caducó o se revocó |
| GET/POST `/visita` | Pantalla del visitante: registrar café (acción `registrar`) | Visita vigente | Pendiente de aprobación; `LIMITE_SUPERADO` (429) a 10 cafés por visita y minuto |
| GET/POST `/admin/visitantes` | Revisar (`revisar`), anular (`anular`) y eliminar el nombre (`eliminarNombre`) | Administrador | Aprobar descuenta stock sin tocar saldos |
| GET `/saldos/personas/[usuarioId]` | Aportaciones de una persona, paginadas | Miembro | Formulario GET para paginar |
| GET `/fotos/usuarios/[usuarioId]` | Foto de una persona | Miembro | 404 sin foto; `Cache-Control: private, max-age=300` |
| POST `/perfil?/foto`, `?/quitarFoto` y `/admin/usuarios/[usuarioId]?/foto`, `?/quitarFoto` | Subir o quitar la foto | La propia persona o administrador | Mismas validaciones que RF-005 |
| POST `/?/tourVisto`, `?/descartarInstalacion`, `?/ofertaAvisosVista` | Marcas de la cuenta | Miembro | Idempotentes |
| GET `/estadisticas` (cambio) | Añade `periodo` ∈ `ultimos3`, `ultimos12` | Miembro | Sin selector de persona |
| POST `/compras?/registrar` (cambio) | `confirmarHuchaNegativa=si` y `saldoConfirmado` | Miembro | `fail(409, { confirmacion })` con saldo, importe y resultado |
| POST `/saldos?/aportar` (cambio) | `beneficiarioId` opcional | Administrador si es otra persona | `SIN_PERMISO` (403) si un miembro lo envía |

**Errores**: respuestas JSON `{codigo, mensaje}` en español. Códigos propuestos: `SIN_SESION`, `SIN_PERMISO`, `FUERA_DE_PLAZO`, `YA_ANULADO`, `VALIDACION`, `REAUTENTICACION_REQUERIDA`, `ULTIMO_ADMIN`, `RELLENO_RECIENTE`.

### 10.6 Módulos (traspasado)

**Traspasado a [`ARCHITECTURE.md`](ARCHITECTURE.md) §3 y §4 en CAMBIO-005 (DEC-055).** La fuente vigente de módulos, responsabilidades y dependencias es `ARCHITECTURE.md`. Esta tabla se conserva como histórico y no se actualiza.

| Módulo | Responsabilidad | Requisitos |
| --- | --- | --- |
| `lib/server/dominio/coste-medio` | Cálculo del coste medio (RN-003/004) y reconstrucción para regularizaciones (RN-012). Funciones puras. | RF-041, RF-045 |
| `lib/server/dominio/repartos` | División exacta en céntimos con asignación aleatoria registrada. Función pura con fuente de azar inyectable. | RN-014 |
| `lib/server/economia` | Servicios transaccionales de consumo, aportación, compra, anulación, arqueo, recuento y liquidación. Únicos que escriben movimientos. | RF-010 a RF-093 |
| `lib/server/usuarios` | Usuarios, roles, bajas, reactivación, invariante de administradores. | RF-130 a RF-139b |
| `lib/server/auth` | Contraseñas, sesiones, enlaces, bloqueo, reautenticación. | RN-047 a RN-052 |
| `lib/server/notificaciones` | Catálogo, preferencias, deduplicación, envío push y reintentos. | RF-100 a RF-107 |
| `lib/server/tareas` | Planificador: recordatorio de deuda progresivo, resumen mensual, aguador del mes, reintentos push, copia de seguridad. | RF-104, RF-140, RF-176, RN-074 |
| `lib/server/rellenos` | Registro y anulación de rellenos, intervalo mínimo, ranking y aguador del mes. | RF-170 a RF-176 |
| `lib/server/copias` | `VACUUM INTO`, empaquetado, subida a S3, registro de resultado. | RF-140 a RF-143 |
| `lib/server/imagenes` | Validación, redimensionado y limpieza de metadatos. | RF-005, RF-042 |
| `lib/cliente/cola-consumos` | Cola IndexedDB, envío, reintentos y «Deshacer» local. | RF-015, RF-063 |
| `scripts/admin-recuperacion` | Comando de recuperación de acceso de administrador. | RF-139b |

### 10.7 Implementación y operación (propuesta)

- **Transacciones**: cada operación económica en una transacción `BEGIN IMMEDIATE` de SQLite, que serializa las escrituras y evita carreras en el coste medio y en el invariante de administradores.
- **SQLite**: `journal_mode=WAL`, `synchronous=NORMAL` (FUENTE-04 indica que `VACUUM INTO` hace fsync del resultado con NORMAL o FULL), `foreign_keys=ON`, `busy_timeout` de 5 s.
- **Copias**: la aplicación hace la copia completa (DT-040). Se descarta la copia de volúmenes de Coolify como mecanismo principal, porque no es coherente con escrituras en curso y no permite pasos previos (FUENTE-05).
- **Variables de entorno**: `ADMIN_INICIAL_EMAIL`, `ORIGIN`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION`, `LOG_LEVEL` (opcional; `info` por defecto), `TZ=Europe/Madrid`. Los secretos solo en Coolify. Se declaran con su esquema Zod en `src/env.ts` (`defineEnvVars` de SvelteKit 3) y se validan al arrancar; todas son privadas y dinámicas salvo `VAPID_PUBLIC_KEY`, pública y dinámica (`ARCHITECTURE.md` §8).
- **Registro técnico**: cada evento va a la salida estándar (Coolify) y a un fichero JSON diario en `logs/` del directorio de datos (`/data/logs` en producción), rotado con `pino-roll` y conservado **30 días**. Los logs no entran en la copia de seguridad ni se muestran en la aplicación; solo los lee quien administra Coolify. Fuente vigente de las reglas: constitución, principio XVI; diseño: `ARCHITECTURE.md` §9 y ADR-0004 (DEC-076 a DEC-082).
- **Despliegue**: imagen Docker basada en Node 24 LTS (DEC-061), un volumen persistente `/data` (base de datos y fotos), migraciones al arrancar, endpoint de salud.
- **Restauración**: descargar el archivo del bucket, detener la aplicación, sustituir `/data`, arrancar y verificar saldos. Se documentará paso a paso en la fase de plan.

### 10.8 Elementos de diseño (DT)

| ID | Elemento | Estado |
| --- | --- | --- |
| DT-001 | Libro de movimientos con cuenta persona/hucha como única fuente de saldos | Confirmado (DEC-003) |
| DT-010 | Identificador de cliente e idempotencia en consumos, compras, aportaciones y rellenos de agua | Confirmado (DEC-024, DEC-041); extendido a rellenos en CAMBIO-004 |
| DT-020 | Cola de consumos en IndexedDB gestionada por el service worker | Confirmado (DEC-025) |
| DT-030 | Fotos en volumen persistente servidas por la aplicación | Confirmado (DEC-029) |
| DT-040 | Copia de seguridad hecha por la propia aplicación | Confirmado (DEC-041) |
| DT-050 | Planificador dentro del proceso, con una sola instancia | Confirmado (DEC-041) |

---

## 11. Registro de decisiones

Evidencia de aprobación: respuesta del responsable del departamento a la pregunta indicada, sesiones de refinamiento del 20-10-2026 (PREG-001 a PREG-041) y del 21-10-2026 (PREG-042 a PREG-047, CAMBIO-004) en Claude Code.

| ID | Decisión | Tipo | Alternativas consideradas | Recomendación del agente | Elección | Origen |
| --- | --- | --- | --- | --- | --- | --- |
| DEC-001 | Alcance: stock + estadísticas por persona + control de gastos con bote común | Negocio | Solo stock; stock + histórico; stock + reparto de gastos | Stock + histórico | Otra: las tres áreas | PREG-001 |
| DEC-002 | Modo de reparto configurable | Negocio | Configurable con 3 modos; con 2; un modo y diseño preparado | Un modo | Un modo «por consumo» en v1, preparado para más (EXC-001/002) | PREG-002, PREG-003 |
| DEC-003 | Libro de movimientos | Arquitectura | — (consecuencia de DEC-002) | Libro de movimientos | Aprobado con DEC-002 | PREG-003 |
| DEC-004 | Precio del consumo | Negocio | Precio fijo; por lote; coste medio | Coste medio | Coste medio | PREG-004 |
| DEC-005 | Naturaleza del bote | Negocio | Hucha física; tesorero; saldos entre personas | Tesorero | Hucha física | PREG-005 |
| DEC-006 | Registro de aportaciones | Negocio | Autodeclaración; solo admin; con confirmación | Autodeclaración | Autodeclaración | PREG-006 |
| DEC-007 | Pago de compras | Negocio | Solo hucha; solo dinero propio; ambos | Ambos | Solo hucha | PREG-007 |
| DEC-008 | Registro de compras | Negocio | Cualquiera; solo admin; cualquiera con revisión | Cualquiera con revisión | Cualquiera con revisión | PREG-008 |
| DEC-009 | Corrección de registros | Datos | Editar con historial; anular; borrar | Anular | Anular | PREG-009 |
| DEC-010 | Permisos y plazo de anulación | Seguridad | Siempre; con plazo; solo admin | Con plazo | Con plazo (15 min) | PREG-010, PREG-036 |
| DEC-011 | Efecto de anular una compra | Negocio | Nada; regularización automática; asistida | Automática | Automática | PREG-011 |
| DEC-012 | Descuadre de arqueo | Negocio | Ajuste sin atribuir; reparto igual; proporcional | Reparto igual | Reparto igual | PREG-012 |
| DEC-013 | Baja de usuarios | Negocio | Exigir saldo 0; liquidación; congelar | Liquidación | Liquidación | PREG-013 |
| DEC-014 | Autenticación | Seguridad | Cuentas propias; corporativo; enlace por correo | Corporativo o enlace | Cuentas propias | PREG-014 |
| DEC-015 | Alta y recuperación | Seguridad | Correo; enlace por admin; ambos | Enlace por admin | Enlace por admin (EXC-003) | PREG-015 |
| DEC-016 | Roles | Seguridad | Dos roles; tres roles; cuenta técnica | Dos roles | Dos roles | PREG-016 |
| DEC-017 | Consumo con stock 0 | Negocio | Bloquear; permitir con aviso; pedir compra | Permitir con aviso | Permitir con aviso | PREG-017 |
| DEC-018 | Recuento de stock | Negocio | Ajuste sin efecto; ajuste y reparto; sin recuentos | Ajuste y reparto | Ajuste y reparto | PREG-018 |
| DEC-019 | Criterio de stock bajo | Negocio | Umbral por tipo; umbral único; ritmo | Umbral por tipo + estimación | Umbral por tipo; estimación aprobada en PREG-036 | PREG-019, PREG-036 |
| DEC-020 | Canal de avisos | Arquitectura | Solo app; app + push; app + chat | App + chat | App + push | PREG-020 |
| DEC-021 | Catálogo de notificaciones | Negocio | Solo stock; catálogo fijo; catálogo con preferencias | Con preferencias | Con preferencias; deuda siempre activa (PREG-036) | PREG-021, PREG-036 |
| DEC-022 | Visibilidad | Privacidad | Total; mínima; económica transparente | Económica transparente | Económica transparente. Ampliada por DEC-118: las estadísticas de consumo de cada persona son visibles para todos | PREG-022, CAMBIO-019 |
| DEC-023 | Consumo para terceros | Negocio | Solo propio; propio o invitado; también otros miembros | Propio o invitado | Propio o invitado | PREG-023 |
| DEC-024 | Gesto de registro | UX | Un toque; elegir y confirmar; carrito | Un toque | Un toque con «Deshacer» de 5 s | PREG-024, PREG-036 |
| DEC-025 | Sin conexión | Arquitectura | Requiere red; cola de consumos; completo | Cola de consumos | Cola de consumos; precio a la llegada (PREG-036) | PREG-025, PREG-036 |
| DEC-026 | Datos del tipo de cápsula | Datos | Mínimo; con color; con foto | Con color | Con foto | PREG-026 |
| DEC-027 | Entorno de ejecución | Arquitectura | Coolify; servidor interno; plataformas gestionadas | Coolify | Coolify, expuesto a internet (PREG-037) | PREG-027, PREG-037 |
| DEC-028 | Base de datos y copia | Arquitectura | PostgreSQL con copia diaria externa / local / horaria | PostgreSQL + copia diaria externa | **SQLite** + copia diaria de madrugada a S3. Sustituye la propuesta de PostgreSQL de DEC-027. | PREG-028 |
| DEC-029 | Alcance de la copia | Operación | BD + fotos; solo BD; fotos en S3 | BD + fotos | BD + fotos, 30 días | PREG-029 |
| DEC-030 | Cierres periódicos | Negocio | Sin cierres; resumen mensual; cierre obligatorio | Resumen mensual | Resumen mensual | PREG-030 |
| DEC-031 | Sesión | Seguridad | 90 días; 90 días + reautenticación admin; 7 días | Con reautenticación | Con reautenticación | PREG-031 |
| DEC-032 | Primer administrador | Seguridad | Variable de entorno; asistente web; comando | Variable + comando | Variable de entorno; comando aprobado en PREG-036 | PREG-032, PREG-036 |
| DEC-033 | Conservación de datos de bajas | Privacidad | Sin límite; seudonimizar a 12 meses; borrar en la baja | Seudonimizar | **Sin límite**. Condición para reconsiderar: requerimiento de protección de datos, solicitud de un antiguo miembro o revisión anual. | PREG-033 |
| DEC-034 | Accesibilidad | Calidad | AA; buenas prácticas; AAA | AA | AA | PREG-034 |
| DEC-035 | Compra que supera la hucha | Negocio | Bloquear; avisar; sin aviso | Avisar | Avisar | PREG-035 |
| DEC-036 | Valores por defecto (17) | Varios | Aceptar todos; con excepciones; uno a uno | Aceptar | Aceptar todos | PREG-036 |
| DEC-037 | Contexto: 10 usuarios, español, responsable del departamento como responsable de protección de datos, exposición a internet, contraseñas ≥ 15 caracteres, «backend» = panel de administración | Contexto | — | — | Confirmado | PREG-037 |
| DEC-038 | Compras con varios tipos | Datos | Líneas con importe; una compra por tipo; total prorrateado | Líneas con importe y ayuda en el formulario | Líneas con importe | PREG-038 |
| DEC-039 | Corrección de arqueos y recuentos | Negocio | Anular cualquiera; solo el último; no anulables | Solo el último | Solo el último | PREG-039 |
| DEC-040 | Riesgo de conservación y texto de privacidad | Privacidad | Aceptar y redactar propuesta; seudonimizar; texto externo | Aceptar y redactar | Riesgo HALL-008 aceptado expresamente; el agente redacta el texto (anexo A) para su validación | PREG-040 |
| DEC-041 | Propuestas pendientes, stack y diseño técnico como base del plan | Varios | Aceptar todas; con excepciones; una a una | Aceptar | Aceptar todas | PREG-041 |
| DEC-042 | Frecuencia del recordatorio de deuda | Negocio | Semanal, quincenal o mensual; diaria, semanal o quincenal; número de días libre; fija semanal. Tramos: múltiplos del límite; importes fijos; configurables | Semanal, quincenal o mensual; tramos como múltiplos del límite | **Otra: progresiva según la deuda**, con tramos múltiplos del límite (7 / 3 / 1 días). Sin envío inmediato al cambiar de tramo (supuesto comunicado, sin objeción) | PREG-042 |
| DEC-043 | Ubicación del historial | UX | Resumen en Saldos + página `/historial`; pestañas en Saldos; páginas `/historial` y `/aportaciones` | Resumen + página | Resumen + página. Solo la fila propia es pulsable (supuesto comunicado, sin objeción) | PREG-043 |
| DEC-044 | Pantallas de administración del paquete de diseño (FUENTE-09) | UX | Verlas funcionando; aprobarlas como base; repasarlas una a una | Verlas funcionando | Aprobarlas como base | PREG-044 |
| DEC-045 | Nombre de la aplicación | Producto | — | — | «beCafé» (RT-011) | ORIG-003, PREG-047 |
| DEC-046 | Premio por rellenar el agua | Negocio | Reconocimiento; insignias; café gratis cada N rellenos; abono por relleno | Reconocimiento | Reconocimiento (ranking y aguador del mes) | PREG-045 |
| DEC-047 | Control de rellenos falsos | Negocio | Intervalo mínimo; cafés mínimos entre rellenos; confianza y transparencia | Intervalo mínimo | Intervalo mínimo | PREG-045 |
| DEC-048 | Alcance de las tareas de la cafetera | Negocio | Solo agua; agua y cajón; tareas configurables | — | Solo agua | PREG-045 |
| DEC-049 | Visibilidad de los rellenos | Privacidad | Todos; solo el podio; privado | Todos | Todos | PREG-045 |
| DEC-050 | Gesto de registro del relleno | UX | Botón en Inicio + «Deshacer»; con confirmación; también sin conexión | Botón + «Deshacer» | Botón + «Deshacer», con conexión | PREG-046 |
| DEC-051 | Intervalo mínimo entre rellenos | Negocio | Configurable (60 min); fijo 30 min; fijo 2 h | Configurable | Configurable, 60 min por defecto | PREG-046 |
| DEC-052 | Ayuda para saber cuándo rellenar | UX | Solo «último relleno»; estimación por cafés; estimación + push | Solo «último relleno» | Solo «último relleno» | PREG-046 |
| DEC-053 | Aguador del mes | Negocio | Mes natural con empate compartido; desempate por orden; solo ranking | Empate compartido | Empate compartido | PREG-046 |
| DEC-054 | Interpretación del CAMBIO-004 y sus supuestos: nombre solo de la aplicación; anulación como los consumos; registro no económico; rellenos propios en las estadísticas personales; sin título si no hay rellenos; tratamiento de las bajas | Varios | — | — | Aceptada («si») | PREG-047 |
| DEC-055 | Ubicación de la aplicación | Arquitectura | En la raíz; dentro de `design-system/`; monorepo con workspaces | En la raíz | En la raíz: la plantilla se mueve con `git mv` en la preparación de F1. Módulos y dependencias en `ARCHITECTURE.md` ([ADR-0002](docs/adr/0002-aplicacion-unica-modulos.md)) | Sesión de gobernanza, 21-10-2026 |
| DEC-056 | Sistema operativo de desarrollo | Operación | Windows y Linux; solo Linux; solo Windows | Ambos | Windows y Linux: scripts npm portables escritos en Node | Sesión de gobernanza, 21-10-2026 |
| DEC-057 | Versión del framework (HALL-012) | Arquitectura | SvelteKit 3; SvelteKit 2; decidir en el plan de F1 | SvelteKit 3 | SvelteKit 3 ([ADR-0001](docs/adr/0001-sveltekit-3.md)) | Sesión de gobernanza, 21-10-2026 |
| DEC-058 | División en funcionalidades | Planificación | Aprobar con ajustes; aprobar tal cual; otra división | Con ajustes | Con ajustes: recuentos y baja con liquidación pasan a F4; F1 crea el almacén de configuración e incluye la preparación (scaffold); orden F1 → F2 → F4 → F3 → F6 → F5 → F8, F7 antes de producción (§15) | Sesión de gobernanza, 21-10-2026 |
| DEC-059 | Trabajo en paralelo | Organización | Una persona con agentes en serie; agentes en paralelo; varias personas | En serie | Una persona con agentes en serie; sin reglas de coordinación de trabajo paralelo | Sesión de gobernanza, 21-10-2026 |
| DEC-060 | Integración continua | Calidad | GitHub Actions en PR y `main`; solo local; más adelante | GitHub Actions | GitHub Actions en cada PR y en cada push a `main` con `npm run verify`; se crea en la preparación de F1 | Sesión de gobernanza, 21-10-2026 |
| DEC-061 | Versión de Node | Arquitectura | Node 24 LTS; Node 26 (aún no LTS); Node 22 LTS | Node 24 LTS | Node 24 LTS en desarrollo, CI e imagen Docker. El paso a Node 26 se decide con un ADR cuando sea LTS | Sesión de tecnologías, 21-10-2026 |
| DEC-062 | Acceso a SQLite | Arquitectura | Drizzle 0.45 + `better-sqlite3`; Drizzle 1.0 RC + `node:sqlite`; `node:sqlite` sin ORM | Drizzle 0.45 + `better-sqlite3` | Drizzle 0.45 + `better-sqlite3`. Migrar a Drizzle 1.0 cuando sea estable exige un ADR | Sesión de tecnologías, 21-10-2026 |
| DEC-063 | Hash de contraseñas | Seguridad | `@node-rs/argon2`; `crypto.argon2` nativo de Node | `@node-rs/argon2` | `@node-rs/argon2`: formato PHC estándar y ningún código criptográfico propio | Sesión de tecnologías, 21-10-2026 |
| DEC-064 | Librería de Web Push | Arquitectura | `web-push` aislada; `@block65/webcrypto-web-push`; implementación propia | `web-push` aislada | `web-push`, importada solo desde un archivo de `notificaciones`; `npm audit` en la CI vigila sus vulnerabilidades | Sesión de tecnologías, 21-10-2026 |
| DEC-065 | Cliente S3 | Arquitectura | `aws4fetch`; `@aws-sdk/client-s3` | `aws4fetch` | `aws4fetch`. Sustituye la propuesta de `@aws-sdk/client-s3` | Sesión de tecnologías, 21-10-2026 |
| DEC-066 | Librería de esquemas | Arquitectura | Zod 4; Valibot | Zod 4 | Zod 4. La política de uso la fija el prompt de Zod | Sesión de tecnologías, 21-10-2026 |
| DEC-067 | Registro estructurado | Operación | pino; registro propio mínimo; decidir en el prompt de logging | pino | pino. Niveles y eventos: prompt de logging | Sesión de tecnologías, 21-10-2026 |
| DEC-068 | Formato de identificadores | Datos | ULID; UUID v4 nativo; UUID v7 | ULID | ULID (`ulid`) para claves primarias y para `clienteId` | Sesión de tecnologías, 21-10-2026 |
| DEC-069 | Resto de tecnologías | Arquitectura | Confirmar el bloque; cambiar piezas | Confirmar | Confirmados `sharp`, `croner`, `idb`, service worker nativo, `tar`, Vitest, `fast-check`, Playwright, axe, ESLint y plugins, Prettier y plugins, dependency-cruiser y `pino-pretty`. Gestor de paquetes npm (supuesto comunicado, sin objeción) | Sesión de tecnologías, 21-10-2026 |
| DEC-070 | Versiones en la constitución | Gobierno | Línea mayor; versión exacta; solo nombres | Línea mayor | La constitución fija la línea de versión obligatoria (la menor en paquetes `0.x`); las exactas, `package-lock.json` y §10.3. Cambiar de línea exige ADR y enmienda | Constitución 1.1.0, 21-10-2026 |
| DEC-071 | Cobertura mínima de pruebas | Calidad | 80 % global + 90 % en núcleo; 80 % global; 90 % global; sin umbral | 80 % + 90 % | 80 % de líneas y ramas en `src/lib/server` y `src/lib/shared`; 90 % en `economia` y en `dominio/`. Fuente vigente: constitución, principio VIII | Constitución 1.1.0, 21-10-2026 |
| DEC-072 | Orden de prioridad entre principios | Gobierno | Integridad > Seguridad > Accesibilidad > Rapidez > Simplicidad; rapidez antes que accesibilidad; otro | El primero | Integridad económica > seguridad y privacidad > accesibilidad > rapidez del registro > simplicidad > estética. Fuente vigente: constitución | Constitución 1.1.0, 21-10-2026 |
| DEC-073 | Política de advertencias | Calidad | Cero advertencias; visibles no bloqueantes; solo algunas bloquean | Cero advertencias | Una advertencia de `svelte-check`, ESLint o el compilador rompe la verificación (`--fail-on-warnings`, `--max-warnings 0`). Fuente vigente: constitución, principio IX | Sesión de validación, 21-10-2026 |
| DEC-074 | Tipo de fecha en el código | Datos | Cadenas ISO tipadas; Temporal con polyfill; date-fns | Cadenas ISO tipadas | `InstanteUtc`, `FechaMadrid` y `Mes` en `lib/shared/fechas`, con `Intl`; sin `Date` en contratos ni en `dominio/`. Fuente vigente: `ARCHITECTURE.md` §6.1 | Sesión de validación, 21-10-2026 |
| DEC-075 | Mensajes de validación | UX | Propios + español de Zod de reserva; solo español de Zod; solo propios | Propios + reserva | Mensaje propio en ETS por campo visible; `z.config(es())` como reserva; sin el valor recibido ni detalles internos. Fuente vigente: `ARCHITECTURE.md` §6.1 | Sesión de validación, 21-10-2026 |
| DEC-076 | Destino de los logs | Operación | Fichero solo en desarrollo; fichero también en producción; solo consola | Fichero solo en desarrollo | **Otra: fichero también en producción.** Salida estándar (Coolify) y fichero JSON en `logs/` del directorio de datos, en desarrollo y en producción. Consola legible con `pino-pretty` en desarrollo | Sesión de logging, 21-10-2026 |
| DEC-077 | Rotación y retención de los ficheros | Operación | `pino-roll`; rotación propia con `croner`; sin rotar. 14, 30 o 90 días | `pino-roll`, 30 días | `pino-roll` 4.x, un fichero al día, 30 días (cubre un cierre de mes completo). ADR-0004 | Sesión de logging, 21-10-2026 |
| DEC-078 | Logs en la copia de seguridad | Operación | No incluirlos; incluirlos | No incluirlos | La copia de RF-140 lleva solo la base de datos y las fotos | Sesión de logging, 21-10-2026 |
| DEC-079 | Registro en el cliente | Arquitectura | `loglevel` solo en la consola; `loglevel` con envío al servidor de warn y error; enviar todos los niveles; sin librería | Envío de warn y error | `loglevel` 1.x sin guardar el nivel en el navegador; los eventos warn y error del catálogo se envían a `/api/registro-cliente` (ruta ajustada por DEC-100; con sesión, validado con Zod, con límites de tamaño y frecuencia: PEND-034) | Sesión de logging, 21-10-2026 |
| DEC-080 | Nivel de registro | Operación | info/debug/silent; warn en producción; debug en producción | info/debug/silent | `LOG_LEVEL` opcional (niveles de pino), `info` por defecto; `debug` en `.env.example` para desarrollo; `silent` y registrador falso en las pruebas | Sesión de logging, 21-10-2026 |
| DEC-081 | Enlace del primer administrador (RF-139) | Seguridad | Solo en la salida estándar; también en el fichero | Solo en la salida estándar | El enlace va solo a la salida estándar; el fichero guarda el evento sin el enlace | Sesión de logging, 21-10-2026 |
| DEC-082 | Acceso a los logs | Seguridad | Solo quien administra Coolify; también desde la aplicación | Solo Coolify | Vista de logs de Coolify o `/data/logs` desde la terminal del contenedor; sin pantalla en la aplicación | Sesión de logging, 21-10-2026 |
| DEC-083 | Ubicación de la lógica que llaman las rutas | Arquitectura | `src/lib/server/<modulo>/`; `src/lib/services`; `src/lib/server/services` | `src/lib/server/<modulo>/` | Las rutas son controladores finos; la lógica sigue en los módulos de servidor (principio III, ADR-0002) | Sesión de SvelteKit, 21-10-2026 |
| DEC-084 | Mejora progresiva | Arquitectura | Todo formulario con excepciones cerradas; solo estructura sin probar; todo sin JavaScript | Todo formulario con excepciones | Toda acción con formulario funciona sin JavaScript si hay conexión. Excepciones: cola sin conexión, cuenta atrás de «Deshacer» (sin JavaScript, botón sin temporizador), push, service worker e instalación de la PWA. Playwright sin JavaScript en acceso, consumo, aportación y compra | Sesión de SvelteKit, 21-10-2026 |
| DEC-085 | Respuesta de `fail()` | UX | Errores y valores sin secretos; solo errores | Errores y valores | `fail(estado, { errores, valores })`, sin contraseñas, tokens ni archivos en `valores` (WCAG 3.3.7). `error()` para 403 y 404; `redirect()` tras un éxito que cambia de pantalla | Sesión de SvelteKit, 21-10-2026 |
| DEC-086 | Reglas idiomáticas con rango constitucional | Arquitectura | Autorización en cada punto; sin estado compartido entre peticiones; runes y tipos generados; SSR por defecto y recarga con `load` | Las cuatro | Las cuatro pasan al principio XVII; el detalle está en `ARCHITECTURE.md` §7 | Sesión de SvelteKit, 21-10-2026 |
| DEC-087 | Aplicación de las enmiendas | Gobierno | Una sola (1.3.0); dos seguidas (1.3.0 y 1.4.0) | Una sola | **Otra: dos seguidas.** Registro técnico en 1.3.0 (CAMBIO-009) y SvelteKit en 1.4.0 (CAMBIO-010) | Sesión de SvelteKit, 21-10-2026 |
| DEC-088 | Cuándo se ejecuta la verificación completa | Calidad | Por impacto + puertas; `verify` completo por tarea; `verify` por lote y E2E en puertas | Por impacto + puertas | Tarea o lote: solo lo afectado (`docs/pruebas.md` §17). Puerta de funcionalidad: verificación completa en serie con `scripts/benchmark.*`. CI: completa en cada push y PR. Constitución 1.5.0 (IX), ADR-0005 | Sesión de pruebas, 21-10-2026 |
| DEC-089 | Pruebas de componentes | Calidad | Browser Mode condicional; solo E2E; jsdom + Testing Library | Browser Mode condicional | Vitest Browser Mode con `@vitest/browser-playwright` y `vitest-browser-svelte`, solo para componentes reutilizables con estado o interacción propia | Sesión de pruebas, 21-10-2026 |
| DEC-090 | Navegadores y viewports | Calidad | 2 móviles + 1 escritorio; solo 2 móviles; añadir Firefox | 2 móviles + 1 escritorio | Proyectos `chromium-movil` (diario), `webkit-movil`, `chromium-escritorio`, además de `sin-js` y `api` | Sesión de pruebas, 21-10-2026 |
| DEC-091 | Regresión visual | Calidad | Pocas capturas en puertas; sin regresión visual; capturas amplias | Pocas capturas | `toHaveScreenshot` en `chromium-movil`: pantalla principal (claro y oscuro), aviso con «Deshacer», compra con error y panel de avisos; referencias generadas en Linux | Sesión de pruebas, 21-10-2026 |
| DEC-092 | Pruebas de mutación | Calidad | Piloto en `dominio/` sin umbral; aplazar; obligatorio con umbral | Piloto sin umbral | StrykerJS sobre `dominio/` y los tramos de RN-074; línea base al cerrar F4; sin umbral hasta tenerla | Sesión de pruebas, 21-10-2026 |
| DEC-093 | Integración continua | Calidad | `verify` + matriz E2E en cada push; `verify` en push y E2E programado; todo en cada push | `verify` + matriz E2E | Cada push a `main` y PR: `verify` y E2E de los cinco proyectos con visual. Semanal: mutación y `npm audit` | Sesión de pruebas, 21-10-2026 |
| DEC-094 | Destino de la estrategia de pruebas | Gobierno | `docs/pruebas.md`; `ARCHITECTURE.md` §10; `historias.md` | `docs/pruebas.md` | `docs/pruebas.md`, enlazado desde `ARCHITECTURE.md` §10 y `CLAUDE.md` §5 a §7 | Sesión de pruebas, 21-10-2026 |
| DEC-095 | Ajuste propio para reducir la transparencia | UX | Ajuste en Perfil; solo la preferencia del sistema; opaco por defecto | Ajuste en Perfil | Interruptor «Reducir transparencia» en Perfil, desactivado por defecto, guardado en el dispositivo (RF-181). Constitución 1.6.0 (V, XVIII) | Sesión de UX, 21-10-2026 |
| DEC-096 | Objetivos de rendimiento y presupuesto de efectos | UX | Core Web Vitals + móvil de referencia; solo RNF-002; objetivos más estrictos | Core Web Vitals | **Otra: solo RNF-002.** Sin objetivos de carga ni presupuesto de efectos. Excepción aceptada a la regla del prompt de UX que pide medir el coste del material; mitigación: RF-181 y la preferencia del sistema; riesgo residual en §13.3 | Sesión de UX, 21-10-2026 |
| DEC-097 | Pruebas de usabilidad con personas | UX | Prueba breve tras F3; sin pruebas formales; prototipo ahora | Prueba breve tras F3 | **Otra: sin pruebas formales.** Hipótesis registrada: el diseño Latte es usable sin validar; riesgo residual en §13.3 | Sesión de UX, 21-10-2026 |
| DEC-098 | Copia de la especificación en el sistema de diseño | Gobierno | Sustituir ya por un enlace; hacerlo en el scaffold; mantenerla como histórica | Sustituir ya | Se borra `design-system/docs/spec/historias.md` (v0.4.0) y sus referencias apuntan a `historias.md` (principio I) | Sesión de UX, 21-10-2026 |
| DEC-099 | Etiqueta y persistencia del tema | UX | — (convención existente del sistema de diseño) | — | Etiqueta «Automático» con el comportamiento de «Sistema»; preferencia guardada en el dispositivo (principio V) | Sesión de UX, 21-10-2026 (supuesto comunicado) |
| DEC-100 | Versión en la ruta de los endpoints JSON | Arquitectura | `/api/…` sin versión; `/api/v1/…` en todos | `/api/…` sin versión | `/api/…` sin versión. El único cliente es la propia PWA; la compatibilidad con consumos en cola la da el campo de versión de cada contrato (principio XIV). Corrige el prefijo `/v1` que aparecía en `ARCHITECTURE.md`, `docs/pruebas.md`, ADR-0004 y DEC-079 sin decisión (HALL-014) | Revisión de prompts, 21-10-2026 |
| DEC-101 | Sistemas de desarrollo | Operación | Solo Linux; también Windows | Según el uso real | **También Windows.** Comandos y scripts portables; script de exclusiones de Defender que ejecuta una persona administradora; benchmark por sistema (`docs/pruebas.md` §17.5) | Revisión de prompts, 21-10-2026 |
| DEC-102 | Buscadores e indexación | Seguridad | No aplica e impedir indexación; no aplica sin medidas | Impedir indexación | El paquete SEO/AEO/GEO no aplica: no hay contenido público. Se impide la indexación (RNF-016) | Revisión de prompts, 21-10-2026 |
| DEC-103 | Alcance de F1 al especificarla | Alcance | Seguir la fila F1 literal; añadir RF-137, RF-138, RNF-014, auditoría y RN-055; llevar también RF-135 a F1 | Añadir y mantener RF-135 en F4 | F1 incluye RF-137, RF-138, RF-139c, RN-055 y RNF-014 (registro técnico y endpoint de salud, como parte de la preparación). RF-135 sigue en F4 | Especificación de F1, 21-10-2026 |
| DEC-104 | Arranque sin usuarios y sin `ADMIN_INICIAL_EMAIL` | Operación | No arranca; arranca sin administrador; aplazar | No arranca | No arranca y registra el nombre de la variable, sin valores (constitución VI y XVI). Con usuarios existentes, la variable no se usa | Especificación de F1, 21-10-2026 |
| DEC-105 | Mascota y personalidad | UX | Sin mascota; mascota neutra; mascota traviesa y bromista gobernada | Traviesa y bromista gobernada | **Capsulito**, con personalidad traviesa y bromista (humor de café e informática) en acciones cotidianas y celebraciones, pero 100 % seria y sin chistes en deudas personales, rechazos o seguridad. Nunca sustituye al mensaje funcional ni bloquea operaciones | Sesión de diseño, 23/24-10-2026 |
| DEC-106 | Formato y motor de la mascota | Arquitectura / UX | Solo WebP; solo SVG; Rive (`.riv`) + SVG por capas y WebP como reserva | Rive + SVG/WebP | Archivos `.riv` compilados con máquina de estados (`Movimiento` y `Boca` 0..7) reproducidos con `@rive-app/canvas` (aislada en `lib/client/rive.ts`), con los 56 SVG vectoriales por capas (`21 <g id>`) y WebP como alternativa estática inmediata (SSR, sin JS, fallo o `prefers-reduced-motion`) | Sesión de diseño, 24-10-2026 |
| DEC-107 | Dónde aparece la mascota y control de repetición | UX | Solo en celebraciones raras; en todas las operaciones con control de saturación | En todas con control de saturación | Sistema declarativo de reacciones (estilo Duolingo): acompaña también consumos, anulaciones y rellenos en el aviso flotante sin tapar «Deshacer», variando entre frases y suprimiendo repeticiones en toques consecutivos; más estados vacíos, errores, avisos, bienvenida y laboratorio (`/ayuda/capsulito`) (RF-186) | Sesión de diseño, 24-10-2026 |
| DEC-108 | Escritorio y navegación adaptable | UX | Panel en 2 columnas; columna ancha y panel lateral; escritorio secundario | Panel en 2 columnas | Navegación en 3 tramos (barra inferior `< 768 px`, carril de iconos `768–1023 px`, barra lateral `≥ 1024 px`) y panel en 2 columnas desde `1024 px` (RF-182, RF-183) | Sesión de diseño, 24-10-2026 |
| DEC-109 | Imagen del tipo de cápsula | UX | Ilustración con el color; foto del administrador; foto con ilustración como reserva | Foto con ilustración de reserva | **Foto del administrador**, con la ilustración vectorial en su color (`CapsuleIllustration`) como reserva (RF-185) | Sesión de diseño, 24-10-2026 |
| DEC-110 | Preferencias de la mascota y bienvenida | UX | Guardar en BD por cuenta; guardar en el dispositivo (`localStorage`) | En el dispositivo | Guardadas en el dispositivo (`becafe-mascota`, `becafe-voz`, `becafe-bienvenida`), validadas con Zod igual que Tema y Reducir transparencia (DEC-095, DEC-099; principio V) | Sesión de diseño, 24-10-2026 |
| DEC-111 | Orden de Inicio en móvil | UX | Cápsulas arriba; mantener el agua antes que las cápsulas | Cápsulas arriba | Cápsulas justo después del resumen de dinero (`AlertsPanel`) para ver la primera fila sin desplazarse en `390 × 844 px` (RF-184) | Sesión de diseño, 24-10-2026 |
| DEC-112 | Historia de bienvenida y laboratorio | UX / Arquitectura | 4 pasos simples; historia animada de 8 escenas con invitación opcional + laboratorio en `/ayuda/capsulito` | 8 escenas + laboratorio | Invitación opcional en el primer acceso a un slideshow animado de 8 escenas con humor; versión fija accesible sin JavaScript en `/ayuda` y laboratorio de demostración en `/ayuda/capsulito` para cualquier miembro autenticado (RF-188) | Sesión de diseño, 24-10-2026 |
| DEC-113 | Cristal en las tarjetas de cápsula y en el bocadillo | Gobierno | Respetar la constitución XVIII; enmendarla | Enmendar XVIII | **Enmendar XVIII**: se permite cristal en las tarjetas de cápsula de Inicio (`CapsuleTile`) y en el bocadillo/aviso de Capsulito, con alternativa opaca (RF-181) y contraste comprobado. Formularios y demás listas siguen sobre superficie estable | Sesión de diseño, 24-10-2026 |
| DEC-114 | Gamificación | Negocio | Hitos personales, racha de cuentas al día y reto de equipo; insignias por rellenar el agua; aplazar | Aplazar | **Aplazada**: se registra como PEND-037 para decidirla después de F9 en una funcionalidad futura (F10). EXC-012 sigue vigente | Sesión de diseño, 24-10-2026 |
| DEC-115 | Voz sintetizada (TTS) y sincronización labial | UX / Operaciones | Sin voz; voz MP3 pregenerada con ElevenLabs + `lip-sync` sobre la propiedad `mouth` (`0..7`) de Rive | Voz MP3 + `lip-sync` | Script de desarrollo (`scripts/generar-voces.mjs`) que genera con ElevenLabs (`eleven_v3`, voz `TfkjFyM0u8G2kDTCi1Qi`, endpoint `with-timestamps`) los `.mp3` estáticos y sus `.json` de visemas (`cues` 1..7) diferenciando `texto` (visible) y `textoVoz` (con etiquetas expresivas). La clave vive solo en `.env` local | Sesión de diseño, 24-10-2026 |
| DEC-116 | Personas externas al departamento | Negocio | Botón abierto «Soy invitado»; enlace de visitante que caduca; QR fijo | Enlace que caduca | Enlace de visitante de 24 h que genera cualquier miembro, con nombre, aprobación de un administrador y coste asumido por la hucha (RN-086). Término «visitante», distinto de «invitado» | CAMBIO-019 |
| DEC-117 | Aportación en nombre de otra persona | Negocio | Solo propia; el administrador para otros; cualquiera para otros | El administrador para otros | El administrador para otros (RN-087) | CAMBIO-019 |
| DEC-118 | Visibilidad de las estadísticas por persona | Privacidad | Todos ven a todos; admin ve detalle y el resto global; ranking sin importes | — | Todos ven a todos (RN-061) | CAMBIO-019 |
| DEC-119 | Tono de las frases de Capsulito | Negocio | Tal cual para todos; ajuste para suavizarlas; sin tacos | Tal cual para todos | Tal cual para todos, con tacos y sin ajuste | CAMBIO-022 |
| DEC-120 | Tipos sin stock en Inicio | UX | Ocultarlos; mostrarlos y registrar con un toque; mostrarlos y pedir confirmación | Mostrar y confirmar | Mostrar atenuados con «Sin stock» y pedir confirmación (RF-217; constitución 1.8.0, principio X) | CAMBIO-022 |
| DEC-121 | Memoria de frases ya dichas | Privacidad / Arquitectura | En el navegador; en el servidor por cuenta | En el servidor | En el servidor, por cuenta (RN-088; la constitución V no permite guardarlo en el navegador) | CAMBIO-022 |
| DEC-122 | Ubicación de los ajustes personales | UX | Dentro de Perfil; en Configuración; sección «Ajustes» propia | Sección «Ajustes» | Sección «Ajustes» para todas las personas; Configuración sigue siendo de administración (RF-220) | CAMBIO-022 |
| DEC-123 | Animación de Capsulito en la entrada | UX / Arquitectura | Comprar un personaje del marketplace de Rive; construirlo con el CLI de Rive a partir de los SVG de Capsulito | Construirlo con el CLI | Construido por el agente con el CLI de Rive, revisado con capturas por la persona usuaria antes de integrarlo (RF-225) | CAMBIO-022 |
| DEC-124 | Forma de la celebración al registrar | UX | Ventana que se cierra sola; animación sobre la tarjeta; solo sonido | Sobre la tarjeta | Confeti sobre la tarjeta y sonido corto, sin ventana ni bloqueo (RF-243) | CAMBIO-024 |
| DEC-125 | Control del sonido de celebración | UX | Interruptor de voz; interruptor propio; siempre | Interruptor de voz | Sigue el interruptor de voz de Capsulito (RF-244) | CAMBIO-024 |
| DEC-126 | Orden de las cápsulas en Inicio | UX | Departamento 30 días; propio 30 días; departamento histórico | Departamento 30 días | Propio 30 días; sin consumos, el del departamento; a igualdad, alfabético (RN-090) | CAMBIO-024 |
| DEC-127 | Corrección del stock a ojo | Negocio | Recuento existente; ajuste sin reparto; ajuste por cualquier miembro | Recuento existente | Recuento existente (RN-016) con aviso para todas las personas (RF-246) | CAMBIO-024 |
| DEC-128 | Elección de los gestos de reposo | UX / Gobierno | Orden fijo según el tiempo en reposo; azar con enmienda de la constitución; azar dentro del estado | Orden fijo | Orden fijo de impaciencia creciente, sin enmienda del principio XVIII (RF-248). Instantes vigentes en RF-259 (DEC-133) | CAMBIO-024, CAMBIO-026 |
| DEC-129 | Cuándo y dónde se muestra el corto | UX | Siempre; una vez por dispositivo; solo en la entrada | Una vez por dispositivo | Antes de la bienvenida, en la entrada, el enlace de visitante y los enlaces de alta o recuperación, con la marca de bienvenida vista y «Ver el corto otra vez» en Ajustes y Ayuda (RF-249, RF-250). La persona usuaria eligió la portada con «Ver el corto» y no reproducirlo solo | CAMBIO-025 |
| DEC-130 | Visibilidad de «Saltar» | UX / Gobierno | Oculto y pequeño; secundario y visible; sin «Saltar» | Secundario y visible | «Saltar» queda pequeño y secundario, pero visible y con el contraste y el tamaño exigidos (RF-252). La persona usuaria pidió que fuera pequeño y poco visible; la constitución X prohíbe las opciones ocultas, y la alternativa compatible se aprobó el 26-10-2026 | CAMBIO-025 |
| DEC-131 | Cómo restaurar una copia | Operación / Seguridad | Comando de servidor; botón en la aplicación; solo aclarar la pantalla | Comando de servidor | Botón en la aplicación con lista del bucket, efecto, contraseña, copia de resguardo y comprobación previa (RF-253 a RF-256). La persona usuaria descartó el comando de servidor | CAMBIO-026 |
| DEC-132 | Cuándo se reordena Inicio | UX | Al momento; tras la animación; al volver a entrar | Al volver a entrar | Al volver a entrar o recargar; durante la visita el orden no cambia (RF-258) | CAMBIO-026 |
| DEC-133 | Gestos de reposo y su ritmo | UX | Sustituir el reloj; cinco gestos; ritmo de 6 a 21 s; ritmo de 4 a 26 s | Sustituir el reloj | Cinco gestos (bostezo con la mano, tocar el reloj y bostezo estirándose) en 4; 9,5; 15; 20,5 y 26 s, ciclo de 29 s (RF-259). La persona usuaria pidió unos 22 s del primero al último | CAMBIO-026 |
| DEC-134 | Subtítulos y presentación del corto | UX | Grabados; de la aplicación; marco con título; pantalla completa | Grabados y pantalla completa | Solo los subtítulos grabados y vídeo a pantalla completa con la portada difuminada a los lados (RF-264, RF-265) | CAMBIO-026 |
| DEC-135 | Mensaje fijo del bocadillo de Inicio | UX | Igual; más variantes; mensaje del día por persona | Mensaje del día por persona | Uno por persona y día, sin repetir, guardado en el servidor, solo texto y sin gastar los días con aviso (RN-091). Los 80 saludos de RF-214 no cambian | CAMBIO-027 |
| DEC-136 | Colores de un tipo de cápsula | UX / Gobierno | Paleta fija; paleta ampliada; selector libre con contraste calculado | Selector libre con contraste calculado | 7 colores fijos sin el rosa y «Otro color» con texto y límites calculados (RF-269, RF-270), con enmienda MENOR de la constitución (X y XVIII) | CAMBIO-027 |
| DEC-137 | Dónde se recorta la foto | Técnica / Accesibilidad | En el navegador; en el servidor con la zona elegida | En el servidor | El navegador envía la foto original y la zona; el servidor recorta y, sin JavaScript, usa el cuadrado central (RF-274) | CAMBIO-027 |
| DEC-138 | Aspecto de la pantalla de copias | UX | Fondo según función; tarjetas con icono; dos columnas | Fondo según función | Fondo y icono por sección, con la restauración como zona de advertencia (RF-275) | CAMBIO-027 |
| DEC-139 | Registro de quién instala la aplicación | Privacidad / UX | Por dispositivo; por persona; sin registro | Por persona | Estado por persona (`instalada` o `rechazada`), visible solo a administradores en la ficha de Usuarios, sin resumen agregado (RF-278, RF-281) | CAMBIO-028 |
| DEC-140 | Descarga de copias y origen en la clave | Operación / Seguridad | Descarga por `+server.ts` o por otra vía; origen en metadatos, manifiesto o clave | `+server.ts` GET solo para administradores, con auditoría; origen y tipo en la clave del objeto | Una descarga devuelve un archivo y no cabe en una *action*; la clave da origen y tipo sin consultas extra (RF-284, RF-289) | CAMBIO-029 |

---

## 12. Matriz de trazabilidad y conservación del contenido original

### 12.1 Trazabilidad

| Origen | Necesidad | Historias | Reglas | Requisitos | Decisiones |
| --- | --- | --- | --- | --- | --- |
| ORIG-001 «inventario… stock» | NEC-001 | HU-01, HU-06, HU-12 | RN-070 | RF-010 a RF-019, RF-040, RF-090 | DEC-017, DEC-018, DEC-024 |
| ORIG-001 «cuándo comprar» | NEC-002 | HU-08, HU-09 | RN-071 a RN-073 | RF-020 a RF-023, RF-100 a RF-107 | DEC-019, DEC-020, DEC-021 |
| ORIG-001 «entra con su cuenta» | NEC-006 | HU-13 | RN-040 a RN-052 | RF-130 a RF-139b | DEC-014 a DEC-016, DEC-031, DEC-032 |
| ORIG-001 «dar de alta cápsulas» | NEC-006 | HU-11 | — | RF-001 a RF-005 | DEC-026 |
| ORIG-001 «actualizar el stock» | NEC-001 | HU-06, HU-12 | RN-016 | RF-040 a RF-046, RF-090 a RF-093 | DEC-018 |
| ORIG-001 «gestionar los usuarios» | NEC-006 | HU-13 | RN-043 a RN-046 | RF-130 a RF-139b | DEC-013, DEC-016 |
| ORIG-001 «PWA, SvelteKit, mobile first, Tailwind» | — | — | — | RT-001, RT-002, RNF-013 | DEC-025, DEC-027 |
| ORIG-002 «quién ha pagado» | NEC-004 | HU-06 | RN-009 | RF-042 | DEC-007, DEC-008 |
| ORIG-002 «quién debe al bote» | NEC-003, NEC-004 | HU-05, HU-07 | RN-001 a RN-019 | RF-030 a RF-032, RF-080 a RF-082, RF-110 a RF-112 | DEC-002 a DEC-013 |
| ORIG-002 «estadísticas por persona» | NEC-005 | HU-10 | RN-060, RN-061 | RF-120 a RF-123 | DEC-022, DEC-023 |
| Decisiones de operación | NEC-007 | HU-16 | — | RF-140 a RF-144 | DEC-028, DEC-029 |
| Decisiones de privacidad | NEC-007 | — | RN-046, RN-060, RN-061 | RF-160, RF-161 | DEC-022, DEC-033, DEC-040 |
| ORIG-003 «se va a llamar beCafé» | — | — | — | RT-011 | DEC-045 |
| ORIG-003 «quién llena de agua la cafetera… premiado… estadísticas» | NEC-008 | HU-17 | RN-063, RN-080 a RN-085 | RF-170 a RF-176, RF-104 | DEC-046 a DEC-054 |
| Revisión del paquete de diseño | NEC-004, NEC-006 | HU-07, HU-09, HU-11 a HU-16 | RN-074 | RF-111, RF-112, RF-150 | DEC-042 a DEC-044 |
| Decisiones de registro técnico | — (operación) | — | — | RF-139, RNF-014 | DEC-076 a DEC-082 |
| Decisiones de experiencia de usuario | — (RT-001, RT-008) | — | — | RF-180, RF-181, RNF-015 | DEC-095 a DEC-099 |
| Decisión de indexación | — (seguridad) | — | — | RNF-016 | DEC-102 |
| Especificación de F1 | NEC-006, NEC-007 | HU-13 | RN-055 | RF-137, RF-138, RF-139c, RNF-014 | DEC-103, DEC-104 |
| Experiencia visual, navegación y mascota Capsulito (F9) | NEC-001 a NEC-008 | HU-01 a HU-17 | — | RF-182 a RF-188 | DEC-105 a DEC-115 |

### 12.2 Conservación del contenido original

| Fragmento original | Destino |
| --- | --- |
| «cafetera de cápsulas… para todos los miembros de informática» | Actores ACT-01/02, EXC-010 |
| «aplicación para el móvil en formato PWA, quizá SvelteKit, mobile first, tailwindcss» | RT-001, RT-002 (pendiente PEND-022) |
| «inventario de las cápsulas que tenemos y nos quedan» | NEC-001 |
| «seleccionar qué cápsula ha utilizado» | HU-01, RF-011 |
| «cuándo tenemos que ir a comprar» | NEC-002, HU-08 |
| «front-end donde una persona entra con su cuenta» | RF-133, DEC-014 |
| «backend donde dar de alta cápsulas, actualizar stock, gestionar usuarios» | Glosario «Panel de administración», HU-11 a HU-15 |
| «y demás cosas que se me estén olvidando» | Descubrimiento proactivo: PREG-002 a PREG-036 |
| ORIG-002 completo | NEC-003 a NEC-005, DEC-001 |
| «la aplicación se va a llamar beCafé» | RT-011, DEC-045 |
| «seleccionar que ha añadido agua a la cafetera» | HU-17, RF-171 |
| «quién es el que llena de agua la cafetera y podamos verlo en las estadísticas» | RF-175, RN-063 |
| «tiene que ser premiado de alguna forma» | RN-084, RF-176, DEC-046 |

---

## 13. Hallazgos, pendientes y riesgos

### 13.1 Hallazgos

| ID | Hallazgo | Severidad / bloqueo | Estado |
| --- | --- | --- | --- |
| HALL-001 | Doble papel de una persona que paga y consume | Conductual | Resuelto (DEC-007) |
| HALL-002 | Consumo con stock 0 | Conductual | Resuelto (DEC-017) |
| HALL-003 | Precio de un tipo nunca comprado | Conductual | Resuelto (RN-006) |
| HALL-004 | Compra superior al saldo teórico de la hucha | Conductual | Resuelto (DEC-035) |
| HALL-005 | Anular un consumo antiguo altera el coste medio posterior | Menor | Resuelto (RN-013) |
| HALL-006 | Redondeo de repartos | Conductual | Resuelto (RN-014) |
| HALL-007 | Bloqueo sin administradores | Crítico | Resuelto (RF-139b, RN-042) |
| HALL-008 | Conservación indefinida de datos personales frente al principio de limitación del plazo | Riesgo de cumplimiento | Aceptado expresamente por el responsable del departamento (DEC-040). Texto de privacidad: PEND-014, aplazado |
| HALL-009 | Una compra puede incluir varios tipos de cápsula con precios distintos | Conductual | Resuelto (DEC-038) |
| HALL-010 | No se ha decidido cómo corregir un arqueo o recuento erróneo | Conductual | Resuelto (DEC-039) |
| HALL-011 | Un usuario dado de baja puede tener consumos en la cola local de su móvil | Conductual, menor | Resuelto (RN-054) |
| HALL-012 | El paquete de diseño (FUENTE-09) usa SvelteKit 3; el apartado 10.3 propone SvelteKit 2 | Técnico, menor | Resuelto (DEC-057, ADR-0001): SvelteKit 3 |
| HALL-013 | Un relleno de agua se puede declarar sin haberlo hecho para subir en el ranking | Conductual | Mitigado (RN-082, RN-063, RN-083) |
| HALL-014 | `ARCHITECTURE.md`, `docs/pruebas.md`, ADR-0004 y DEC-079 usaban `/api/v1/…`; §10.5 usaba `/api/…`. Ninguna decisión fijaba la versión en la ruta | Técnico, menor | Resuelto (DEC-100) |
| HALL-015 | «Registro» designaba a la vez el hecho de negocio, el log técnico y la tabla de auditoría, contra la regla de univocidad | Menor | Resuelto (glosario, §3) |
| HALL-016 | Al especificar F1: §15 no asignaba RF-137 ni RF-138 a ninguna funcionalidad; F1 dependía de RNF-014 (PEND-034 a PEND-036) sin citarlo; la auditoría de acciones de administración solo estaba en el glosario y el anexo A; ninguna regla decía qué pasa si un usuario dado de baja intenta entrar | Menor | Resuelto (DEC-103, DEC-104, RF-139c, RN-055) |
| HALL-017 | La aplicación desplegada no muestra navegación (ni barra inferior ni lateral), no tiene campana en Inicio y sustituye la navegación por una tarjeta «Mi perfil / Cerrar sesión» al final de Inicio; además, en `/perfil` faltaban el botón para cerrar la sesión actual y el enlace a Administración en móvil | Mayor | Se resuelve en F9 (RF-182) |
| HALL-018 | El paquete inicial de la mascota tenía nombres de fichero cambiados respecto a la pose y SVG autotrazados sin capas | Menor | Resuelto con las entregas `entrega-capsulito/` (56 SVG por capas con `21 <g id>`) y `capsulito-rive-v0.2.0.zip` (8 `.riv` con máquina de estados y 8 formas de boca) (DEC-106) |

### 13.2 Pendientes

| ID | Pendiente | Bloqueo | Propuesta del agente |
| --- | --- | --- | --- |
| PEND-014 | Validar el texto informativo de privacidad propuesto en el anexo A y completar sus datos entre corchetes | **Menor aplazado** (ver ficha) | Texto redactado en el anexo A |
| PEND-033 | Si un administrador anula, después del día 1, un relleno del mes anterior y eso cambia el ganador, ¿se recalcula el aguador del mes? | Menor, no bloqueante; resolver en la fase de plan de F8 | No recalcular: el título queda fijado al determinarlo (tabla `aguador_mes`) |
| PEND-034 | Límites de tamaño y de frecuencia de `/api/registro-cliente` (DEC-079, DEC-100) | Menor; resolver en el plan de F1 | — |
| PEND-035 | Cómo llegan la versión y el commit a la aplicación para el evento de arranque | Menor; resolver en el plan de F1 (desarrollo) y de F7 (imagen) | — |
| PEND-036 | Ruta del directorio de datos en desarrollo (y, con ella, la de `logs/`) | Menor; resolver en el plan de F1 | — |
| PEND-037 | Gamificación ligera (hitos personales privados, racha «cuentas al día» y reto de equipo «hucha sana», sin dinero ni premiar mayor consumo) | No bloquea F9; aplazado para una funcionalidad posterior | Especificar como funcionalidad propia tras F9 sin reabrir EXC-012 |

**Ficha de aplazamiento de PEND-014**

| Campo | Valor |
| --- | --- |
| Motivo | El responsable decide completar los datos y revisar la redacción más adelante. |
| Por qué es aplazable | El comportamiento ya está definido (RF-160, RF-161): la aplicación muestra el texto vigente y registra su lectura. El contenido del texto no cambia alcance, permisos, datos ni contratos. |
| Impacto residual | El texto contiene marcadores entre corchetes y una redacción no revisada en detalle. No debe publicarse así. |
| Responsable | Responsable del departamento de informática. |
| Condición de resolución | Antes de usar la aplicación con datos reales (despliegue en producción). |
| Aceptación | Respuesta del responsable del 20-10-2026: «Eso ahora no importa, déjalo así, pendiente… la redacción ya la revisaremos; de momento, está bien». |

**Pendientes resueltos durante la sesión** (se conservan sus IDs porque otras secciones los citan):

| ID | Tema | Resuelto en |
| --- | --- | --- |
| PEND-001 | Periodos y cierres | PREG-030 |
| PEND-002 | Pago de compras | PREG-007 |
| PEND-003 | Corrección de registros | PREG-009, PREG-010 |
| PEND-004 | Foto del ticket | PREG-036 |
| PEND-005 | Visibilidad de anulados | PREG-036 |
| PEND-006 | Plazo de autoanulación | PREG-036 |
| PEND-007 | Reactivación de usuarios | PREG-036 |
| PEND-008 | Caducidad de enlaces | PREG-036 |
| PEND-009 | Número de usuarios | PREG-037 |
| PEND-010 | Tipos nunca comprados | PREG-036 |
| PEND-011 | Estimación de días restantes | PREG-036 |
| PEND-012 | Aviso de deuda siempre activo | PREG-036 |
| PEND-013 | Límite de deuda y recordatorio | PREG-036 |
| PEND-015 | Duración del «Deshacer» | PREG-036 |
| PEND-016 | Precio de consumos enviados con retraso | PREG-036 |
| PEND-017 | Exposición a internet | PREG-037 |
| PEND-018 | Hora de la copia | PREG-036 |
| PEND-019 | Prueba de restauración | PREG-036 |
| PEND-020 | Política de sesiones de la empresa | PREG-037 (no existe; solo política de contraseñas) |
| PEND-021 | Redondeo del cargo | PREG-041 |
| PEND-022 | Stack como restricción | PREG-041 |
| PEND-023 | Motivo al deshacer | PREG-041 |
| PEND-024 | Borrado de tipos sin registros | PREG-041 |
| PEND-025 | Tamaño de foto | PREG-041 |
| PEND-026 | Aportación máxima | PREG-041 |
| PEND-027 | Compras con varios tipos | PREG-038 |
| PEND-028 | Anulación de arqueos y recuentos | PREG-039 |
| PEND-029 | Lista de bloqueo de contraseñas | PREG-041 |
| PEND-030 | Disponibilidad | PREG-041 |
| PEND-031 | Hora del resumen mensual | PREG-041 |
| PEND-032 | Consumos en cola de un usuario dado de baja | PREG-041 |

### 13.3 Riesgos residuales

| Riesgo | Mitigación |
| --- | --- |
| Cafés no registrados que reparten su coste entre todos | Gesto de un toque, cola sin conexión, recuentos con reparto |
| Aportaciones declaradas que no se hicieron | Historial visible, arqueos con reparto |
| Pérdida de consumos en cola si se borran datos del navegador | Aviso visible (RF-019) |
| Notificaciones push poco fiables en iPhone sin instalar la PWA | Panel de avisos en la app (RF-107), ayuda (RF-106) |
| Dependencia de una sola instancia y un solo servidor | Copias diarias |
| Rellenos de agua declarados sin hacerlos | Intervalo mínimo, visibilidad para todos, anulación por un administrador |
| Diseño no validado con usuarios reales (DEC-097) | Sistema de diseño Latte, revisión con VoiceOver y TalkBack, corrección tras el uso real |
| Coste del cristal en móviles modestos sin medir (DEC-096) | Ajuste «Reducir transparencia» (RF-181) y preferencia del sistema |
| La mascota o sus bromas resultan cansinas en acciones frecuentes | Control de saturación y rotación de variantes en acciones seguidas, tono serio en deudas/errores (DEC-105, DEC-107) e interruptores de mascota y voz en Perfil (RF-187) |
| Peso de los recursos de animación y voz en móviles modestos | Archivos `.riv` ligeros (15–26 KB por pose), SVG de ~10 KB como reserva inmediata, precarga selectiva en el service worker y audio cargado bajo demanda |

---

## 14. Fuentes y evidencia

| ID | Fuente | Consulta | Afirmación respaldada | Limitaciones |
| --- | --- | --- | --- | --- |
| FUENTE-01 | WebKit, «Web Push for Web Apps on iOS and iPadOS», https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ (16-02-2023) | 20-10-2026 | Web Push en iOS/iPadOS 16.4 solo para web apps añadidas a la pantalla de inicio, con permiso pedido tras una interacción del usuario | Publicado durante la beta de 16.4 |
| FUENTE-02 | NIST SP 800-63B-4, https://pages.nist.gov/800-63-4/sp800-63b.html, apartado 3.1.1.2 | 20-10-2026 | Contraseñas de un solo factor: mínimo 15 caracteres; sin reglas de composición; comprobación contra lista de bloqueo | Se leyó la primera parte del documento |
| FUENTE-03 | OWASP Password Storage Cheat Sheet, https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html | 20-10-2026 | Argon2id recomendado, mínimo m = 19 MiB, t = 2, p = 1 | Recomendación de buena práctica, no norma |
| FUENTE-04 | SQLite, «VACUUM», https://www.sqlite.org/lang_vacuum.html | 20-10-2026 | `VACUUM INTO` produce una instantánea coherente de una base viva; fsync con `synchronous` NORMAL o FULL | La página no indica la versión de introducción |
| FUENTE-05 | Coolify, «Back up storage mounts», https://coolify.io/docs/core/persistent-storage/storage-mounts/backups | 20-10-2026 | Copias de volúmenes en `.tar.gz` a S3, no coherentes si hay escrituras salvo detener contenedores, sin pasos previos documentados, sin restauración desde el panel | Documentación de la versión vigente, sin número de versión |
| FUENTE-06 | Coolify, «Database backups», https://coolify.io/docs/databases/backups | 20-10-2026 (vía búsqueda) | Las copias programadas de bases de datos se documentan para PostgreSQL gestionado por Coolify | Solo se consultó el resumen de búsqueda |
| FUENTE-07 | W3C, WCAG 2.2, https://www.w3.org/TR/WCAG22/ (Recomendación 12-12-2024) | 20-10-2026 | 1.4.3 contraste 4,5:1; 2.5.8 objetivos ≥ 24×24 px CSS; 1.4.1 uso del color; 4.1.3 mensajes de estado; 5.2.1 nota 2: no se recomienda AAA como política general | — |
| FUENTE-08 | Guía de refinamiento, `docs/Prompts/refinamiento de requisitos.md` (biblioteca local, fuera de Git), v2.0.0-candidata | 20-10-2026 | Proceso, estructura y reglas de este documento | Versión candidata |
| FUENTE-09 | Paquete de diseño «Cápsulas UI» (sistema Latte, SvelteKit 3 + Svelte 5 + Tailwind 4), `design-system/` del repositorio | 21-10-2026 | Pantallas, componentes y pantallas de administración aceptadas como base (DEC-044). Compila sin errores (`npm run check`, `npm run build`) | Traía una copia de la v0.2.0 de este documento, borrada por DEC-098; faltan pantallas y estados solicitados al diseñador el 21-10-2026 |

No se declara cumplimiento formal del RGPD, de WCAG ni de ninguna norma. Las referencias al RGPD son orientativas.

---

## 15. Preparación y transferencia a Spec Kit

**Estado: Cerrado y aprobado sobre v0.14.0.** Sin bloqueantes. PEND-034 a PEND-036 se resuelven en el plan de F1. PEND-014 está aplazado y debe figurar en la especificación de F1 como dependencia previa a producción. PEND-033 se resuelve en el plan de F8.

### División en funcionalidades (acordada, DEC-058)

| Funcionalidad | Contenido | Depende de |
| --- | --- | --- |
| F1 — Acceso, usuarios y privacidad | Preparación del proyecto (scaffold: DEC-055, DEC-056, DEC-060). RF-130 a RF-134, RF-136 a RF-139c, RF-160, RF-161, RF-180, RF-181, RNF-016, RNF-014 (registro técnico y salud, DEC-103), RN-040 a RN-055. Almacén de configuración con los parámetros de RF-150 y sus valores por defecto (sin pantalla). Especificación: `specs/001-scaffold-acceso/spec.md` | — |
| F2 — Catálogo y stock | RF-001 a RF-006, RF-020 a RF-023 | F1 |
| F4 — Economía: aportaciones, compras, coste medio, regularización, arqueos, recuentos, repartos, bajas | RF-030 a RF-046, RF-064, RF-080 a RF-082, RF-090 a RF-093, RF-135, RN-001 a RN-021, RN-036, RN-037 | F1, F2 |
| F3 — Registro de consumos (incluido sin conexión) | RF-010 a RF-019, RF-060 a RF-063 | F1, F2, F4 (cargo) |
| F6 — Saldos y estadísticas | RF-110 a RF-123 | F3, F4 |
| F5 — Notificaciones | RF-100 a RF-107 | F1 a F4 |
| F8 — Relleno de agua y aguador del mes | RF-170 a RF-176, RN-063, RN-080 a RN-085 | F1, F5 (resumen mensual), F6 (estadísticas) |
| F7 — Operación: copias, pantalla de configuración, despliegue | RF-140 a RF-144, pantalla de RF-150 | F1. Se puede hacer en cualquier punto; obligatoria antes de producción |
| F9 — Experiencia visual: navegación, escritorio y Capsulito interactivo (Rive, voz y feedback) | RF-182 a RF-188 (DEC-105 a DEC-115, HALL-017, HALL-018, EV-102). Especificación: `specs/009-experiencia-capsulito/spec.md` | F1 a F8 |
| F10 — Visitantes, compras rápidas, estadísticas del departamento y ayuda de Capsulito | RF-189 a RF-210, RN-086, RN-087 y las modificaciones de RF-030, RF-043, RF-101, RF-102, RF-121 a RF-123, RN-008, RN-061 y RF-187 (DEC-116 a DEC-118, EV-103 a EV-106). Especificación: `specs/010-visitantes-compras-ayuda/spec.md` | F1 a F9 |
| F11 — Inicio centrado en el café, Capsulito gamberro y pulido de la interfaz | RF-211 a RF-237, RN-088, RN-089 y las modificaciones de RF-011, RF-187, RF-204, RF-208, RF-209 y el anexo A (DEC-119 a DEC-123, EV-107 a EV-111). Especificación: `specs/011-inicio-cafe-capsulito/spec.md` | F1 a F10 |
| F12 — Pulido de Capsulito, celebración del café y gestión de personas y stock | RF-238 a RF-248, RN-090 y las modificaciones de RF-101, RF-188 y RF-227 (DEC-124 a DEC-128). Especificación: `specs/012-pulido-capsulito-celebracion/spec.md` | F1 a F11 |
| F13 — Corto de bienvenida «El misterio de la última cápsula» | RF-249 a RF-252 y la modificación de RF-195 (DEC-129, DEC-130). Especificación: `specs/013-corto-capsulito/spec.md` | F1 a F12 |
| F14 — Pulido de pantallas, restauración de copias y Capsulito más vivo | RF-253 a RF-265 y las modificaciones de RF-143, RF-243, RF-245, RF-248, RF-251, CA-248, CA-251 y DEC-128 (DEC-131 a DEC-134). Especificación: `specs/014-pulido-pantallas-restauracion/spec.md` | F1 a F13 |

La tabla sigue el orden de implementación acordado. Las reglas económicas (RN-001 a RN-021) son transversales a F3 y F4. Su dueño documental es F4; F3 las referencia. Las funcionalidades no coinciden con los módulos de código: una funcionalidad puede tocar varios módulos (`ARCHITECTURE.md` §3).

**Duda de comportamiento pendiente** (se resuelve con `/speckit-clarify` en F5, F7 y F8): si el servidor está detenido a la hora de una tarea programada (resumen mensual, aguador del mes, copia de las 03:00), ¿la tarea se ejecuta al arrancar?

| Contenido | Destino previsto | Estado |
| --- | --- | --- |
| Necesidades, reglas, requisitos y aceptación | `spec.md` de cada funcionalidad | F1 traspasada (`specs/001-scaffold-acceso/spec.md`, aprobada el 21-10-2026); F2 a F8 pendientes |
| Arquitectura, datos, interfaces, módulos | `plan.md` y artefactos de diseño | Pendiente de traspaso |
| Visión global, decisiones transversales, índice | Este documento | Vigente |

---

## 16. Historial de cambios y aprobaciones

| Versión | Fecha | Cambio | Aprobación |
| --- | --- | --- | --- |
| 0.1.0 | 20-10-2026 | Creación del documento (CAMBIO-001) a partir de ORIG-001, ORIG-002 y las respuestas a PREG-001 a PREG-037 | Escritura autorizada el 20-10-2026 («si»); SHA-256 4bfcb0f0…331d5b |
| 0.2.0 | 20-10-2026 | CAMBIO-002: decisiones de PREG-038 a PREG-041, requisitos de privacidad y anexo A | Escritura autorizada el 20-10-2026 («Sí, autorizo»); SHA-256 e6023953…948901; respaldo de 0.1.0 en `.respaldos/` |
| 0.3.0 | 20-10-2026 | CAMBIO-003: aplazamiento de PEND-014, CA-093 y CA-144, estado «preparado para aprobación de cierre» | Pendiente de autorización de escritura |
| Cierre | 20-10-2026 | Refinamiento cerrado y aprobado sobre v0.3.0 (SHA-256 0849f5b2…e55d602d). Aplazado: PEND-014. Riesgo aceptado: HALL-008. | Aprobado por el responsable del departamento |
| 0.4.0 | 21-10-2026 | CAMBIO-004: nombre «beCafé» (ORIG-003, RT-011); relleno de agua con ranking y aguador del mes (HU-17, RN-063, RN-080 a RN-085, RF-170 a RF-176, F8); recordatorio de deuda progresivo (RN-074, RF-150); `/historial` como página propia y supresión de `/aportaciones`; pantallas de administración del paquete de diseño aceptadas como base; anexo A actualizado | Escritura autorizada el 21-10-2026 («si»); respaldo de 0.3.0 (SHA-256 7e7769fb…7a59005) en `.respaldos/` |
| Cierre | 21-10-2026 | Refinamiento cerrado y aprobado sobre v0.4.0 (SHA-256 9cfc0165…c1cd13b4). Aplazados: PEND-014 y PEND-033. Riesgo aceptado: HALL-008. | Aprobado por el responsable del departamento («si») |
| 0.5.0 | 21-10-2026 | CAMBIO-005: gobernanza técnica. DEC-055 a DEC-060; HALL-012 resuelto (SvelteKit 3); §10.6 traspasado a `ARCHITECTURE.md`; división en funcionalidades acordada con ajustes (§15); duda sobre tareas programadas perdidas registrada para `/speckit-clarify` | Escritura autorizada el 21-10-2026 («hazlo»); respaldo de 0.4.0 (SHA-256 7f272a93…ace383186) en `.respaldos/` |
| 0.6.0 | 21-10-2026 | CAMBIO-006: tecnologías decididas con versiones de referencia (§10.3); DEC-061 a DEC-069; `aws4fetch` sustituye a `@aws-sdk/client-s3`; se añaden Zod 4, pino, `tar` y las herramientas de calidad; Node 24 LTS en el despliegue (§10.7) | Escritura autorizada el 21-10-2026 («si»); respaldo de 0.5.0 (SHA-256 468706cb…898acc61) en `.respaldos/` |
| 0.7.0 | 21-10-2026 | CAMBIO-007: `@vitest/coverage-v8` en §10.3; DEC-070 a DEC-072 (versiones por línea, cobertura mínima y orden de prioridad), cuya fuente vigente es la constitución 1.1.0 | Escritura autorizada el 21-10-2026 («si»); respaldo de 0.6.0 (SHA-256 9bc5c0e4…c03b27bd) en `.respaldos/` |
| 0.8.0 | 21-10-2026 | CAMBIO-008: política de validación y entorno. DEC-073 a DEC-075 (cero advertencias, tipos de fecha, mensajes de validación); §10.7: variables declaradas en `src/env.ts`. Constitución 1.2.0 | Escritura autorizada el 21-10-2026 («si»); respaldo de 0.7.0 (SHA-256 834feaab…af7ed59) en `.respaldos/` |
| 0.9.0 | 21-10-2026 | CAMBIO-009: registro técnico. DEC-076 a DEC-082 (ficheros diarios con `pino-roll` y 30 días, fuera de la copia; `loglevel` en el cliente con envío de warn y error; `LOG_LEVEL`; enlace de RF-139 solo en la salida estándar; acceso solo desde Coolify); §10.3, §10.7, RF-139, CA-139 y RNF-014; PEND-034 a PEND-036. Constitución 1.3.0 (principio XVI), ADR-0004 | Escritura autorizada el 21-10-2026 («sí a los 2»); respaldo de 0.8.0 (SHA-256 81848bb5…1b23e7920) en `.respaldos/` |
| 0.10.0 | 21-10-2026 | CAMBIO-010: arquitectura idiomática de SvelteKit. DEC-083 a DEC-087 (controladores finos sobre `lib/server/<modulo>`, mejora progresiva con excepciones cerradas, respuesta de `fail()`, reglas idiomáticas, dos enmiendas). Constitución 1.4.0 (principio XVII) | Escritura autorizada el 21-10-2026 («sí a los 2»); respaldo de 0.9.0 (SHA-256 2294c5a8…515a7e594) en `.respaldos/` |
| 0.11.0 | 21-10-2026 | CAMBIO-011: estrategia de pruebas. DEC-088 a DEC-094 (verificación por impacto con puertas, componentes en navegador real, matriz de Playwright, regresión visual, mutación en `dominio/`, CI, `docs/pruebas.md`); §9 y §10.3. Constitución 1.5.0 (VIII, IX y tecnologías), ADR-0005 | Escritura autorizada el 21-10-2026 («sí a todo»); respaldo de 0.10.0 (SHA-256 d470857a…9e11f21b9) en `.respaldos/` |
| 0.12.0 | 21-10-2026 | CAMBIO-012: experiencia de usuario. §7.15 (RF-180, RF-181), RNF-015, CA-180, CA-181, EV-061, DEC-095 a DEC-099, riesgos residuales en §13.3 y F1 en §15. Constitución 1.6.0 (V, X, XI y XVIII) | Escritura autorizada el 21-10-2026 («si a todo»); respaldo de 0.11.0 (SHA-256 20b5f9ab…90f794a5a) en `.respaldos/` |
| 0.13.0 | 21-10-2026 | CAMBIO-013: revisión cruzada de los prompts ejecutados. Metadatos y fuentes con las rutas del repositorio; glosario («Registro», «Registro técnico», «Registro de auditoría», «Tema Automático», «Reducir transparencia»); RNF-016 y `/robots.txt`; `/api/registro-cliente` en §10.5; DEC-100 a DEC-102; HALL-014 y HALL-015; trazabilidad de registro técnico, UX e indexación; RNF-016 en F1; reevaluación del cierre (guía de refinamiento, §19) | Escritura autorizada el 21-10-2026 («Sí, los dos»); respaldo de 0.12.0 (SHA-256 92ce24d7…aacfc88443) en `.respaldos/` |
| Cierre | 21-10-2026 | Refinamiento cerrado y aprobado sobre v0.13.0 (SHA-256 f3ec905d…7e4c7396). Reevaluados RF-139, RNF-014, RF-180, RF-181, RNF-015, RNF-016, CA-180, CA-181 y EV-061. Aplazados: PEND-014 y PEND-033. Para el plan de F1: PEND-034 a PEND-036. Riesgo aceptado: HALL-008. | Aprobado por el responsable del departamento («Sí, apruebo el cierre») |
| 0.14.0 | 21-10-2026 | CAMBIO-014: decisiones de la especificación de F1. RF-139c (auditoría de administración) y CA-139c; RN-055 (inicio de sesión de un usuario dado de baja); RF-139 y CA-139 con el arranque sin `ADMIN_INICIAL_EMAIL` (DEC-104); DEC-103 (alcance de F1: RF-137, RF-138, RF-139c, RN-055, RNF-014; RF-135 sigue en F4); HALL-016; HU-13, §12.1 y §15 | Escritura autorizada el 21-10-2026 («Tienes mi autorización para cambiar Historias.md»); respaldo de 0.13.0 (SHA-256 84aa5191…3510936f) en `.respaldos/` |
| 0.15.0 | 22-10-2026 | CAMBIO-015: separación de `tipo_capsula` en `tipo_capsula` (catálogo), `existencia` y `entrada_stock_bajo` (economía) en §10.4; datos derivados (§10.4). Decisión de F2 (plan D1). Sin cambios de requisitos ni de reglas | Escritura autorizada el 22-10-2026 («Sí, autorizo el CAMBIO-015»); respaldo de 0.14.0 (SHA-256 90822e99…) en `.respaldos/` |
| 0.16.0 | 22-10-2026 | CAMBIO-016: §10.4 de F4. Tablas `regularizacion`, `reparto` y `aviso_economia`; `linea_recuento` con `registrado` (previsto por línea) y estado de anulación por línea; unicidad por (compra, tipo) y (recuento, tipo). Sin cambios de requisitos ni de reglas | Escritura autorizada el 22-10-2026 («Sí, autorizo (Recomendado)»); respaldo de 0.15.0 en `.respaldos/` |
| 0.17.0 | 23-10-2026 | CAMBIO-017: §10.4 de F6. Tablas `entrega_push` y `ejecucion_tarea`. Sin cambios de requisitos ni de reglas | Escritura autorizada el 23-10-2026 («Sí, con respaldo (Recomendado)»); respaldo de 0.16.0 (SHA-256 f4a51ebc02cfc15f2c1f4d59e481edb7737564b7b1c366069a69e90698ba9ad4) en `.respaldos/historias-v0.16.0-20261023-120648.md` |
| Cierre | 21-10-2026 | Refinamiento cerrado y aprobado sobre v0.14.0 (SHA-256 7aeb5af7…96d70dbb). Reevaluados RF-139, CA-139, RF-139c, CA-139c y RN-055 (CAMBIO-014). Aplazados: PEND-014 y PEND-033. Para el plan de F1: PEND-034 a PEND-036. Riesgo aceptado: HALL-008. | Aprobado por el responsable del departamento («apruebo el nuevo cierre del refinamiento sobre la v0.14.0») |
| 0.18.0 | 24-10-2026 | CAMBIO-018: experiencia visual y Capsulito interactivo unificados (F9). Navegación en tres tamaños, escritorio en dos columnas (`PanelGrid`), Inicio móvil con cápsulas arriba, tarjeta de cada tipo con foto o ilustración vectorial (`CapsuleTile`, `CapsuleIllustration`), mascota Capsulito con animaciones Rive (`.riv`), 56 SVG vectoriales por capas, sincronización labial con voz MP3 de ElevenLabs, feedback contextual estilo Duolingo, historia de bienvenida de 8 escenas y laboratorio interactivo (`/ayuda/capsulito`). RF-182 a RF-188, CA-182 a CA-188, EV-102, DEC-105 a DEC-115, HALL-017, HALL-018, PEND-037, glosario, riesgos y F9. Enmienda de la constitución v1.7.0 y ADR-0006 | Escritura autorizada el 24-10-2026 («ok»); respaldo de 0.17.0 (SHA-256 d2b3d82981fb6949b17d9bfb9ced4d5248240c509db5bac1e210f72de44c63fb) en `.respaldos/historias-v0.17.0-20261024-141230.md` |
| 0.19.0 | 24-10-2026 | CAMBIO-019: visitantes, compras rápidas, estadísticas del departamento y ayuda de Capsulito (F10), traspasados desde `specs/010-visitantes-compras-ayuda/spec.md` (aprobada el 24-10-2026). Nuevos: RF-189 a RF-210, RN-086, RN-087, CA-189 a CA-210, EV-103 a EV-106, DEC-116 a DEC-118, HU-18 a HU-21, glosario («Visitante», «Café de visitante»), §7.16 y F10 en §15. Modificados: RF-030, RF-043, RF-101, RF-102, RF-121 a RF-123, RF-187, RN-008, RN-061, CA-121, CA-122, DEC-022, glosario («Aportación») y anexo A (versión 2) | Escritura autorizada el 24-10-2026 («Sí, con respaldo (Recomendado)»); respaldo de 0.18.0 (SHA-256 9bb58481d639f0f856d41a38e31a41a38a0d40eb9ec60de28f5757316ad015bf) en `.respaldos/historias-v0.18.0-20261024-223330.md` |
| 0.20.0 | 25-10-2026 | CAMBIO-020: §10.3 (`uqr`), §10.4 (tablas de visitantes, marcas de cuenta y foto) y §10.5 (rutas y acciones de F10), tal como quedaron implementadas. Sin cambios de requisitos ni de reglas | Autorizado en la sesión del 25-10-2026; respaldo de 0.19.0 en `.respaldos/historias-v0.19.0-20261025.md` |
| 0.21.0 | 25-10-2026 | CAMBIO-021: RF-190 pasa de 40 a 60 caracteres para el nombre del visitante, como implementa F10 y recoge su `data-model` | Autorizado en la sesión del 25-10-2026; respaldo de 0.20.0 en `.respaldos/historias-v0.20.0-20261025.md` |
| 0.22.0 | 25-10-2026 | CAMBIO-022: Inicio centrado en el café, Capsulito gamberro y pulido de la interfaz (F11), traspasados desde `specs/011-inicio-cafe-capsulito/spec.md` (aprobada el 25-10-2026). Nuevos: RF-211 a RF-237, RN-088, RN-089, CA-211 a CA-237, EV-107 a EV-111, DEC-119 a DEC-123 y glosario («Saludo», «Frase de registro», «Ajustes»). Modificados: RF-011, RF-187, RF-204, RF-208, RF-209, CA-209 y anexo A (versión 3: responsable, gestor y frases de Capsulito ya dichas). Constitución 1.8.0 (principios X y XVIII) | Autorizado en la sesión del 25-10-2026 («Tienes mi autorización»); respaldo de 0.21.0 (SHA-256 5f872f6d…0722f5d5fe) en `.respaldos/historias-v0.21.0-20261025.md` |
| 0.23.0 | 25-10-2026 | CAMBIO-023: §10.4 (tabla `frase_entregada`; `usuario.foto_ruta` con ilustración en vez de iniciales) y §10.5 (`/ajustes`, `/?/saludo`, `/perfil?/preferencia`) alineados con lo implementado en F11; anexo A: las preferencias de avisos están en Ajustes, no en el perfil. Sin cambios de requisitos, reglas, criterios ni decisiones | Autorizado en la sesión del 25-10-2026 (T046); respaldo de 0.22.0 en `.respaldos/historias-v0.22.0-20261025.md` |
| 0.24.0 | 26-10-2026 | CAMBIO-024: pulido de Capsulito, celebración del café y gestión de personas y stock (F12), traspasados desde `specs/012-pulido-capsulito-celebracion/spec.md` (aprobada el 26-10-2026). Nuevos: RF-238 a RF-248, RN-090, CA-238 a CA-248 y DEC-124 a DEC-128. Modificados: RF-101 (aviso de recuento), RF-188 y CA-188 (nueve escenas), RF-227 (Capsulito que habla en el tour) y glosario («Bienvenida»). Sin cambios en la constitución | Autorizado en la sesión del 26-10-2026 («Tienes mi autorización para el CAMBIO-024»); respaldo de 0.23.0 (SHA-256 7223bc2d…7d4b99) en `.respaldos/historias-v0.23.0-20261026.md` |
| 0.25.0 | 26-10-2026 | CAMBIO-025: corto de bienvenida «El misterio de la última cápsula» antes de la entrada (F13), traspasado desde `specs/013-corto-capsulito/spec.md` (aprobada el 26-10-2026). Nuevos: RF-249 a RF-252, CA-249 a CA-252, DEC-129 y DEC-130 y glosario («Corto»). Modificados: RF-195 (el corto va antes de la bienvenida) y glosario («Bienvenida»). Sin cambios en la constitución | Autorizado en la sesión del 26-10-2026 («autorizo el CAMBIO-025 en historias.md»); respaldo de 0.24.0 (SHA-256 952482d3…dbb4e9) en `.respaldos/historias-v0.24.0-20261026.md` |
| 0.26.0 | 26-10-2026 | CAMBIO-026: pulido de pantallas, restauración de copias y Capsulito más vivo (F14), traspasado desde `specs/014-pulido-pantallas-restauracion/spec.md` (aprobada el 26-10-2026). Nuevos: RF-253 a RF-265, CA-253 a CA-265, EV-112, EV-113, DEC-131 a DEC-134 y glosario («Restauración», «Copia de resguardo»). Modificados: RF-143 (restaurar desde la aplicación), RF-243 (sonido del agua), RF-245 (orden durante la visita), RF-248 y CA-248 (cinco gestos), RF-251 y CA-251 (subtítulos grabados, transcripción en hoja y comportamiento sin JavaScript) y DEC-128 (nuevos instantes). Sin cambios en la constitución | Autorizado en la sesión del 26-10-2026 («autorizo el CAMBIO-026 en historias.md»); respaldo de 0.25.0 (SHA-256 6fd278d0…c879ce) en `.respaldos/historias-v0.25.0-20261026.md` |
| 0.27.0 | 27-10-2026 | CAMBIO-027: mensaje del día de Capsulito, colores y fotos de cápsula, encuadre de fotos y copias más claras (F15), traspasado desde `specs/015-saludos-colores-fotos/spec.md` (aprobada el 27-10-2026). Nuevos: RN-091, RF-266 a RF-275, CA-266 a CA-275, EV-114, EV-115, DEC-135 a DEC-138 y glosario («Mensaje del día», «Color propio», «Encuadre»). Modificados: RF-001, RF-003, RF-005, RF-208, RF-214, RF-224 y anexo A (versión 4: mensajes del día ya mostrados). Constitución 1.9.0 (principios X y XVIII, color propio) | Autorizado en la sesión del 27-10-2026 («si» a registrar el CAMBIO-027; spec aprobada con «si, la apruebo»); respaldo de 0.26.0 (SHA-256 dd9b5687…40e42dd) en `.respaldos/historias-v0.26.0-20261027.md` |
| 0.28.0 | 27-10-2026 | CAMBIO-028: registro de quién instala la aplicación y diagnóstico de la instalación (F16), traspasado desde `specs/016-registro-instalacion/spec.md` (aprobada el 27-10-2026). Nuevos: RF-276 a RF-283, CA-276 a CA-283, EV-116, DEC-139 y glosario («Estado de instalación», «Aviso de instalación», «Diagnóstico de instalación»). Modificados: RF-206, RF-224 y anexo A (versión 5: estado de instalación y quién lo ve). Sin enmienda de la constitución | Autorizado en la sesión del 27-10-2026 (autorización del cambio en `historias.md` con su respaldo; spec aprobada con «te acepto la spec» y «si, procede con la spec»); respaldo de 0.27.0 (SHA-256 3dcf81f9…769d10f7) en `.respaldos/historias-v0.27.0-20261027.md` |
| 0.29.0 | 27-10-2026 | CAMBIO-029: descarga de copias, copia manual, origen de cada copia y registro de la restauración (F17), traspasado desde `specs/017-descarga-copia-manual/spec.md` (aprobada el 27-10-2026) y `plan.md` (aprobado el 27-10-2026). Nuevos: RF-284 a RF-292, CA-284 a CA-292, EV-117, DEC-140 y glosario («Copia manual», «Origen de una copia», «Identificador de restauración»). Modificados: RF-143, RF-253, RF-254 y RF-255. Sin enmienda de la constitución | Autorizado en la sesión del 27-10-2026 (la persona usuaria autoriza el cambio en `historias.md` y aprueba la spec con «sí, apruebo la spec»); respaldo de 0.28.0 (SHA-256 2e847ca5…d8eb2bbe) en `.respaldos/historias-v0.28.0-20261027.md` |
| 0.30.0 | 27-10-2026 | CAMBIO-030: listado único de copias con «Descargar» y «Restaurar» por fila, paginación de 8 en 8, dos columnas y retirada de las pruebas de restauración (modificación de F17, `specs/017-descarga-copia-manual/`). Modificados: RF-143, RF-253, RF-275, RNF-009, CA-143, CA-253, CA-275, HU-16 y glosario. Retirados: RF-144, RF-257, CA-144, CA-257, EV-070 y la tabla `prueba_restauracion`. Constitución 1.10.0 (principio V) | Autorizado en la sesión del 27-10-2026 («sí» a la enmienda 1.10.0, al CAMBIO-030 y a la modificación de la spec); respaldo de 0.29.0 (SHA-256 b98b40a8…eaf84e92) en `.respaldos/historias-v0.29.0-20261027.md` |

---

## Anexo A — Texto informativo de privacidad (propuesta, versión 5)

**Estado: propuesto. Redacción aceptada provisionalmente; datos y revisión aplazados (PEND-014).** La versión 5 (CAMBIO-028) añade el estado de instalación de la aplicación y quién lo ve (RF-278, RF-281). La versión 4 (CAMBIO-027) añade los mensajes del día ya mostrados (RN-091). La versión 3 (CAMBIO-022) nombra al responsable y al gestor (RF-224) y añade las frases de Capsulito ya dichas (RN-088). La versión 2 (CAMBIO-019) añade la foto, las aportaciones registradas por un administrador, la visibilidad de las estadísticas y los datos de los visitantes. Al publicarla, cada miembro vuelve a aceptarla (RF-160). Los datos entre corchetes deben completarse antes de publicarlo. Es un texto orientativo y no sustituye una revisión jurídica.

> ### Privacidad en beCafé
>
> **Quién trata tus datos.** Mardomingo Software. Gestiona la aplicación, dentro de la empresa, el responsable del departamento de informática, Daniel Diez Mardomingo: contacta con él en persona o por el canal interno del departamento.
>
> **Para qué.** Para llevar el stock de cápsulas de café del departamento y repartir su coste entre quienes las consumen mediante la hucha común.
>
> **Qué datos guardamos.**
> - Tu nombre, tu correo, tu contraseña cifrada de forma irreversible y, si la subes tú o un administrador, tu foto.
> - Cada café que registras, con su fecha, su hora y si era para un invitado.
> - Cada vez que registras que has rellenado el agua de la cafetera, con su fecha y su hora.
> - Tus aportaciones a la hucha (también las que un administrador registre en tu nombre, con quién las registró), las compras que registras, las fotos de tickets que adjuntes y tu saldo.
> - Tus preferencias de notificaciones y los datos técnicos de tus dispositivos suscritos a las notificaciones.
> - Las sesiones abiertas (fecha y tipo de navegador) y las acciones de administración.
> - Las frases y los mensajes del día de Capsulito que ya te ha mostrado y la hora de su último saludo, para no repetírtelos.
> - Si has instalado la aplicación en tu dispositivo o has rechazado hacerlo, y cuándo.
>
> **Quién los ve.**
> - Todos los miembros ven tu saldo, tus aportaciones, las compras que registres y tus rellenos de agua, incluidos el ranking de rellenos y el título de aguador del mes.
> - Todos los miembros ven tu foto y tus estadísticas de consumo (cuántos cafés tomas, de qué tipo y cuándo).
> - Solo los administradores ven si has instalado la aplicación y cuándo.
>
> **Cuánto tiempo.** Los datos se conservan **sin límite de tiempo**, también después de que dejes el departamento, para que los saldos y el historial de la hucha sigan cuadrando. Las copias de seguridad se guardan 30 días en [proveedor y ubicación del almacenamiento S3].
>
> **Visitantes.** Si entras con un enlace de visitante, guardamos el nombre que escribes y cada café que registras, con su tipo, su fecha y su hora, y quién te dio el enlace. Los administradores ven esos datos para aprobar o rechazar tus cafés. Tu nombre se conserva sin límite de tiempo, salvo que pidas a un administrador que lo borre: entonces se sustituye por «Visitante». No guardamos tu correo ni ningún otro dato.
>
> **Notificaciones.** Solo recibes notificaciones si las aceptas en tu dispositivo. Vienen todas activadas y puedes desactivar cada tipo en Ajustes, salvo el aviso de deuda.
>
> **Tus derechos.** Puedes pedir acceso a tus datos, su rectificación y el resto de derechos que reconoce la normativa de protección de datos escribiendo a [contacto]. [Añadir, si procede, el contacto del delegado de protección de datos de la empresa y la referencia a la autoridad de control.]
