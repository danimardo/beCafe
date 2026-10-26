# Propuesta de especificación: corto vertical de Capsulito

**Rama:** `cortometraje/capsulito-vertical`  
**Estado:** Aprobada por la persona usuaria en la sesión del 2026-10-26.  
**Fecha:** 2026-10-26  
**Origen:** petición de un relato animado, divertido y gamberro sobre el problema que resuelve beCafé; formato vertical 9:16; locuciones generadas con el procedimiento existente. La duración se decide por el ritmo del corto.

## Propósito y alcance propuesto

Un corto autónomo, reproducible a voluntad, muestra a Capsulito ante una cafetera cuyo armario ya no cuadra con los apuntes. Presenta el gesto de registrar cada café, el aviso de stock bajo y la distinción entre saldo personal y hucha común. No sustituye ni modifica la bienvenida interactiva vigente (RF-188). Su ubicación dentro o fuera de la aplicación queda por decidir después de revisar el corto.

La pieza se compone para **9:16** (lienzo de trabajo propuesto: 1080 × 1920), con zona segura para subtítulos y controles de reproducción. Duración orientativa: **65–75 segundos**, ajustable tras grabar la voz y montar una animática. No se impondrá una duración fija si perjudica al chiste o a la comprensión.

## Guion propuesto: «El misterio de la última cápsula»

Los tiempos son orientativos. El silencio y los efectos visuales forman parte del ritmo; el texto hablado tendrá también subtítulos legibles.

| Tiempo | Imagen y acción | Voz de Capsulito |
| --- | --- | --- |
| 0–8 s | Capsulito entra con sueño, saluda a la cafetera como a una vieja amiga y abre el armario. Música de detectives exageradamente solemne. | «Buenos días, señora cafetera. Lo de siempre.» |
| 8–17 s | En el hueco de su variedad favorita hay una sola cápsula que se desliza fuera de su alcance. En un papel figura que aún quedan varias. Mirada a cámara. | «Un momento. Según el papel, aquí hay cápsulas. Según mis ojos… hay aire.» |
| 17–29 s | Montaje rápido de tazas que aparecen, cápsulas que desaparecen y una cuenta en papel que se enreda. Capsulito se pone una lupa demasiado grande. No se identifica ni culpa a ninguna persona. | «El misterio de los cafés invisibles. Se hacen, se disfrutan… y se olvidan de apuntar.» |
| 29–40 s | Capsulito aparta la lupa y muestra el móvil con beCafé. Toca la tarjeta de la cápsula; aparece la confirmación y el contador baja una unidad. | «Nueva pista: un toque por cada café. Y ahora sí sabemos lo que queda.» |
| 40–50 s | El contador indica pocas unidades. Capsulito saca un minúsculo megáfono; la alerta visual ocupa su lugar. Llegan cajas nuevas y se registra la compra. | «Si quedan pocas, beCafé avisa. Cuando compramos, apuntamos las cajas.» |
| 50–62 s | Dos fichas visualmente distintas: el precio de un café se descuenta del saldo personal; una aportación registrada suma dinero a la hucha. Capsulito intenta alimentar la hucha con granos de café; la hucha los escupe. | «Cada café va a tu saldo. El dinero de verdad entra en la hucha cuando aportas. Entendido, jefa.» |
| 62–72 s | Capsulito prepara su café, levanta la taza y mira a cámara. El armario, el contador y la hucha quedan ordenados. | «Menos arqueología de cajón. Más café. beCafé.» |

La escena de la hucha es un chiste visual: **no** representa que un consumo meta dinero en la hucha. La aplicación tampoco reconstruye por sí sola los cafés que nadie registró antes; la solución funciona cuando se apuntan los consumos (NEC-001 a NEC-004, RF-011, RF-030, RF-040).

## Recursos previstos

