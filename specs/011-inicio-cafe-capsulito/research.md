# Research: F11 — Inicio centrado en el café, Capsulito gamberro y pulido de la interfaz

Fecha: 2026-10-25. Fuente: `spec.md` (aprobada), `historias.md` v0.22.0 (CAMBIO-022), constitución 1.8.0 y el código de `main` (`b20530b`).

## R1. Dónde se elige la frase y dónde se guarda el ciclo (RF-213 a RF-215, RN-088, RN-089)

- **Decision**: el servidor elige y registra la frase en una sola transacción. Tabla nueva `frase_entregada` en el módulo `usuarios` (dueño de las marcas de cuenta, `preferencia_cuenta`). La regla pura de selección va en `src/lib/server/usuarios/dominio/ciclo-frases.ts` y recibe el azar como parámetro (`ambiente.azar`). El último saludo se deriva de `max(entregada_en)` de la lista `saludo`; no hace falta otra columna.
- **Rationale**: la constitución V prohíbe guardar el ciclo en el navegador. Elegir y anotar en la misma transacción síncrona de `better-sqlite3` impide que dos dispositivos reciban la misma frase (EV-108). `usuarios` ya guarda estados de experiencia por cuenta; un módulo nuevo `mascota` no tiene más reglas que esta (principio II).
- **Alternatives considered**: módulo `mascota` en servidor (rechazada: una sola tabla y una función); elegir en el cliente y anotar después (rechazada: carrera entre dispositivos); guardar un JSON con las recibidas en `preferencia_cuenta` (rechazada: la tabla actual guarda marcas, no listas, y el JSON necesitaría validación en cada lectura).

## R2. Cuándo se entrega el saludo (RF-214)

- **Decision**: la carga de Inicio solo calcula `saludoDisponible` (lectura). Tras montar, si la mascota está visible y `saludoDisponible`, la página envía `?/saludo` (formulario oculto con `use:enhance`); la acción vuelve a comprobar las 2 horas, elige, anota y devuelve el `fraseId`. Sin JavaScript no hay saludo.
- **Rationale**: una carga (`GET`) no debe escribir: la precarga de enlaces (`data-sveltekit-preload-data`) gastaría saludos que nadie ve. El saludo es un acompañamiento como la voz, no una acción de la persona, así que no entra en la regla de «toda acción funciona sin JavaScript» (XVII). Comprobar las 2 horas en la acción hace la operación idempotente frente a dos pestañas.
- **Alternatives considered**: anotar en el `load` (rechazada por la precarga); anotar con una segunda petición tras mostrar un candidato elegido en el `load` (rechazada: dos pasos sin transacción común).

## R3. Frase de registro con el consumo (RF-213)

- **Decision**: la acción `consumir` llama a `registrarConsumo` y, si el consumo es nuevo (`duplicado: false`) y el formulario trae `mascota=si`, llama después a `usuarios.entregarFrase(ambiente, usuarioId, 'registro')`. Un fallo de la frase se registra y no deshace el consumo (constitución XIII). La respuesta añade `fraseId`. La cola sin conexión (`/api/consumos`) no cambia y no entrega frases.
- **Rationale**: la frase no es un dato económico y no debe compartir la transacción del consumo. `mascota=si` lo pone `use:enhance` según la preferencia del dispositivo, así el ciclo no avanza con la mascota desactivada. Sin JavaScript el campo falta y no hay frase: la confirmación sin JavaScript es el aviso con «Deshacer» de siempre.
- **Alternatives considered**: segunda petición del cliente tras el consumo (rechazada: más latencia y otra ruta); entregar la frase dentro de `economia` (rechazada: arista `economia → usuarios` para algo que no es economía; ya existe, pero mezcla responsabilidades).

## R4. Confirmación de stock 0 (RF-217)

- **Decision**: la tarjeta de un tipo con stock ≤ 0 en la carga incluye el campo oculto `sinStock=1`. Con JavaScript, `CapsuleTile` abre `ConfirmDialog` antes de enviar y añade `confirmarSinStock=si`. `registrarConsumo` recibe `sinStockVisto` y `confirmado`; si el stock real es ≤ 0, `sinStockVisto` es verdadero y no hay confirmación, lanza `ErrorDeNegocio('CONFIRMAR_SIN_STOCK')`. La acción lo traduce a `fail(409, { confirmarSinStock: { tipoCapsulaId, nombre, clienteId } })` y la página muestra la pregunta como paso intermedio (sin JavaScript) con los botones «Sí, registrar» (reenvía con `confirmarSinStock=si`) y «Cancelar» (enlace a Inicio).
- **Rationale**: cubre el caso sin JavaScript con el mismo patrón que la hucha negativa de F10 (D5). Si el stock cambió entre la carga y el toque, decide el stock real: un tipo que se cargó con stock no lleva `sinStock` y se registra con un toque (RF-017, edge case de la spec). La cola sin conexión pide la confirmación en el cliente antes de encolar y el contrato de `/api/consumos` no cambia (constitución XIV).
- **Alternatives considered**: comprobar solo en el cliente (rechazada: sin JavaScript no hay pregunta); exigir confirmación siempre que el stock real sea ≤ 0 (rechazada: rompería el toque de quien vio stock).

