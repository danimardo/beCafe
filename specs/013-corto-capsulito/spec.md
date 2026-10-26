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
