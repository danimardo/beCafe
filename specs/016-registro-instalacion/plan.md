# Implementation Plan: Registro de quién instala la aplicación (F16)

**Branch**: `main` (AGENTS.md §9) | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Input**: `specs/016-registro-instalacion/spec.md`, aprobada el 2026-10-27 y traspasada a `historias.md` v0.28.0 (CAMBIO-028). Constitución 1.9.0.

**Status**: Aprobado por la persona usuaria el 2026-10-27.

## Summary

F16 guarda en el servidor, por persona, si ha instalado la aplicación, y lo muestra a los administradores en la ficha de Usuarios.

- **Ya hecho** (27-10-2026, antes de la spec): la captura temprana del aviso de instalación y el diagnóstico de Ajustes (RF-276, RF-277). Solo faltan sus pruebas nombradas con CA-276 y CA-277 y la actualización de la documentación.
- **Nuevo**: una tabla `instalacion_app` en `usuarios`, un caso de uso que aplica las transiciones, una *action* que recibe el estado desde el navegador, una línea en la ficha y la versión 5 de privacidad.

Una migración (tabla nueva). Sin dependencias nuevas. Nada toca datos económicos.

## Technical Context

**Language/Version**: TypeScript 6 (estricto), Node 24, SvelteKit 3, Svelte 5 (runes)
**Primary Dependencies**: las de la constitución. Ninguna nueva.
**Storage**: SQLite. Tabla nueva `instalacion_app` (migración `0010_f16-instalacion.sql`).
**Testing**: Vitest (propiedades con `fast-check`, integración con SQLite real), Vitest Browser Mode (componente), Playwright (E2E, `sin-js`, axe).
**Target Platform**: Docker en Coolify, una instancia; móvil primero.
**Performance Goals**: el envío no bloquea ninguna pantalla (RNF-F16-2). El navegador lo envía una vez por carga y solo si el servidor no tiene ya ese dato.
**Constraints**: constitución III, V, VI, XIII, XVI y XVII; no se guarda nada en el navegador.
**Scale/Scope**: unos 10 usuarios.

## Constitution Check

| Principio | Cumplimiento |
| --- | --- |
| I. Trazabilidad | Cada decisión cita RF-276 a RF-283, EV-116 y DEC-139 de `historias.md` v0.28.0. |
| II. Complejidad | Una tabla con un problema concreto (saber quién ha instalado, en todos sus dispositivos). Sin dependencias, tareas ni cachés nuevos. |
| III. Módulos | Tabla, dominio y casos de uso en `usuarios`. Las rutas solo validan, llaman a la función pública y traducen el resultado. |
| IV. Integridad económica | No aplica. |
| V. Almacenamiento | El estado vive en el servidor. El navegador no guarda nada: el diagnóstico está solo en memoria. Fechas en UTC. |
| VI. Seguridad | La entrada se valida con `z.strictObject`. Cada persona solo escribe su propio estado. Solo un administrador lo lee, comprobado en el caso de uso, no solo en la interfaz. |
| X. Usabilidad | El envío es silencioso y no bloquea. Sin errores visibles (RNF-F16-3). |
| XI. Accesibilidad | La línea de la ficha es texto. El diagnóstico usa una lista de definiciones. Axe en claro y oscuro de Ajustes y de la ficha. |
| XIII. Errores | Un fallo al guardar no se muestra ni bloquea nada. |
| XVI. Registro | Evento nuevo `instalacion.registrada` con `usuarioId` y `estado`. Sin nombres ni correos. |
| XVII. SvelteKit | Formulario con *action* con nombre y `use:enhance`. Sin JavaScript no hay aviso de instalación: es una excepción cerrada de XVII (la instalación de la PWA). |
| XVIII. Identidad visual | Solo tokens. Sin cristal. |

Resultado: **supera la revisión**. No hace falta enmienda.

## Diseño

### D1. Datos (RF-278)

Tabla `instalacion_app` en `usuarios/esquema.ts`:

| Columna | Tipo | Regla |
| --- | --- | --- |
| `usuario_id` | `text` | Clave primaria y clave foránea a `usuario`. |
| `estado` | `text` | `CHECK (estado IN ('instalada', 'rechazada'))`. |
| `instante` | `text` | UTC ISO 8601. Instante del último cambio de estado. |

Una fila por persona. «Sin datos» es la ausencia de fila.

### D2. Dominio y caso de uso (RF-280, RF-283)

- `usuarios/dominio/instalacion.ts` (puro): `siguienteEstadoInstalacion(actual: Estado | null, entrante: Estado) → { estado: Estado; cambia: boolean }`.
  - De `null` a cualquiera: cambia.
  - De `rechazada` a `instalada`: cambia.
  - `instalada` con cualquier entrante: no cambia.
  - `rechazada` con `rechazada`: no cambia.
- `usuarios/instalacion.ts`, exportado por `index.ts`:
  - `registrarInstalacion(ambiente, actor, estado)`: una persona registra su propio estado. Lee y escribe en una sola transacción, sin `await` dentro. Si no cambia, no escribe. Si cambia, hace `INSERT … ON CONFLICT DO UPDATE` y emite `instalacion.registrada`.
  - `leerInstalacion(db, actor, usuarioId)`: exige administrador (`exigirAdministrador`) y devuelve `{ estado, instante } | null`.