## R5. Fallos de compras (RF-211, RF-212)

- **Decision**: (a) el esquema de compra rechaza cada línea con cantidad > 0 e importe vacío o 0 con un error en `importe.<índice>`; (b) el formulario valida lo mismo en el cliente antes de decidir si abre el diálogo, marca el campo y le da el foco; (c) el diálogo se cierra con cualquier resultado del envío y el foco va al resumen de errores.
- **Rationale**: en 5.png el diálogo mostraba «Importe 0,00 €» y el error del servidor quedaba detrás porque el diálogo no se cerraba al volver la respuesta. Validar antes de calcular la hucha evita la confirmación falsa.
- **Alternatives considered**: mostrar el error dentro del diálogo (válida, pero exige duplicar el resumen de errores en el diálogo).

## R6. «Compras» duplicado en la navegación (RF-229)

- **Decision**: reproducir primero con una prueba E2E que cuenta los enlaces de la barra lateral tras registrar una compra con `use:enhance` y error del servidor. Hipótesis: un nodo de la lista con clave `item.href` queda duplicado durante la actualización con el diálogo modal abierto (el `inert`/portal de Bits UI y la transición del enlace activo). La corrección se decide con la prueba en rojo.
- **Rationale**: las definiciones de `nav` en `(app)/+layout.svelte` no repiten «Compras»; el defecto aparece solo en la captura con el diálogo abierto. Una prueba que lo reproduce evita corregir a ciegas (AGENTS.md §7: error corregido → prueba).
- **Resultado (T011)**: la prueba E2E `CA-229` (`e2e/flujos/navegacion-f11.spec.ts`) cuenta los enlaces de `aside nav` con el diálogo abierto y tras cancelar, y pasa: el DOM tiene un solo «Compras». No se pudo reproducir el duplicado de `5.png`; queda como regresión y se pide a la persona usuaria que avise si vuelve a verlo.
- **Hallazgo relacionado**: en el carril de tableta, «Configuración» usa la etiqueta corta «Ajustes». Con la sección nueva «Ajustes» (RF-220) serían dos destinos con el mismo nombre. La etiqueta corta pasa a «Config.».

## R7. «Repetir el tour» en Inicio (RF-228)

- **Decision**: reproducir con E2E (abrir ayuda en `/`, pulsar «Repetir el tour», esperar el primer paso). Hipótesis: el formulario GET navega a la misma ruta, `afterNavigate` reinicia `tourCerrado`, pero el `Sheet` de la ayuda sigue abierto (foco atrapado y `inert` en el resto) y el tour queda debajo, o `data.tourPendiente` no cambia porque la navegación se resuelve sin volver a cargar. Corrección prevista: el botón, con JavaScript, cierra el panel y llama a una función `repetirTour()` del contexto de ayuda; sin JavaScript conserva el GET a `/?tour=si`.
- **Resultado (T012)**: las pruebas `CA-228` pasaron antes de corregir en los tres navegadores, así que el fallo de la persona usuaria no se reprodujo. Se aplicó igualmente la corrección de la decisión (la ayuda con JavaScript no depende ya de la navegación GET) y las pruebas quedan como regresión.
- **Rationale**: misma política de prueba en rojo que R6.

## R8. Ajustes (RF-220, RF-221)

- **Decision**: ruta nueva `src/routes/(app)/ajustes/` con apariencia y mascota (cliente, `localStorage`, igual que hoy), avisos (la acción `preferencia` y `SeccionAvisos` se mueven desde Perfil) e instalación. En escritorio, «Ajustes» aparece en la barra lateral tras «Perfil». En móvil, la barra flotante conserva 5 destinos: «Perfil» queda activo también en `/ajustes` y Perfil enlaza a Ajustes en su primera fila. La acción `preferencia` de Perfil responde 308 a `/ajustes` durante una versión para no romper formularios abiertos.
- **Rationale**: la barra móvil de 5 destinos de 44 px no admite un sexto sin bajar del mínimo táctil en 320 px (constitución XI).
- **Alternatives considered**: sexto destino en móvil (rechazada por el ancho); Ajustes dentro de Configuración (rechazada por la spec, DEC-122).

## R9. Avatar ilustrado (RF-222)

- **Decision**: 8 ilustraciones SVG de un trazo (taza, cápsula, grano, cafetera, molinillo, vaso para llevar, cruasán, cucharilla) como componentes en `src/lib/ui/avatares/`, con `currentColor` sobre los tokens `--avatar-1..6`. `lib/shared/avatar.ts` añade `ilustracionAvatar(usuarioId)` con otra semilla FNV-1a, para que color e ilustración no vayan siempre juntos. Contraste del trazo con `--ink` ≥ 3:1 (ya ≥ 4,5:1 por F10).
- **Rationale**: SVG en línea hereda el color del tema y no pide peticiones extra. Las ilustraciones se enseñan a la persona usuaria en una página de pruebas antes de cerrar el lote.

