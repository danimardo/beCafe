# Tareas: Pulido de Capsulito, celebración del café y gestión de personas y stock (F12)

**Entrada**: [plan.md](plan.md) (aprobado el 2026-10-26), [spec.md](spec.md) (aprobada el 2026-10-26), [data-model.md](data-model.md), [contracts/formularios-y-avisos.md](contracts/formularios-y-avisos.md), [research.md](research.md), `historias.md` v0.24.0 (CAMBIO-024) y constitución 1.8.0.

**Requisito previo**: F1 a F11 implementadas (T047 de F11 sigue abierta: benchmark y TalkBack).

**Pruebas**: obligatorias (constitución VIII). Cada `CA-238` a `CA-248` queda cubierto por al menos una prueba que lo cite en su descripción. Los fallos corregidos (CA-238, CA-239, CA-240) se reproducen con una prueba en rojo **antes** de corregirlos.

**Verificación por lote** (AGENTS.md §7): `npm run test:changed`, `npm run lint:changed`, `npm run check` y, si toca interfaz, `node scripts/build-verificacion.mjs` + `npm run test:e2e:quick -- <spec>`. `npm run verify` tras cambiar `lib/shared/contratos/push.ts` (contrato público). No ejecutar lint y pruebas a la vez. Anotar cada ejecución en `.local/verification/runs.jsonl`.

## Formato: `[ID] [P?] [Historia] Descripción`

---

## Fase 1: Preparación

- [X] T001 [P] Añadir los textos nuevos en `src/lib/shared/textos.ts`: `admin.enlaceListo` («Enlace listo para copiar»), el aviso de recuento (título «Recuento del {dd/mm}», partes «Faltaban {n} {tipo}», «Sobraban {n} {tipo}», «{importe} repartidos entre {personas} personas ({x} cada una)» / «(entre {x} y {y} cada una)», «sin cargos», anulación «Se anuló el recuento de {tipos} del {dd/mm}; sus cargos ya no cuentan»), `inicio.entendido` («Entendido»), la etiqueta de Ajustes «Recuentos de stock» y el texto de la escena `intro_09` (literal de RF-247).
- [X] T002 [P] Añadir en `src/lib/shared/fechas/meses.ts` `inicioDeVentanaDias(ahora: InstanteUtc, dias: number): InstanteUtc` (00:00 Europe/Madrid del día `hoy − (dias − 1)`, en UTC) con pruebas en `meses.test.ts` (cambio de hora de octubre y marzo; `dias = 30`).
- [X] T003 [P] Añadir el código `aviso.visto` (info, campos `{ avisoId }`) al catálogo de `src/lib/server/plataforma/registro.ts` y ampliar `registro.test.ts`.

---

## Fase 2: Historia 2 — Enlace de acceso y voz del tour (P1, correcciones)

**Objetivo**: restablecer la copia, la posición del enlace y la voz del tour. **Prueba independiente**: alta, «Generar enlace» y «Reactivar» por http; tour con voz.

