# Constitución de beCafé

Palabras normativas: DEBE (MUST), NO DEBE (MUST NOT), DEBERÍA (SHOULD), NO DEBERÍA (SHOULD NOT) y PUEDE (MAY).

## Principios fundamentales

### I. Fuente vigente y trazabilidad

- Cada comportamiento implementado DEBE proceder de una regla aprobada en la `spec.md` de su
  funcionalidad o, mientras no se haya traspasado, en `historias.md`.
- Cada regla DEBE tener un único enunciado vigente y un único documento dueño. Los demás documentos
  la citan por su ID (RN, RF, CA, INV, EV, DEC).
- Un agente NO DEBE inventar reglas de negocio, valores por defecto ni umbrales. Si falta una regla,
  DEBE preguntar.
- Una propuesta técnica NO DEBE tratarse como decisión aprobada por el hecho de copiarla a otro
  documento.

Motivo: dos enunciados de la misma regla terminan divergiendo, y una regla inventada por un agente
cambia el reparto de dinero entre personas.

### II. La complejidad necesita justificación

- Cada capa, abstracción, dependencia, tarea programada, caché o mecanismo de comunicación nuevo
  DEBE responder a un problema concreto, escrito en el `plan.md` correspondiente.
- El código DEBERÍA resolver un problema de una sola forma en todo el proyecto.
- Se DEBERÍA preferir una implementación local sencilla hasta que exista reutilización real.

Motivo: la aplicación tiene unos 10 usuarios y una instancia; cada pieza sin problema concreto solo
añade coste de mantenimiento.

### III. Módulos con API pública y dependencias en un solo sentido

- El código de servidor DEBE organizarse en módulos por capacidad, con un único punto de entrada
  público, según `ARCHITECTURE.md`.
- Un módulo NO DEBE importar archivos internos ni tablas de otro módulo, ni escribir en ellas.
- El grafo de dependencias entre módulos NO DEBE tener ciclos.
- El código de cliente NO DEBE importar código de servidor.
- Las rutas NO DEBEN contener reglas de negocio ni acceso directo a la base de datos.
- Estas reglas DEBEN comprobarse de forma automática en la verificación.

Motivo: el riesgo principal a largo plazo es que los agentes acoplen el código poco a poco; un
límite que comprueba una herramienta no depende de la memoria del agente.

### IV. Integridad económica (núcleo)

- Los importes DEBEN guardarse y calcularse como enteros (céntimos; coste medio en diezmilésimas
  de euro).
- Los registros económicos y los movimientos NO DEBEN modificarse ni borrarse. Se corrigen con
  anulaciones y movimientos nuevos.
- Los saldos DEBEN derivarse del libro de movimientos.
- Cada registro económico y todos sus efectos DEBEN guardarse en una única transacción.
- Las operaciones que el cliente puede repetir DEBEN ser idempotentes mediante un identificador
  generado en el cliente.
- Cada invariante del dominio DEBE tener una prueba automatizada que intente violarla.

Motivo: el dinero de la hucha común es la base de la confianza entre compañeros (NEC-007); un
error de redondeo o un cargo duplicado la rompe.

### V. Seguridad en el servidor

- Toda entrada del cliente DEBE tratarse como no confiable y validarse en el servidor.
- Cada permiso DEBE comprobarse en el servidor, en el caso de uso, y no solo ocultando elementos de
  la interfaz.
- Los secretos NO DEBEN estar en el repositorio. Solo un módulo de configuración DEBE leer las
  variables de entorno.
- Los registros de log NO DEBERÍAN contener datos personales ni secretos. Cada excepción DEBE estar
  documentada con su requisito.

Motivo: la aplicación está expuesta a internet y el repositorio es público.

### VI. Tipado estricto sin escapes

- TypeScript DEBE usarse en modo estricto.
- El código y las pruebas NO DEBEN usar aserciones de tipo (salvo `as const`), `any`, la aserción
  de no nulo, ni comentarios que desactiven el compilador o el linter.
- Una regla de una herramienta NO DEBE saltarse excluyendo archivos de su configuración.

Motivo: cada escape de tipos oculta un error que el compilador habría detectado antes que las
pruebas.

### VII. Pruebas proporcionales al riesgo

- Cada criterio de aceptación (CA) y escenario de verificación (EV) del alcance de una tarea DEBE
  tener al menos una prueba que lo identifique.
