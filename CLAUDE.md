# CLAUDE.md — beCafé

Las reglas comunes están en `AGENTS.md` y la constitución en `.specify/memory/constitution.md`. Las dos se cargan aquí:

@AGENTS.md
@.specify/memory/constitution.md

## Solo para Claude Code

- Los comandos de Spec Kit son skills de `.claude/skills/` (`/speckit-specify`, `/speckit-plan`, …).
- Las preguntas de permiso de Claude Code son la confirmación nativa de §2 de `AGENTS.md`. No pidas al usuario que elija «Sí, y no volver a preguntar» para un archivo protegido.
- Si necesitas que el usuario ejecute un comando, propón `! <comando>`. No lo ejecutes tú en su lugar.
- El estado de los controles de Claude y sus límites está en `docs/agentes.md`.
