# Quickstart: validar F11

Requisitos: `npm ci`, `npm run dev` (aplica las migraciones al arrancar), una cuenta administradora y otra de miembro, y al menos tres tipos comprados: uno con stock alto, uno en stock bajo y otro con stock 0.

## Comprobaciones automáticas

| Qué | Comando |
| --- | --- |
| Ciclo de frases (propiedades y concurrencia) | `npx vitest run src/lib/server/usuarios/dominio/ciclo-frases.test.ts src/lib/server/usuarios/frases.test.ts` |
| Catálogo de frases idéntico al anexo | `npx vitest run src/lib/shared/mascota/frases.test.ts` |
| Acciones de Inicio, compras, alta y Ajustes | `npm run test:changed` |
| Pantallas y flujos | `npm run test:e2e:quick -- e2e/flujos/inicio-f11.spec.ts e2e/sin-js/inicio-f11.spec.ts e2e/a11y/f11.spec.ts` |
| Cierre de la funcionalidad | `scripts/benchmark.sh` |

## Recorrido manual

1. **Inicio (US1)**: en un móvil de 390 px, Capsulito arriba, cápsulas sin desplazar, «Quedan pocas» en el tipo en stock bajo, «Sin stock» atenuado en el tipo con 0. Tocar el de 0: diálogo; «Cancelar» no registra; «Sí, registrar» registra con descuadre. Repetir con JavaScript desactivado: página intermedia.
2. **Frases (US3)**: registrar un café propio y otro de invitado: frase de `frases.md` en el bocadillo (y voz si hay audio). Recargar Inicio: no hay saludo si pasaron menos de 2 horas (para probarlo antes, borrar las filas `saludo` de `frase_entregada` en la base de desarrollo).
3. **Compras (US2)**: cantidad sin importe con la hucha en negativo → error en el campo, sin diálogo. Contar los enlaces de la barra lateral: uno por destino.
4. **Tour (US2)**: en Inicio, «Ayuda» → «Repetir el tour» → primer paso.
5. **Ajustes y Perfil (US4)**: con el miembro, «Ajustes» contiene tema, transparencia, Capsulito, voz, avisos e instalación; Perfil, datos, foto, contraseña y sesiones en dos columnas a 1440 px. Alta de usuario con foto. Persona sin foto: ilustración.
6. **Entrada (US5)**: escribir el correo (Capsulito mira), pasar a la contraseña (se tapa), contraseña errónea (triste), correcta (celebra). Con movimiento reducido: imagen quieta.
7. **Errores (US7)**: `/no-existe` (404), una ruta de administración con el miembro (403), `/estadisticas?periodo=x` (400).
8. **Microinteracciones (US8)**: foco en un campo, error tras enviar, cambiar de tema, pasar el ratón por una tarjeta, guardar Perfil, registrar una aportación y ver la cifra. Repetir con `prefers-reduced-motion: reduce`.
9. **Voces**: `./voces.sh` → «Ver el estado» muestra las 196 locuciones nuevas como pendientes.

## Revisión manual obligatoria (constitución XI)

TalkBack en Android sobre Inicio, Ajustes, la entrada y una página de error. VoiceOver queda pendiente por falta de iPhone (como en F10).
