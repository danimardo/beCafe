# Tareas: corto vertical de Capsulito

**Fuente:** [spec.md](spec.md) y [plan.md](plan.md), aprobados en la sesión del 2026-10-26.

- [x] T01 — Preparar guion de rodaje con lista de planos, subtítulos, transcripción y tiempos de animática.
- [x] T02 — Dibujar la lámina 9:16 y los SVG por capas de cafetera, armario, taza, cápsulas, cajas, lupa, megáfono, hucha y móvil; reutilizar Capsulito.
- [x] T03 — Montar una animática muda y revisar lectura en 1080 × 1920 y 360 × 640, sin confundir saldo personal con hucha. La animática de revisión se codifica a 540 × 960, escalable a 9:16; el plano piloto Rive usa 1080 × 1920.
- [x] T04 — Construir y verificar el plano piloto en RML/Rive; probar `.riv` → vídeo, fotogramas y sincronía. La captura en tiempo real perdió fotogramas; la exportación determinista conserva 9 s.
- [x] T05 — Animar los planos restantes, compilar `.riv` y preparar capturas para revisión. Siete proyectos RML compilados sin errores ni advertencias; lámina Rive preparada.
- [x] T06 — Integrar el generador por tandas de voces del trabajo paralelo; siete MP3 y JSON de boca generados, duraciones contrastadas con los archivos y locuciones auditadas mediante transcripción local. VTT de 14 intervalos validado.
- [x] T07 — Montar MP4 9:16, portada, VTT y transcripción. Verificados 61,000 s, 1080 × 1920, 30 fps, 1830 fotogramas, H.264 + AAC, decodificación completa y lectura a 360 × 640; estado Git revisado sin archivos sensibles.

## Segunda versión: HTML con SVG por piezas (plan.md §6)

- [x] T08 — Montar a Capsulito por piezas (`html/capsulito.js`): brazos y piernas con cinemática inversa, ciclo de andar con los pies apoyados, párpados, cejas y boca de 8 formas sincronizada con las pistas de ADR-0006.
- [x] T09 — Dibujar el decorado común (`html/decorado.js`): cocina, reloj, cafetera con piloto y vapor, armario con puerta articulada, huecos de cápsulas y papel de apuntes. Cápsulas con forma de cápsula real.
- [x] T10 — Exportador de planos (`html/capturar-plano.mjs`): captura por fotograma a 1080 × 1920 y 30 fps, con la locución, y hojas de fotogramas para la revisión.
- [x] T11 — Plano 1 piloto (`html/plano-01.*`, `entrega/planos/plano-01.mp4`, 9,6 s), revisado por el agente con hojas de fotogramas.
- [x] T12 — **Parada**: la persona usuaria revisa el plano 1. Aprobado el 2026-10-26, con un cambio: quitar la leyenda «beCafé» del pie (hecho en todos los planos).
- [x] T13 — Módulo común `html/plano.js` (cámara por claves, voz por tramos, subtítulos y vista previa) y velo bajo el título.
- [x] T14 — Plano 2 (`html/plano-02.*`, `entrega/planos/plano-02.mp4`, 10,2 s): «Un momento», el papel «Ristretto · quedan 6», la última cápsula que se escapa al fondo y «hay aire» a cámara. Empieza donde acaba el plano 1.
- [x] T15 — **Parada**: la persona usuaria revisa el plano 2. Aprobado el 2026-10-26; pide hacer los planos 3 a 7 de una vez, sin parada entre ellos.
- [x] T16 — Planos 3 a 7 (`html/plano-03…07.*`, `html/objetos.js`, `entrega/planos/`), revisados por el agente con hojas de fotogramas. El decorado gana la hucha en la encimera (se vuelven a exportar los planos 1 y 2), la taza bajo la cafetera y el estado de cada cápsula (`armarioAlEmpezar`), para que ninguna cápsula gastada vuelva a aparecer.
- [x] T17 — Regenerar `corto_05` y `corto_07` con «Bicafé» en `textoVoz` (autorizado el 2026-10-26).
- [x] T18 — Música y efectos (`html/banda-sonora.mjs`), montaje final de 72,4 s (`html/montar-corto.mjs`), subtítulos VTT, transcripción, portada y lámina.