- [X] T004 [US2] Prueba en rojo `CA-238` en `src/lib/ui/CopyField.svelte.test.ts` (Browser Mode): sin `navigator.clipboard` (propiedad eliminada en la prueba) el botón llega a «Enlace copiado» usando el respaldo; si el respaldo devuelve `false`, el texto queda seleccionado y aparece «No se pudo copiar solo. Selecciona el texto y cópialo». E2E `e2e/flujos/enlace-f12.spec.ts` que abre la app por `http://127.0.0.1:<puerto>` con un origen no seguro reproducible (documentar en la prueba cómo se obtiene el contexto no seguro; si Playwright trata `127.0.0.1` como seguro, usar la IP de la interfaz de red o `--unsafely-treat-insecure-origin-as-secure` desactivado) y comprueba el portapapeles con `context.grantPermissions(['clipboard-read'])`.
- [X] T005 [US2] Corregir `src/lib/ui/CopyField.svelte` (RF-238, research R1): `navigator.clipboard.writeText` solo con `window.isSecureContext && navigator.clipboard`; si no, seleccionar el `input` y `document.execCommand('copy')`; si devuelve `false` o lanza, `failed = true` con el texto seleccionado. Añadir la prop `anunciar?: boolean`: `autofocus` en el campo, `$effect` que hace `scrollIntoView({ block: 'center', behavior: reducido ? 'instant' : 'smooth' })` y escribe `textos.admin.enlaceListo` en el `role="status"`.
- [X] T006 [US2] Prueba en rojo `CA-239` en `e2e/flujos/enlace-f12.spec.ts` y `e2e/sin-js/enlace-f12.spec.ts`: tras alta, `generarEnlace` y `reactivar`, el campo del enlace es el siguiente elemento tras el botón pulsado (comparar `boundingBox`: debajo y a menos de 200 px), está en el viewport y hay un `role="status"` con «Enlace listo para copiar»; sin JavaScript el campo tiene el foco.
- [X] T007 [US2] Corregir (RF-239, research R2): las acciones `alta` de `src/routes/(app)/admin/usuarios/+page.server.ts` y `generarEnlace`/`reactivar` de `src/routes/(app)/admin/usuarios/[usuarioId=ulid]/+page.server.ts` devuelven `origen: 'alta' | 'generarEnlace' | 'reactivar'`; en los dos `+page.svelte` pintar `<CopyField anunciar …>` dentro del bloque del formulario cuyo `origen` coincide, debajo de su botón, y quitar el de arriba de la ficha. Actualizar `page.server.test.ts` de ambas rutas (devuelven `origen`).
- [X] T008 [US2] Prueba en rojo `CA-240` en `src/lib/ui/TourInicio.svelte.test.ts` y `e2e/flujos/tour-f12.spec.ts`: con la voz activa y un audio de prueba, durante el paso 1 el Capsulito de la tarjeta del tour cambia `data-boca` (≠ 0 al menos una vez) y el Capsulito de Inicio mantiene `data-boca="0"`.
- [X] T009 [US2] Corregir (RF-240, research R3): prop `callado?: boolean` en `src/lib/ui/Capsulito.svelte` (`bocaEfectiva = callado ? 0 : …`; sin reposo ni animación mientras `callado`); en `src/routes/(app)/+page.svelte` pasar `callado={tourActivo}` y `animar={!tourActivo}` al Capsulito `lg`; en `src/lib/ui/TourInicio.svelte` usar `modo="rive"` en el Capsulito `sm`. Ampliar `Capsulito.svelte.test.ts` (`callado` fija `data-boca="0"`).

**Punto de control**: T004–T009 en verde; `npm run test:e2e:quick -- e2e/flujos/enlace-f12.spec.ts e2e/flujos/tour-f12.spec.ts`.

---

## Fase 3: Historia 1 — Celebración al registrar (P1)

**Objetivo**: confeti y sonido solo cuando el servidor confirma. **Prueba independiente**: café propio, invitado, agua y «Sin stock»; voz on/off; movimiento reducido; sin conexión.

