# Agente: perfil, controles y límites

Registro del agente que trabaja en beCafé. Las reglas comunes están en `AGENTS.md`. Este documento dice cómo llegan las reglas al agente, qué las hace cumplir y qué está comprobado.

Estados: **VERIFICADO** (comprobado en esta máquina), **DOCUMENTADO** (documentación oficial, sin prueba), **INFERIDO**, **NO VERIFICABLE**, **NO PRESENTE**.

## 1. Decisiones

| Decisión | Fecha |
| --- | --- |
| Solo se usa **Claude Code CLI**. OpenCode, Antigravity, Codex y Cline no se configuran | 21-10-2026 |
| Protección nativa: confirmaciones `ask` de Claude Code en `.claude/settings.json`. Sin hooks, sin aislamiento por usuario del sistema ni contenedor | 21-10-2026 |
| Spec Kit: solo la integración `claude` (por defecto) | 21-10-2026 |
| Sin cambios en `~/.claude/settings.json` y sin pruebas de los controles por ahora | 21-10-2026 |

## 2. Entorno

| Elemento | Valor | Estado |
| --- | --- | --- |
| Claude Code | 2.1.306 | VERIFICADO (`claude --version`) |
| Spec Kit | 1.2.3.dev0, integración `claude`, skills en `.claude/skills/` | VERIFICADO |
| Sistema | Debian 12, Linux 6.1, Bash | VERIFICADO |
| Windows | En uso desde el 21-10-2026. No se ha comprobado en esta sesión. Claude Code no tiene sandbox en Windows nativo | Pendiente |

## 3. Cómo llegan las instrucciones

- `CLAUDE.md` importa `@AGENTS.md` y `@.specify/memory/constitution.md`. Si existe `CLAUDE.md`, Claude Code no lee `AGENTS.md` por sí solo; por eso se importa (DOCUMENTADO).
- La constitución cuesta unos 7 000 tokens por sesión.
- Comprobación de carga: en una sesión nueva, pregunta «¿Qué versión tiene la constitución y qué dice AGENTS.md §3?» antes de que lea ningún archivo.
- **VERIFICADO** el 21-10-2026 en Linux con Claude Code 2.1.306: tras reiniciar, el agente respondió 1.6.0 y la lista de §3 sin leer archivos.

## 4. Controles

| Operación protegida | Mecanismo | Cubre | No cubre |
| --- | --- | --- | --- |
| Editar constitución, instrucciones o configuración del agente | `ask` en `.claude/settings.json` | Herramientas de edición y comandos que Claude reconoce (`sed`, `tee`, redirecciones) | Un script de Node o Python que escribe el archivo por su cuenta |
| Escribir `plan.md` o `tasks.md` (puertas de `AGENTS.md` §2) | `ask` | Igual que la fila anterior | Igual que la fila anterior |
| Commit, push, merge, reset, restore, clean | `ask` por prefijo de comando | Las formas listadas, también dentro de comandos compuestos y en modo auto (DOCUMENTADO) | Otras formas, como `/usr/bin/git push` o `sh -c 'git push'` |
| Instalar dependencias o integraciones | `ask` | `npm install`, `npm uninstall`, `specify` | Otros gestores o `npx` |
| Aprobar la propuesta de especificación o plan | Pregunta explícita al usuario y `ask` al escribir `plan.md`/`tasks.md` | La conversación actual | Depende del modelo para no avanzar antes de la respuesta |

Según la documentación de Claude Code, las reglas se evalúan en el orden deny, ask, allow: una regla `ask` del proyecto pregunta aunque una regla `allow` del usuario coincida. La aprobación de una edición dura hasta el final de la sesión y no se guarda en archivo.

## 5. Límites conocidos

- El agente se ejecuta con el mismo usuario del sistema que quien aprueba. Un proceso con ese usuario puede escribir cualquier archivo del proyecto.
- `~/.claude/settings.json` permite sin preguntar `node`, `python`, `python3`, `npx` y `git`. Por esa vía, un script puede escribir un archivo protegido sin confirmación. Se decidió no cambiarlo por ahora.
- En modo auto, los comandos sin regla los evalúa un clasificador, no el usuario.
- Ningún archivo de estado, hash ni variable demuestra una aprobación humana. Solo la confirmación nativa en la sesión la demuestra.
- La revisión de cada commit detecta después un cambio no aprobado en un archivo protegido. No lo impide.

## 6. Estado de habilitación

| Sistema | Estado |
| --- | --- |
| Linux | Configuración cargada y regla `ask` de edición comprobada en un caso (§7). **No habilitada** para operaciones protegidas: faltan el rechazo, `sed` y redirecciones, Git, cambio de sesión y modo no interactivo |
| Windows | Pendiente: repetir en Windows la comprobación de carga (§3) y las pruebas de §7 |

## 7. Pruebas pendientes

Cuando se decida probar, en una copia desechable y con operaciones inocuas:

1. Editar un archivo protegido: Claude pregunta; al rechazar, el archivo no cambia.
2. Editarlo con `sed -i` y con una redirección: Claude pregunta.
3. `git commit` y `git push` a un remoto local: Claude pregunta.
4. Tras `/clear` o en otra sesión, la aprobación anterior no se reutiliza.
5. Una corrección de bajo impacto en `src/` no se bloquea.
6. Con `claude -p`, la operación protegida se rechaza; no se aprueba sola.

| Prueba | Resultado | Fecha |
| --- | --- | --- |
| 1 (aprobar) | **PASA**: al editar `docs/agentes.md` con la herramienta Edit, Claude Code pidió confirmación con el diff y el usuario aprobó. Linux, Claude Code 2.1.306, modo auto. Hecha en el repositorio real, no en una copia | 21-10-2026 |
| 3 (aprobar) | **PASA**: un comando compuesto con `git add`, `git commit` y `git push` pidió confirmación antes de ejecutarse y el usuario aprobó. Una sola pregunta cubrió el comando entero, así que no demuestra por separado la regla de `git push` | 21-10-2026 |
| 1 y 3 (rechazar), 2, 4 a 6 | Pendientes | — |

## 8. Mantenimiento

- Al actualizar Claude Code o Spec Kit, revisa este documento y las pruebas de §7 afectadas.
- Una actualización de Spec Kit no debe sobrescribir `AGENTS.md`, `CLAUDE.md` ni `.claude/settings.json`. Revísalo con `git diff` antes de aceptarla.
- Si más adelante se usa otro CLI, se prepara su perfil con una propuesta nueva.
- Al hacer el scaffold, integra `design-system/AGENTS.md` en `docs/diseno/` para que no se confunda con el `AGENTS.md` de la raíz.