## Integración en la aplicación (spec.md y plan.md §7, pendientes de aprobación)

La spec está aprobada y el CAMBIO-025 está hecho. El `plan.md` §7 está aprobado: T20 a T28 se pueden ejecutar.

- [X] T19 — **CAMBIO-025** *(hecho el 2026-10-26: historias.md v0.25.0, respaldo de 0.24.0 en `.respaldos/`)* en `historias.md`: RF-195 modificado, RF-249 a RF-252 y CA-249 a CA-252 nuevos. Antes, respaldo en `.respaldos/`. Solo con la autorización expresa de la persona usuaria.
- [X] T20 — *(`exportar-web.mjs`; 3,1 MB; prueba `scripts/exportar-web-corto.test.ts`)* Versión web: `docs/diseno/corto-capsulito/html/exportar-web.mjs` genera `static/corto/` (MP4 de 720 × 1280 de 4 a 6 MB, `portada.jpg`, `subtitulos.vtt`); su prueba comprueba tamaño, resolución y subtítulos.
- [X] T21 — *(filtro `startsWith("corto/")` comprobado en el `service-worker.js` compilado)* `src/service-worker/index.ts` excluye `corto/` de la precarga. Comprobar que el MP4 no aparece en `ESTATICOS`.
- [X] T22 — *(sección `textos.corto`, con la transcripción)* Textos de la portada, la transcripción y «Ver el corto otra vez» en `src/lib/shared/textos.ts`.
- [X] T23 — *(8 pruebas de componente; el `src` se asigna al pulsar)* `src/lib/ui/Corto.svelte` (modos `antesDeEntrar` y `dialogo`), exportado en `src/lib/ui/index.ts`, con su prueba de componente (CA-249, CA-251, CA-252).
- [X] T24 — *(`cortoManual`, `repetirCorto()` y `cortoPendiente` en `EstadoMascota`; diálogo en el layout `(app)`)* `EstadoMascota.cortoManual` y `repetirCorto()`; el layout `(app)` abre el diálogo.
- [X] T25 — *(login, enlace de visitante, `acceso/[token]`, Ajustes y Ayuda)* Integrar `Corto` en `login`, en el enlace de visitante y en `acceso/[token=token]`, antes de la bienvenida. «Ver el corto otra vez» en Ajustes y en Ayuda.
- [X] T26 — *(`flujos/corto-f13` 9 pruebas, `sin-js/corto-f13` y axe de la portada en `a11y/acceso`; E2E ajustados para saltar el corto)* E2E (`e2e/flujos/corto-f13.spec.ts` y `e2e/sin-js/corto-f13.spec.ts`): contexto limpio, marca puesta, sin conexión, «Saltar» visible y de ≥ 24 × 24 px, volver a verlo. Axe en claro y oscuro de las pantallas con la portada.
- [X] T27 — *(`ARCHITECTURE.md`, `docs/pruebas.md` y `LEEME.md` del corto)* Documentación: `ARCHITECTURE.md` §2, `docs/pruebas.md`, `docs/diseno/` y una nota en el ADR-0006 si cambia algo de las voces (no cambia).
- [X] T28 — *(`npm run verify` en verde: 839 de servidor y 106 de componentes, 0 avisos; E2E del corto en chromium-movil, chromium-escritorio y webkit-movil, con las intermitencias conocidas de WebKit/Rive)* Verificación del cierre: `npm run verify` y los E2E afectados.
- [ ] T29 — Benchmark completo. **No se hace** por decisión de la persona usuaria (2026-10-26): no se ejecuta mientras esta casilla siga desmarcada. Revisión con TalkBack: pendiente de la persona usuaria.