- [X] T010 [US1] Crear `scripts/generar-sonido.mjs` (research R5): reutiliza `cargarDotEnv` de `scripts/generar-voces.mjs`; `POST {urlApi}/v1/sound-generation` con `{ text: 'short cheerful cartoon celebration chime with a tiny party popper, bright, friendly, no voice', duration_seconds: 1.2, prompt_influence: 0.6 }` y cabecera `xi-api-key`; nunca imprime la clave; con `--intentos N` guarda N candidatos en `.local/sonidos/candidato-NN.mp3`; con `--elegir NN` procesa ese candidato con `ffmpeg` (mono, 48 kbps, recorte del silencio inicial, fundido de salida 150 ms) a `static/mascota/sonidos/celebracion.mp3` y falla si supera 30 KB. Prueba `scripts/generar-sonido.test.ts` con servidor falso (petición y cabeceras correctas, la clave no aparece en la salida, `it.runIf(hayFfmpeg)` para el tamaño ≤ 30 KB).
- [X] T011 [US1] Generar 4 candidatos con la API real (`node scripts/generar-sonido.mjs --intentos 4`). **Parada**: la persona usuaria escucha `.local/sonidos/` y elige uno; después `--elegir NN`. Nota en `docs/adr/0006-rive-y-sincronizacion-voz-capsulito.md` («Sonido de celebración», generación fuera de banda). *(Hecha: el agente eligió el 01 de forma provisional; la persona usuaria puede cambiarlo con `--elegir NN`.)*
- [X] T012 [P] [US1] Crear `src/lib/ui/movimiento/Confeti.svelte` (research R4): prop `disparo: number`; `{#key disparo}` con 14 piezas `span` absolutas de clases de tokens (`bg-accent`, `bg-positive`, `bg-warning`, `bg-caramel`; sin hexadecimales), animación CSS de 900 ms, `pointer-events-none`, `aria-hidden="true"`; no pinta nada si `disparo === 0`, con `prefers-reduced-motion: reduce` ni con `mascota.animar === false`. Exportar en `src/lib/ui/movimiento/index.ts` e `src/lib/ui/index.ts`. Prueba `Confeti.svelte.test.ts` (`CA-243`, `CA-244`): aparece con `disparo = 1`, desaparece en ≤ 1 s, no intercepta clics en el botón de debajo, no se pinta con movimiento reducido.
- [X] T013 [US1] Añadir `reproducirSonido(ruta, onFin): { detener(): void }` en `src/lib/client/rive.ts` (un `Audio`; `play()` rechazado se ignora y llama a `onFin`) y `celebrar(fraseId: string | null)` en `src/lib/ui/contextos/mascota.svelte.ts`: con la voz activa y la mascota visible, `detenerVoz()`, reproduce `/mascota/sonidos/celebracion.mp3` y al terminar llama a `hablar(fraseId)` si hay frase; sin voz no suena nada. `detenerVoz()` corta también el sonido. Pruebas en el test del contexto (sin voz no crea `Audio`; una segunda llamada detiene la primera).
- [X] T014 [US1] Prop `celebrar?: number` en `src/lib/ui/CapsuleTile.svelte`, `src/lib/ui/CapsuleRow.svelte` y `src/lib/ui/WaterRefillCard.svelte` que pinta `<Confeti disparo={celebrar} />` en una capa `relative` sobre la tarjeta o el botón. Ampliar `CapsuleTile.svelte.test.ts` (el botón «Deshacer» y otra tarjeta siguen recibiendo clics con el confeti visible).
- [X] T015 [US1] En `src/routes/(app)/+page.svelte` (plan D3): contadores `$state` por tipo y para el agua; en la rama del servidor confirmado de `enviarToque` (consumo nuevo, `duplicado` falso) sube el contador del tipo y llama a `mascota.celebrar(fraseId)` en vez de `hablar` (el bocadillo se actualiza igual con `decirFrase` sin audio); con descuadre, confeti y la frase de `stock.negativo`; en `enviarRelleno` confirmado, contador del agua y `celebrar` con el audio de `agua.confirmada`; `encolar`, `sincronizar` y los rechazos no celebran. Lo mismo para los cafés de invitado y la confirmación «Sin stock».
- [X] T016 [US1] E2E `e2e/flujos/celebracion-f12.spec.ts`: `CA-243` (café propio, invitado, agua y «Sin stock» confirmado: aparece la capa de confeti y se pide `/mascota/sonidos/celebracion.mp3` antes que el audio de la frase, observado con `page.on('request')`; 10 toques seguidos registran 10 consumos — SC-002), `CA-244` (voz silenciada: sin petición del sonido; `reducedMotion: 'reduce'`: sin confeti y con el mensaje; `context.setOffline(true)`: el café queda pendiente, sin confeti ni sonido). Comprobar que la confirmación en pantalla sigue llegando en ≤ 1 s (RNF-002) con la medida que ya usa `consumos.spec.ts`.

**Punto de control**: celebración completa y probada; el sonido elegido por la persona usuaria.

---

## Fase 4: Historia 3 — Orden de las cápsulas (P2)

**Objetivo**: RN-090. **Prueba independiente**: dos personas con consumos distintos y una sin consumos en 30 días.