| Recurso | Procedencia prevista |
| --- | --- |
| Capsulito, expresiones y caminar | Reutilizar los SVG y `.riv` existentes; adaptar movimiento de escena y expresiones sin redibujar su identidad (RF-186). |
| Cafetera, armario con puerta, estantes, taza, cápsulas, cajas, lupa y megáfono | Dibujar como vectores por capas compatibles con el estilo Latte. |
| Hucha | Vector con gesto breve para el gag; su función económica se explica con texto visible. |
| Móvil y pantalla | Representación simplificada de la interfaz real, con «+1», stock bajo, saldo y aportación reconocibles; sin datos personales ni importes inventados. |
| Decorado y efectos | Fondo cálido sencillo, sombras, música y efectos breves que no tapen la voz. |
| Voz y subtítulos | Locuciones nuevas en español, preparadas con el procedimiento por tandas del ADR-0006; texto completo visible o subtitulado, pistas de labios si Capsulito habla en primer plano. |

## Revisión y accesibilidad

- Entregar primero una animática de baja fidelidad y una lámina de recursos para revisar tono, ritmo y apariencia antes del `.riv` final.
- Proporcionar versión subtitulada, imagen de portada y una transcripción. La historia debe entenderse sin sonido.
- Si se integra en la aplicación: reproducción iniciada por la persona, controles para pausar/saltar y alternativa estática o sin movimiento según `prefers-reduced-motion`; nunca bloquear registrar un café (constitución X, XI y XVIII).
- La ubicación, el modo de publicación y cualquier cambio a RF-188 requieren una decisión posterior. No se asumen aquí.

## Estado de aprobación y dependencias

Esta especificación aprobada fija el borrador narrativo y el alcance de producción. El diseño técnico (`plan.md`) se prepara como propuesta; las tareas, la creación de recursos definitivos, la llamada a ElevenLabs y la integración esperan la aprobación del `plan.md` concreto conforme a AGENTS.md §2. Si el plan cambiara requisitos o diseño ya aprobados, se documentaría el impacto y se renovarían las aprobaciones afectadas.

## Integración en la aplicación (aprobada el 2026-10-26)

**Estado:** la persona usuaria aprobó esta sección en la sesión del 2026-10-26 y autorizó el CAMBIO-025 de `historias.md` (v0.25.0, respaldo `.respaldos/historias-v0.24.0-20261026.md`). El `plan.md` §7 espera su aprobación.

**Origen:** petición de la persona usuaria del 2026-10-26. Sus respuestas a las dudas fijan lo que sigue. Esta sección cambia lo dicho arriba («No sustituye ni modifica la bienvenida», «la ubicación queda por decidir»): por AGENTS.md §2 tenía que aprobarse y registrarse en `historias.md` antes de implementar (CAMBIO-025: RF-195 modificado y RF-249 a RF-252 nuevos).

### User Story 9 — El corto es lo primero que ve una persona nueva (Prioridad: P1)

Una persona abre beCafé desde un dispositivo que no ha visto la bienvenida. Antes de la pantalla de entrada ve la portada del corto con «Ver el corto». Si lo ve, entiende qué problema resuelve la aplicación antes de crear o usar una cuenta.

**Escenarios de aceptación**

1. **Dado** un dispositivo sin la marca de bienvenida vista, **cuando** abre `/login`, el enlace de visitante o un enlace de alta o recuperación (`/acceso/…`), **entonces** ve primero la portada del corto, con el botón «Ver el corto» como acción principal y un «Saltar» secundario.
2. **Dado** la portada, **cuando** pulsa «Ver el corto», **entonces** el vídeo se reproduce con sonido y con subtítulos activados, con controles de pausa y de saltar.
3. **Dado** que termina el vídeo o pulsa «Saltar», **cuando** la pantalla era `/login` o el enlace de visitante, **entonces** sigue la bienvenida de nueve escenas de siempre (RF-195); si era un enlace de alta o recuperación, aparece su formulario.
4. **Dado** un dispositivo con la marca de bienvenida vista, **cuando** entra por cualquiera de esas pantallas, **entonces** no ve el corto.
5. **Dado** que no hay conexión, **cuando** se abre la portada, **entonces** no se ofrece el corto y la pantalla funciona como hoy.
6. **Dado** `prefers-reduced-motion`, **cuando** se abre la portada, **entonces** no se reproduce nada solo (ya exige pulsar) y la transcripción está a la vista.

