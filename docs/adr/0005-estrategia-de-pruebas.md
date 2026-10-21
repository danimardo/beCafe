# 0005 — Verificación por impacto con puertas, componentes en navegador real y mutación en dominio

- **Estado:** Aceptado
- **Fecha:** 21-10-2026
- **Requisitos relacionados:** principios VIII, IX y XI; RNF-001, RNF-013; DEC-088 a DEC-094; `docs/pruebas.md`

## Contexto

- La constitución 1.4.0 (IX) exige la verificación agregada completa para cerrar **cada tarea**. Con ocho funcionalidades, decenas de tareas y una batería que crecerá (cobertura, build, E2E en tres proyectos), la espera se multiplica y una verificación lenta termina saltándose.
- Los componentes con estado propio (la cuenta atrás de «Deshacer», el botón de cápsula, la cola pendiente) son lentos y frágiles de probar solo con E2E. jsdom no tiene layout, foco real, IndexedDB ni service worker.
- La cobertura no demuestra que las pruebas de `dominio/` detecten errores en los cálculos de dinero.

## Decisión

1. **Verificación por impacto.** Una tarea o un lote ejecuta solo lo afectado. La verificación completa, en serie con `scripts/benchmark.*`, se ejecuta en la **puerta de cada funcionalidad**. La CI ejecuta `verify` y la matriz E2E en cada push a `main` y en cada PR.
2. **Componentes en navegador real**, solo cuando un componente reutilizable tiene estado o interacción propia: Vitest Browser Mode con `@vitest/browser-playwright` y `vitest-browser-svelte`. Usa el mismo Chromium de Playwright y no cuenta para la cobertura.
3. **Matriz de Playwright:** `chromium-movil`, `webkit-movil`, `chromium-escritorio`, `sin-js` y `api`. En el trabajo diario se usa solo `chromium-movil`.
4. **Regresión visual** con `toHaveScreenshot`, pocas capturas, solo en `chromium-movil` y en las puertas.
5. **Mutación** con StrykerJS (`@stryker-mutator/core` y `@stryker-mutator/vitest-runner`) solo sobre `dominio/`. Primero se fija una línea base en F4, sin umbral previo.

## Alternativas consideradas

- **`verify` completo por tarea:** máxima seguridad local, pero un coste que crece con el proyecto.
- **`verify` por lote y E2E en las puertas:** intermedio. La CI ya cubre `main`, así que no aporta más que la opción elegida.
- **Componentes con jsdom y Testing Library:** rápido, pero es un entorno distinto del real y no tiene las API de navegador que usa la aplicación.
- **Solo E2E:** sin dependencias nuevas, pero los estados difíciles se prueban despacio y con fragilidad.
- **Firefox en la matriz:** no está en RNF-013.
- **Mutación obligatoria con umbral:** cualquier umbral sin línea base sería inventado.

## Consecuencias

- Exige enmendar los principios VIII y IX y la tabla de tecnologías (constitución 1.5.0), y actualizar `CLAUDE.md` §6 y §7.
- Cuatro dependencias de desarrollo nuevas: `@vitest/browser-playwright`, `vitest-browser-svelte`, `@stryker-mutator/core` y `@stryker-mutator/vitest-runner`.
- Una tarea puede cerrarse con la verificación completa en rojo en una parte no afectada. La puerta de funcionalidad y la CI lo detectan antes de que la funcionalidad se dé por terminada.
- La selección por impacto depende del criterio del agente. `docs/pruebas.md` §17 fija las condiciones que obligan a ejecutar `verify`.