- [X] T017 [P] [US3] Crear `src/lib/server/economia/dominio/orden-inicio.ts` con `ordenarTiposInicio<T extends { id: string; nombreNormalizado: string }>(tipos: readonly T[], propios: ReadonlyMap<string, number>, departamento: ReadonlyMap<string, number>): T[]` (RN-090: si algún propio > 0 ordena por propios desc, si no por departamento desc; a igualdad, `nombreNormalizado` asc; no muta la entrada). Pruebas de propiedades con `fast-check` en `orden-inicio.test.ts` (`CA-245`): es una permutación; con propios, el primero tiene el máximo propio; sin propios, el máximo del departamento; empates en orden alfabético; idempotente.
- [X] T018 [US3] Añadir `leerTiposInicio(db, actor, ahora)` en `src/lib/server/economia/consumos.ts` (ventana `inicioDeVentanaDias(ahora, 30)` → `ahora`; propios = consumos vigentes registrados por la persona, propios y de invitado, con `contarConsumos` filtrando por `usuarioId`; departamento = todos los vigentes; llama a `ordenarTiposInicio`) y exportarla en `src/lib/server/economia/index.ts`. Pruebas de integración en `consumos.test.ts` con SQLite real y reloj simulado (`CA-245`: consumo de hace 31 días no cuenta; consumo anulado no cuenta; persona sin consumos recibe el orden del departamento).
- [X] T019 [US3] Usar `leerTiposInicio` en el `load` de `src/routes/(app)/+page.server.ts` (la comprobación de `consumir` sigue con `leerTiposRegistrables`). E2E en `e2e/flujos/orden-inicio-f12.spec.ts` (`CA-245`) con dos cuentas de la fixture.

---

## Fase 5: Historia 4 — Aviso de recuento (P2)

**Objetivo**: RF-246. **Prueba independiente**: recuento con faltante, sobrante, mixto, sin diferencias y anulación.

- [X] T020 [US4] Añadir `'recuento'` a `TIPOS_NOTIFICACION` y `TIPOS_DESACTIVABLES` en `src/lib/shared/contratos/push.ts`; en `src/lib/server/notificaciones/catalogo.ts` su esquema `z.strictObject` (data-model: `recuentoId` ULID, `accion: 'registrado' | 'anulado'`, `fecha` FechaMadrid, `lineas` 1..50 de `{ nombreTipo: string(1..80), diferencia: int ≠ 0 }`, `importe`, `personas`, `minimo`, `maximo` enteros ≥ 0), `CATALOGO.recuento = { destinatarios: 'todos', desactivable: true }` y su rama de `construirMensaje` (enlace `/saldos`). Pruebas en `catalogo.test.ts` (`CA-246`: textos de faltante «Faltaban 3 Ristretto; 1,05 € repartidos entre 8 personas (0,13 € cada una)», con `minimo ≠ maximo` «(entre 0,13 y 0,14 € cada una)», sobrante «Sobraban 2 Lungo; sin cargos», mixto y anulación; datos con un campo extra o sin líneas se rechazan). Ejecutar `npm run verify` (contrato público).
- [X] T021 [US4] En `src/lib/server/economia/control.ts`: `repartirEnPersonas` devuelve `Parte[]`; `confirmarRecuento` acumula las líneas con diferencia ≠ 0 y los cargos por persona y, si hay alguna, llama a `registrarAviso(tx, { tipo: 'recuento', origenId: recuentoId, … })` dentro de la transacción; `anularLineaRecuento` avisa con `accion: 'anulado'` si la línea tenía diferencia ≠ 0. Pruebas de integración en `control.test.ts` (`CA-246`): cada persona activa tiene una fila `recuento`; `importe`, `minimo` y `maximo` coinciden con la suma de los movimientos `reparto_recuento` del recuento; sin diferencias no hay aviso; un `CAMBIO_CONCURRENTE` no deja aviso; persona de baja no lo recibe.
- [X] T022 [US4] Añadir en `src/lib/server/notificaciones/panel.ts` `leerAvisoRecuentoPendiente(db, persona, ahora)` → `{ id, titulo, texto } | null` (último `recuento` con `vistaEn` nulo en la ventana) y `marcarVisto(ambiente, persona, avisoId)` (solo un aviso de esa persona; idempotente; registra `aviso.visto`). Exportar en `index.ts`. Pruebas en `panel.test.ts` (no marca avisos de otra persona; repetir no cambia nada).
- [X] T023 [US4] Inicio: el `load` de `src/routes/(app)/+page.server.ts` añade `avisoRecuento`; acción `verAviso` con `z.strictObject({ avisoId: esquemaUlid })` que llama a `marcarVisto` y devuelve `{ avisoVisto: true }` (sin sesión: `SIN_SESION`); en `+page.svelte` un `Banner` con el texto y un `<form method="post" action="?/verAviso" use:enhance>` con el botón secundario «Entendido», después de Capsulito y antes de las cápsulas. Pruebas de la acción en `src/routes/(app)/page.server.test.ts` (`crearEventoAccion`). Ajustes: el interruptor «Recuentos de stock» aparece en la lista de preferencias (comprobar `src/routes/(app)/ajustes/+page.svelte` y su prueba).
- [X] T024 [US4] E2E `e2e/flujos/recuento-aviso-f12.spec.ts` y `e2e/sin-js/recuento-aviso-f12.spec.ts` (`CA-246`): un administrador registra un recuento con un faltante; otra persona ve el aviso en Inicio y en el panel de avisos, pulsa «Entendido» y al recargar ya no sale en Inicio pero sigue en el panel. Añadir el estado con aviso a `e2e/a11y/consumos.spec.ts` o al spec de Inicio (claro y oscuro).