- Las reglas económicas DEBEN probarse con pruebas unitarias y, cuando hay secuencias o redondeos,
  con pruebas basadas en propiedades.
- Las operaciones transaccionales y concurrentes DEBEN probarse contra la base de datos real del
  proyecto.
- El reloj y el azar DEBEN poder sustituirse en las pruebas.

### VIII. Verificación como condición de terminado

- Una tarea NO DEBE declararse terminada sin que la verificación agregada del proyecto termine sin
  errores.
- La integración continua DEBE ejecutar la misma verificación en cada pull request y en cada cambio
  de la rama principal.
- La verificación completa DEBERÍA ejecutarse en minutos. Cuando se vuelva lenta, se DEBE medir
  antes de optimizar.

Motivo: generar código no demuestra que funcione; una verificación lenta deja de ejecutarse.

### IX. Accesibilidad e idioma

- La interfaz DEBE cumplir WCAG 2.2 nivel AA.
- La interfaz DEBE estar solo en español (es-ES), con textos centralizados.
- Las especificaciones, los planes, los contratos, los ADR, `ARCHITECTURE.md` y `CLAUDE.md` DEBEN
  redactarse conforme a UNE-ISO 24495-1:2024 y al Español Técnico Simplificado: un término por
  concepto según el glosario, voz activa con sujeto explícito y verbos verificables.

### X. Errores, avisos y observabilidad

- Los errores esperados DEBEN expresarse con códigos de un conjunto cerrado y mensajes en español.
- Los errores no previstos DEBEN registrarse con un identificador y NO DEBEN mostrar detalles
  internos al usuario.
- El fallo de un aviso o de una notificación NO DEBE bloquear ni deshacer el registro que lo
  originó.
- Los registros de log DEBEN ser estructurados.

### XI. Datos, migraciones y compatibilidad

- Las migraciones de base de datos DEBEN ser solo de avance y NO DEBEN modificarse después de
  aplicarse en un entorno compartido.
- Una migración NO DEBE recalcular cargos ni movimientos ya generados.
- Un cambio en un contrato que reciben clientes con datos en cola DEBE seguir aceptando el formato
  anterior mientras puedan existir esos datos.

Motivo: un móvil puede conservar consumos en su cola sin conexión durante un despliegue.

### XII. Agentes de IA

- Un agente DEBE seguir `CLAUDE.md` y `ARCHITECTURE.md`.
- Un agente NO DEBE romper una regla de esta constitución ni de `ARCHITECTURE.md` en silencio.
  DEBE describir el conflicto y proponer un cambio de diseño o un ADR.
- Un agente NO DEBE modificar esta constitución fuera del comando `/speckit-constitution`.

## Restricciones del proyecto

Las restricciones RT-001 a RT-011 de `historias.md` (PWA mobile first, SvelteKit y Tailwind CSS,
Docker y Coolify, SQLite, una sola instancia, contraseñas de 15 caracteres, WCAG 2.2 AA, español,
nombre «beCafé») son obligatorias. Esta constitución las referencia y no las repite.

## Flujo de desarrollo

- Cada funcionalidad sigue el ciclo de SpecKit: specify, clarify, plan, tasks, analyze, implement y
  converge.
- `spec.md` describe QUÉ y POR QUÉ. `plan.md` describe CÓMO, dentro de la arquitectura global.
  `tasks.md` contiene trabajo implementable y aislable.
- Todo `plan.md` DEBE superar la revisión de arquitectura (Architecture Check) de
  `ARCHITECTURE.md` antes de generar tareas.
- Antes de aceptar un traspaso desde `historias.md`, se DEBEN cotejar requisitos y diseño en los dos
  sentidos y conservar los IDs.
- Una dependencia nueva DEBE justificarse en el `plan.md` según `ARCHITECTURE.md`.

## Gobierno

- Esta constitución prevalece sobre cualquier otra práctica del proyecto.
- Una enmienda DEBE hacerse con `/speckit-constitution`, indicar su motivo y versionarse: MAYOR si
  elimina o redefine un principio, MENOR si añade un principio o amplía uno, PARCHE si solo aclara
  la redacción.
- Un cambio de arquitectura que contradiga esta constitución DEBE registrarse en un ADR antes de la
  enmienda.
- Cada revisión de un plan o de un pull request DEBE comprobar el cumplimiento de esta
  constitución.

**Versión**: 1.0.0 | **Ratificada**: 2026-10-21 | **Última enmienda**: 2026-10-21