- Evento en `plataforma/registro.ts`: `instalacion.registrada` (nivel `info`, campos `{ usuarioId: string; estado: 'instalada' | 'rechazada' }`).

### D3. Contrato y *action* (RF-279)

- `lib/shared/contratos/instalacion.ts`: `esquemaRegistrarInstalacion = z.strictObject({ estado: z.enum(['instalada', 'rechazada']) })`.
- *Action* `registrarInstalacion` en `src/routes/(app)/+page.server.ts` (junto a `descartarInstalacion`). Valida, llama a `registrarInstalacion` y devuelve `{ registrada: true }`. Un rechazo esperado vuelve con `fail`.
- El formulario vive en el layout de `(app)` y apunta a `/?/registrarInstalacion`, para funcionar desde cualquier pantalla. `use:enhance` envía sin recargar y no llama a `update()`.

### D4. Cliente (RF-279)

- Componente `src/routes/(app)/RegistroInstalacion.svelte`, montado en `+layout.svelte` solo si hay persona.
- Al montar, llama a `crearInstalacion(window, …)`, que ya comparte la captura de `hooks.client.ts`. Decide qué enviar:
  - Si `estado() === 'instalada'` y el servidor no tiene `instalada`: envía `instalada`. Cubre aceptar el diálogo, `appinstalled` y abrir en `standalone`.
  - Si `diagnostico().resultado === 'rechazada'` y el servidor no tiene dato: envía `rechazada`.
- El `+layout.server.ts` añade `instalacion: 'instalada' | 'rechazada' | null` (el estado propio de la persona) para evitar envíos repetidos. Tras enviar, una bandera local del componente evita reenviar en esa carga.
- Un fallo de red no se reintenta: la siguiente carga repite la detección.

### D5. Ficha de Usuarios (RF-281)

- El `load` de `admin/usuarios/[usuarioId]` añade `instalacion: leerInstalacion(...)`.
- `+page.svelte` muestra una línea de texto: «Aplicación instalada desde {fecha}», «Rechazó instalarla el {fecha}» o «Sin datos». Los textos están en `textos.ts`.
- Un miembro ya recibe 403 en esa ruta por `obtenerPersona`.

### D6. Privacidad versión 5 (RF-282)

- `VERSION_PRIVACIDAD = 5` en `lib/shared/privacidad.ts`.
- Dos líneas nuevas en `TEXTO_PRIVACIDAD`: entre los datos guardados y en «Quién los ve» (iguales al anexo A v5 de `historias.md`).
- Ajustar las pruebas afectadas (CA-224, CA-282), como en F15.

### D7. Lo ya implementado (RF-276, RF-277)

Sin cambios de código previstos. Solo:

- Nombrar con CA-276 y CA-277 las pruebas que ya existen en `instalacion.test.ts` y `e2e/flujos/ajustes.spec.ts`, hoy con CA-206.
- Actualizar `ARCHITECTURE.md` y `docs/pruebas.md`.

## Project Structure

```text
drizzle/0010_f16-instalacion.sql (+ meta)
src/lib/server/usuarios/{esquema,instalacion,index}.ts, usuarios/dominio/instalacion.ts (+ pruebas)
src/lib/server/plataforma/registro.ts
src/lib/shared/contratos/instalacion.ts (+ prueba), src/lib/shared/privacidad.ts, src/lib/shared/textos.ts
src/routes/(app)/{+layout.server.ts,+layout.svelte,+page.server.ts,RegistroInstalacion.svelte}
src/routes/(app)/admin/usuarios/[usuarioId=ulid]/{+page.server.ts,+page.svelte}
e2e/flujos/instalacion-f16.spec.ts, e2e/a11y/ (ficha), ARCHITECTURE.md, docs/pruebas.md
```

## Estrategia de pruebas

- **Propiedades** (EV-116): para cualquier secuencia de estados entrantes, `instalada` nunca vuelve a `rechazada` y repetir un estado no cambia el instante.
- **Integración con SQLite real** (CA-278, CA-280, CA-283): una fila por persona, transiciones, instante estable y evento sin datos personales.
- **Evento falso** (CA-279, CA-281): la *action* con sesión, sin sesión y con una entrada inválida; `leerInstalacion` con administrador y con miembro (403).
- **Componente**: `RegistroInstalacion` envía `instalada` o `rechazada` según el estado y no reenvía si el servidor ya lo tiene.
- **E2E** (CA-276, CA-277, CA-279, CA-281): un `beforeinstallprompt` simulado antes de entrar y el botón «Instalar» en Ajustes; un `appinstalled` simulado y la línea de la ficha vista por un administrador; axe en claro y oscuro de la ficha y de Ajustes.
- **Privacidad** (CA-282): subir a la versión 5 obliga a aceptar de nuevo.

## Riesgos y límites

- **Sin dato de desinstalación**: la ficha muestra la fecha del último cambio.
- **Chrome decide**: si nunca lanza el aviso, no hay estado `rechazada`.
- **`standalone` en iOS**: se registra `instalada` al abrir la aplicación desde el icono, no al añadirla.
- **WebKit**: el simulador de eventos puede no equivaler a Safari real. La comprobación con un móvil real queda para ti.