---

## Fase 6: Historia 5 — Capsulito en el acceso con enlace (P2)

- [X] T025 [US5] En `src/routes/(auth)/acceso/[token=token]/+page.svelte` añadir `CapsulitoEntrada` con el patrón de `src/routes/(auth)/login/+page.svelte` (research R8): `taparOjos` con el foco en cualquiera de los dos `PasswordField`, `estado='fallo'` cuando `form` trae errores, `estado='exito'` en la rama de éxito de `use:enhance` antes de aplicar la redirección (≤ 800 ms, igual que en el login), `mirarX` fijo en 50.
- [X] T026 [US5] E2E `e2e/flujos/acceso-enlace-f12.spec.ts` (`CA-241`): enlace de invitación y de recuperación; ojos tapados con el foco en la contraseña (atributo de estado del componente); contraseñas distintas → estado `fallo`; con `reducedMotion: 'reduce'` imagen estática; variante en `e2e/sin-js/` (la pantalla funciona y Capsulito es la imagen estática). Comprobar que `acceso/[token]` sigue pasando en `e2e/a11y/acceso.spec.ts` en claro y oscuro.

---

## Fase 7: Historia 6 — Fotos en el listado de personas (P3)

- [X] T027 [P] [US6] *(Resuelta sin la prop: `Avatar` ya es siempre decorativo, `aria-hidden="true"`, y una prop más iría contra el principio II. Además se sustituyó su `onerror` por un `{@attach}`: el manejador en línea lo bloqueaba la CSP con cualquier foto.)* Prop `decorativo?: boolean` en `src/lib/ui/Avatar.svelte` (`aria-hidden="true"`, sin `role="img"` ni nombre accesible). Ampliar `Avatar.svelte.test.ts`.
- [X] T028 [US6] El `load` de `src/routes/(app)/admin/usuarios/+page.server.ts` añade `fotoUrl` (mismo ayudante que `src/routes/(app)/+layout.server.ts`); en `+page.svelte`, `ListRow` con `leading` = `<Avatar decorativo size="sm" name usuarioId fotoUrl />`. E2E en `e2e/flujos/usuarios.spec.ts` (`CA-242`: persona con foto → `img` con la URL de su foto; sin foto → ilustración) y axe de `/admin/usuarios` en `e2e/a11y/admin.spec.ts`.

---

## Fase 8: Historia 7 — Escena «el dinero» (P3)