## R10. Animación de entrada con el CLI de Rive (RF-225, DEC-123)

- **Decision**: proyecto RML en `docs/diseno/f11/rive/entrada/` (fuente versionada) compilado con `~/.rive/bin/rive ./docs/diseno/f11/rive/entrada --once` a `static/mascota/riv/capsulito-entrada.riv`. Artboard `Entrada`, máquina de estados `Entrada` con entradas `mirarX` (número 0–100), `taparOjos` (booleano), `fallo` (disparador), `exito` (disparador) y `reducedMotion` (booleano). Se parte de `static/mascota/svg/capsulito-*.svg`. `lib/client/rive.ts` (único archivo que importa `@rive-app/canvas`) añade `montarRiveEntrada()`. Se generan capturas con `--screenshot` de cada estado para que la persona usuaria las revise antes de integrar.
- **Rationale**: las fuentes de F9 no están en el repositorio y no se pueden regenerar; esta vez la fuente se versiona. El RML del CLI 1.7.0 es posterior al conocimiento del modelo: la sintaxis se consulta con `rive docs` y `rive schema` durante la tarea.
- **Riesgo y salida**: si el RML no permite seguir el cursor o los disparadores, la tarea se detiene y se presenta la alternativa (SVG con transformaciones CSS para los ojos y las manos, mismas entradas). RF-225 no exige Rive; DEC-123 sí registra la intención.
- **Celebración**: al recibir `redirect` del inicio de sesión, el cliente dispara `exito` y aplica la redirección sin esperar (spec CA-225: no retrasa la entrada).

## R11. Microinteracciones (RF-233 a RF-236)

- **Decision**: portar la guía (`.logs/GUIA-AGENTE-INTEGRAR-MICROINTERACCIONES.md`) a los componentes Latte existentes: `TextField`, `MoneyField`, `PasswordField`, `SelectField` (solo sacudida y mensaje), `Switch`, casillas y radios nativos de `formularios.ts`, `SegmentedControl` y `ThemeToggle` (indicador), `Section`/tarjetas con `spotlight`, `Button` (`success`) y `Money`/`KpiTile` (interpolación). Tokens nuevos en `docs/diseno` y `src/app.css` con los nombres de la guía (`--motion-*`). Dos acciones internas: `src/lib/ui/movimiento/indicador.ts` y `src/lib/ui/movimiento/spotlight.ts`; interpolación en `src/lib/ui/movimiento/cifra.svelte.ts`.
- **Rationale**: la guía indica qué conservar (medición fuera del estado reactivo, sin bucles, valor accesible final). Son unas pocas líneas de JavaScript por efecto; la spec excluye Rive, no JavaScript.
- **Cristal**: el brillo no se aplica a `CapsuleTile` ni a tarjetas `glass` (RF-235: no se duplica sobre cristal).

## R12. Voz de las frases, la ayuda y el tour (RF-227, RF-237)

- **Decision**: catálogo nuevo `src/lib/shared/mascota/frases.ts` con las 160 frases (`id`, `texto` literal, `textoVoz` con etiquetas, `pose`). `scripts/generar-voces.mjs` deja de duplicar textos para estas frases: importa `frases.ts` y `ayuda/pantallas.ts` (Node 24.22 elimina tipos de forma nativa; los dos archivos solo usan sintaxis borrable). Locuciones nuevas: 160 frases + 4 pasos del tour (`tour_01..04`) + 32 pantallas de ayuda (`ayuda_<pantalla>`, solo el propósito). `hablar()` ya ignora un audio que no carga; la frase se muestra igual.
- **Rationale**: un único enunciado por texto (constitución I). La persona usuaria genera los 196 audios con `./voces.sh` (unos 12 000 caracteres; el menú los muestra antes de confirmar).

## R13. Páginas de error (RF-226)

- **Decision**: `src/routes/+error.svelte` usa `ErrorPage` con cuatro tipos (`peticion`, `sin-permiso`, `no-encontrada`, `servidor`) y textos gamberros en `textos.errorPagina`. Momentos de mascota nuevos `error.peticion`, `error.sin_permiso`, `error.no_encontrada`, `error.servidor` con su pose. La 500 muestra `page.error.codigo` (identificador de operación). Se mantiene el `+error.svelte` raíz (las rutas `(app)` heredan) para que la página no dependa de la carga del layout que puede haber fallado.

## R14. Privacidad versión 3 (RF-224)

- **Decision**: `VERSION_PRIVACIDAD = 3`, el párrafo «Quién trata tus datos» y el elemento nuevo de «Qué datos guardamos» (frases de Capsulito ya dichas) iguales que el anexo A v3. Al entrar, cada persona vuelve a ver el texto (RF-160).
- **Observación para la persona usuaria**: el anexo conserva otros marcadores (`[proveedor y ubicación del almacenamiento S3]`, `[contacto]` en «Tus derechos») que siguen aplazados por PEND-014. Esta funcionalidad no los cambia.
