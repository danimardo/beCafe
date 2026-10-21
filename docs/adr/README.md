# Decisiones de arquitectura (ADR)

Un ADR registra una decisión importante y difícil de revertir. Las decisiones de negocio y las que ya están aprobadas en `historias.md` (DEC-NNN) no se repiten aquí: el ADR las enlaza.

| ADR | Decisión | Estado |
| --- | --- | --- |
| [0001](0001-sveltekit-3.md) | SvelteKit 3 como framework | Aceptado |
| [0002](0002-aplicacion-unica-modulos.md) | Aplicación única en la raíz con módulos de servidor y API pública | Propuesto (ubicación en la raíz: decidida) |
| [0003](0003-avisos-registrados-en-transaccion.md) | Avisos registrados en la transacción del caso de uso y entregados después | Propuesto |
| [0004](0004-registro-tecnico-ficheros-y-cliente.md) | Registro técnico en ficheros rotados y registro del cliente enviado al servidor | Aceptado |

**Decisiones de arquitectura ya registradas en `historias.md`** (no tienen ADR propio): SQLite y copia diaria a S3 (DEC-028, DEC-029), Coolify con una instancia (DEC-027, RT-010, DT-050), autenticación propia con sesiones (DEC-014, DEC-031), libro de movimientos (DEC-003, DT-001), cola de consumos sin conexión (DEC-025, DT-020), Web Push (DEC-020).

## Cuándo crear un ADR

- Se añade o se sustituye un framework, una base de datos, un mecanismo de comunicación o una dependencia transversal.
- Se añade una arista al grafo de módulos que contradice el §4 de `ARCHITECTURE.md`, o se crea o divide un módulo.
- Una funcionalidad necesita romper una regla de la constitución o de `ARCHITECTURE.md`.

## Plantilla

```markdown
# NNNN — Título en forma de decisión

- **Estado:** Propuesto | Aceptado | Sustituido por NNNN
- **Fecha:** DD-MM-AAAA
- **Requisitos relacionados:** IDs de historias.md o de spec.md

## Contexto
## Decisión
## Alternativas consideradas
## Consecuencias
```