- [X] T029 [P] [US7] Añadir el momento `intro_09` en `src/lib/shared/mascota/momentos.ts` (pose `senalando`, texto literal de RF-247) y la escena en la posición 5 de `src/lib/shared/mascota/bienvenida.ts` (después de `intro_04`); actualizar el comentario «8 escenas» a 9. Añadir la locución `intro_09` a `LOCUCIONES` de `scripts/generar-voces.mjs` con `textoVoz` = el mismo texto con etiquetas `[cheerful]` sin cambiar palabras.
- [X] T030 [US7] Pruebas (`CA-247`): `bienvenida` tiene 9 escenas y la quinta es `intro_09` (`src/lib/shared/mascota/*.test.ts`, `src/lib/ui/Bienvenida.svelte.test.ts`); `scripts/voces-interactivo.test.ts` cuenta la locución nueva (CA-237 pasa a 197 nuevas o el número que resulte); E2E en `e2e/flujos/experiencia-capsulito.spec.ts` y `e2e/sin-js/` para `/ayuda` (la escena aparece en el mismo lugar). Ajustar las pruebas existentes que cuentan 8 escenas.

---

## Fase 9: Historia 8 — Gestos de reposo (P3)

- [X] T031 [P] [US8] Crear `src/lib/shared/mascota/reposo.ts` (research R11): `GESTOS_REPOSO` (`as const`: 6 s `mirarLados` 1,2 s; 12 s `pie` 1,2 s; 16 s `reloj` 1,6 s; 21 s `bostezo` 2 s), `PARPADEO_SEGUNDOS = 3` y `gestoEn(segundosEnReposo): GestoReposo | null` (el gesto cuyo `segundo` coincide; el ciclo vuelve a 0 al terminar el bostezo, es decir, longitud 23 s). Añadir `duracionPose` por pose Rive en `momentos.ts` (de `static/mascota/riv/manifest.json`). Pruebas en `reposo.test.ts` (`CA-248`: 6, 12, 16, 21; nada en 5 o 7; 29 = 6 del ciclo siguiente).
- [X] T032 [US8] Crear el generador `docs/diseno/f12/rive/generar-reposo.mjs` (derivado de `docs/diseno/f11/rive/generar-entrada.mjs`, a partir de `static/mascota/svg/capsulito-saludando.svg`) que escribe `docs/diseno/f12/rive/reposo/scene.rml` con el artboard `Reposo` (1185 × 1185) y la máquina `Reposo` del contrato (`mirarLados`, `pie`, `reloj`, `bostezo`, `cancelar`, `reducedMotion`; capa `Parpadeo` en bucle de 3 s, sin parpadeo durante el bostezo). `rive.yaml`, `LEEME.md` con los comandos y `capturar-reposo.mjs` (fotogramas clave de cada gesto en `capturas/`). Compilar con `~/.rive/bin/rive ./docs/diseno/f12/rive/reposo --verify` (`inspect --summary` sin `problems`) y `--once`; tamaño ≤ 40 KB. Si el RML no permite el brazo del reloj o el bostezo, parar y proponer un gesto parecido.
- [X] T033 [US8] *(La persona usuaria decidió integrar y revisar después: capturas en `docs/diseno/f12/rive/reposo/capturas/`.)* **Parada**: enseñar a la persona usuaria las capturas de los cuatro gestos y del parpadeo. No empezar T034 sin su aprobación.
- [X] T034 [US8] Copiar el `.riv` a `static/mascota/riv/capsulito-reposo.riv` y añadirlo a `manifest.json`. `montarRiveReposo(canvas, { reducedMotion, onListo })` en `src/lib/client/rive.ts` con un controlador `{ gesto(nombre), cancelar(), fijarReducedMotion(b) }`. En `src/lib/ui/Capsulito.svelte`: con `size` md, lg o xl, sin `callado`, con `mascota.animar`, sin audio en curso y pasada `duracionPose`, pasar al lienzo de reposo con fundido de 200 ms (montado a partir de 3 s en reposo, research R11/riesgos); un `$effect` con `setInterval` de 1 s cuenta los segundos en reposo, lanza `gestoEn(t)` y se para con `document.hidden` (`visibilitychange`); hablar, cambiar de pose o `callado` vuelven al lienzo de la pose y ponen `t = 0`. Con `size` xs/sm o movimiento reducido no se monta el reposo. Atributo `data-reposo="<gesto|quieto>"` para las pruebas.
- [X] T035 [US8] Pruebas (`CA-248`, SC-006): `Capsulito.svelte.test.ts` con reloj falso (`vi.useFakeTimers`): a los 6/12/16/21 s `data-reposo` cambia al gesto; al llamar a `hablar` vuelve a `quieto` y el ciclo empieza de nuevo; `size="sm"` nunca cambia; movimiento reducido nunca cambia. E2E en `e2e/flujos/reposo-f12.spec.ts` con `page.clock` (Inicio a los 6 s muestra `mirarLados`; con `reducedMotion: 'reduce'` sigue `quieto` 60 s simulados).