### User Story 10 — Volver a ver el corto (Prioridad: P2)

Una persona que ya entró quiere recordar qué problema resuelve beCafé o enseñárselo a un compañero.

1. **Dado** Ayuda o Ajustes, **cuando** pulsa «Ver el corto otra vez», **entonces** se abre el corto en un diálogo, con las mismas opciones.

### Requisitos funcionales

- **RF-249**: Si el dispositivo no tiene la marca de bienvenida vista, `/login`, el enlace de visitante y los enlaces de alta o recuperación deberán mostrar antes una portada con el corto: botón «Ver el corto» (acción principal) y «Saltar». Modifica RF-195 (el corto va antes de la bienvenida).
- **RF-250**: Ayuda y Ajustes deberán ofrecer «Ver el corto otra vez», junto a «Ver la bienvenida otra vez».
- **RF-251**: El corto se reproduce solo cuando la persona pulsa «Ver el corto», con sonido y subtítulos activados por defecto. Tiene pausa, saltar y un enlace a su transcripción. Nunca bloquea entrar, usar la aplicación ni registrar un café.
- **RF-252**: «Saltar» deberá ser una acción visible y accesible, aunque secundaria en tamaño y jerarquía. No se oculta, no tiene menos contraste del exigido (4,5:1) ni un objetivo menor de 24 × 24 px (constitución X y XI).

### Decisiones tomadas por la persona usuaria

| Duda | Decisión |
| --- | --- |
| Frecuencia | Una vez por dispositivo, con la marca de bienvenida vista; y «Ver el corto otra vez» en Ayuda y Ajustes. |
| Pantallas | `/login`, enlace de visitante y enlace de alta o recuperación. Quien ya tiene sesión abierta no lo ve. |
| Relación con la bienvenida | El corto va primero y la bienvenida de nueve escenas después. No se sustituye. |
| Arranque | Portada con «Ver el corto» (con sonido). Subtítulos activados por defecto y transcripción enlazada. |
| «Saltar» | La persona pidió que fuera pequeño y poco visible para que la mayoría lo vea. **Conflicto con la constitución X** («opciones ocultas», «cancelación difícil»): se resuelve con una alternativa compatible. «Saltar» queda como acción secundaria (texto pequeño, sin relleno), visible y con el contraste y el tamaño exigidos. |
| Peso | Versión web comprimida (unos 4–6 MB), descargada solo al pulsar, fuera de la precarga de la PWA. |
| Marca | Se reutiliza la marca de bienvenida vista; no se guarda nada nuevo en el navegador (constitución V). |
| Trámite | Dentro de 013, no como funcionalidad nueva. |

### Consecuencias que conviene conocer

- La marca la pone la bienvenida, no el corto. Quien vea el corto y cierre el navegador antes de terminar o saltar la bienvenida volverá a ver la portada. En los enlaces de alta o recuperación no hay bienvenida previa, así que recargar la página muestra la portada otra vez hasta que la persona acepte la privacidad y vea la bienvenida de Inicio. Si no se quiere esa repetición, hace falta una marca nueva y una enmienda de la constitución V.
- Quien entra con la sesión abierta no pasa por esas pantallas. Solo lo vería si pulsa «Ver el corto otra vez».
- Las pruebas E2E existentes no se ven afectadas: ya escriben la marca `becafe-bienvenida=vista` en sus contextos.

### Fuera de alcance

Cambiar el vídeo, sus locuciones o su guion; reproducirlo automáticamente; mostrarlo a quien ya tiene sesión; una marca nueva en el navegador; la bienvenida de nueve escenas (no cambia).

### Impacto en las fuentes vigentes

- `historias.md`: CAMBIO-025 (RF-195 modificado, RF-249 a RF-252 nuevos, CA-249 a CA-252). Requiere autorización expresa y respaldo en `.respaldos/` antes de tocarlo.
- `ARCHITECTURE.md` §2 (componente y activos del corto) y `docs/pruebas.md` (CA-249 a CA-252).
- No cambia la constitución, el esquema de datos ni las dependencias.

