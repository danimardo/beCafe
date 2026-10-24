# Respuestas para `/speckit-clarify` (sesión de diseño, 24-10-2026)

Decididas por Daniel. Copia este fichero también a `docs/diseno/f9/decisiones-clarify.md`. Durante `/speckit-clarify`, cada pregunta que se responda aquí se anota en *Clarifications* con esta respuesta, sin volver a preguntar.

| # | Pregunta | Respuesta | Referencia |
| --- | --- | --- | --- |
| 1 | ¿Hay que montar la navegación o ya existe? | **Hay que montarla**: en la app desplegada no aparece (capturas del 24-10-2026). Si al implementar resulta que el `AppShell` existe pero no se pinta, se arregla la causa. | HALL-017, RF-182 |
| 2 | ¿Qué hay entre 768 y 1023 px? | Carril de iconos de 96 px con etiqueta corta («Arqueos», «Ajustes», «Copias» en administración). | RF-182, DEC-108 |
| 3 | ¿Qué pantallas van en dos columnas? | Inicio, Saldos, Historial, Compras y Estadísticas, desde 1024 px. Perfil, Ayuda y Privacidad siguen a 672 px; Administración, a 1024 px. | RF-183 |
| 4 | ¿Orden de Inicio en móvil? | Resumen de dinero (hucha, saldo y la línea de stock bajo), **cápsulas**, agua y «Tus últimos consumos». | RF-184, DEC-111 |
| 5 | ¿Cómo se ve un tipo sin foto? | Ilustración de cápsula de su color (`CapsuleIllustration`). | RF-185, DEC-109 |
| 6 | ¿Lista o tarjetas en Inicio? | Tarjetas (`CapsuleTile`): 2 columnas en móvil, 3 desde 640 px y `auto-fill minmax(11rem, 1fr)` en escritorio. `CapsuleRow` queda para listas densas. | RF-185 |
| 7 | ¿Cristal en las tarjetas y en el bocadillo? | Sí, con la enmienda de XVIII. Los formularios y el resto de listas no llevan cristal. | DEC-113 |
| 8 | ¿Sale la mascota en cada café? | No. El café sigue con su aviso de cápsula. Solo los momentos de RF-186. | DEC-107 |
| 9 | ¿Cómo se sabe que es el primer consumo o que se ha saldado la deuda? | Primer consumo: el `load` de Inicio entrega `esPrimerConsumo` (la persona no tiene consumos vigentes); tras registrar con éxito, si era `true`, se celebra. Deuda saldada: tras una aportación con éxito, saldo anterior < 0 y nuevo ≥ 0. Sin cambios en `/api/consumos` ni en el esquema. | RF-186 |
| 10 | ¿Dónde se guarda «Mostrar a Capsulito»? | En el dispositivo, clave `becafe-mascota` (`visible` \| `oculta`). Lo aplica el script de `app.html` como `data-mascota`, igual que tema y transparencia (F1, R4). | RF-187, DEC-110 |
| 11 | ¿Bienvenida sin JavaScript? | No se abre. Los 4 pasos están fijos en `/ayuda` («Cómo funciona»). El botón «Ver la bienvenida» solo aparece con JavaScript. | RF-188, DEC-112 |
| 12 | ¿Dónde se guarda que la bienvenida ya se vio? | En el dispositivo, clave `becafe-bienvenida` = `vista`. No va a la base de datos. | RF-188 |
| 13 | ¿Formato de las imágenes de la mascota? | WebP en 128, 256, 512 y 1024 px, con `srcset`. No usar los SVG del pack original. | DEC-106, HALL-018 |
| 14 | ¿Se cambian textos ya especificados (por ejemplo «Ristretto registrado»)? | **No.** Se mantienen los textos de F1–F8 y sus pruebas. Lo único nuevo son las frases de Capsulito y la línea de ayuda de Inicio («Toca para apuntar tu café · [icono] para un invitado»). | Principio I |
| 15 | ¿Pruebas con usuarios? | No hay (DEC-097). Revisión con VoiceOver y TalkBack antes de cerrar, como en F1. | DEC-097 |
| 16 | ¿Gamificación? | Fuera de F9 (PEND-037). | DEC-114 |