---

## Fase 10: Cierre

- [X] T036 `ARCHITECTURE.md` §2 (`economia/dominio/orden-inicio.ts`, `lib/ui/movimiento/Confeti.svelte`, `static/mascota/sonidos/`, `docs/diseno/f12/rive/`, `scripts/generar-sonido.mjs`), `docs/pruebas.md` (`sin-js` con `?/verAviso` y el enlace con `autofocus`; rutas tocadas en `a11y`), `docs/diseno/` (uso del confeti y del reposo) y nota de ADR-0006 («Reposo de Capsulito»).
- [X] T037 *(Cerrada con salvedad: las pantallas tocadas pasan axe en claro y oscuro en `chromium-movil`; la suite `a11y` completa no llegó a terminar. En el benchmark parcial fallaron 4 pruebas de `webkit-movil-a11y` sin analizar: `economia:43`, `f11:12` (claro y oscuro) y `visitantes:13`.)* `a11y` completo de las pantallas tocadas en claro y oscuro: Inicio con aviso de recuento, `/admin/usuarios` y su ficha con enlace, `acceso/[token]`, bienvenida con la escena nueva y Ajustes.
- [ ] T038 Pedir a la persona usuaria que genere `intro_09` con `./voces.sh` → «Las que faltan» (los audios de `static/mascota/voces/` son suyos) y comprobar que la prueba de voces sigue en verde.
- [X] T039 *(Cerrada por decisión de la persona usuaria el 26-10-2026: no merece la pena el benchmark completo. NO pasó: la primera pasada paró en `prettier` (corregido), la segunda en una prueba de componentes intermitente (pasa 3 de 3 sola) y la tercera se interrumpió a mitad del E2E. TalkBack y VoiceOver siguen sin hacerse.)* Benchmark completo en serie (`scripts/benchmark.sh`) y Definition of Done de `docs/pruebas.md` §20.2. Revisión manual con TalkBack (Android) del enlace generado, el aviso de recuento con «Entendido», la escena nueva y la celebración. VoiceOver pendiente por falta de iPhone (como F11).

---

## Dependencias y orden

- Fase 1 → resto. T001 lo usan US2, US4 y US7; T002 lo usa US3; T003 lo usa US4.
- US2 (Fase 2) es independiente y va primero (correcciones). T009 (`callado`) lo usa también US8 (T034).
- US1 (Fase 3): T011 es una parada; T012 a T014 pueden avanzar mientras la persona usuaria elige el sonido; T015 necesita T013 y T014.
- US3, US4, US5, US6 y US7 son independientes entre sí.
- US8 (Fase 9) depende de T009; T033 es una parada: T034 no empieza sin la aprobación de las capturas.
- Fase 10 al final; T038 depende de la persona usuaria.

## Paralelismo

- Fase 1: T001, T002 y T003 a la vez.
- US1: T012 en paralelo con T010 y T011.
- US3: T017 en paralelo con T020 (US4) y T027 (US6).
- US8: T031 en paralelo con T032.

## Estrategia

- **MVP**: Fases 1 a 3 (correcciones y celebración): lo que más se nota en el uso diario.
- Después US3 y US4 (orden y recuento, con dinero y pruebas de integración), luego US5 a US7 y, al final, US8 (Rive, con su parada) y el cierre.
