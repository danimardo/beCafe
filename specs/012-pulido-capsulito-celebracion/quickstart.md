# Quickstart: validar F12

## Comprobaciones automáticas

```bash
npm run check
npx vitest run src/lib/server/economia/dominio/orden-inicio.test.ts src/lib/server/economia/control.test.ts src/lib/server/notificaciones
npx vitest run src/lib/shared/mascota scripts/
npm run test:browser -- CopyField Capsulito Confeti
node scripts/build-verificacion.mjs
npm run test:e2e:quick -- e2e/flujos/f12-*.spec.ts
npm run verify   # cambia un contrato público (push.ts) y un caso de uso económico
```

Al cerrar la funcionalidad: `scripts/benchmark.sh`.

## Recorrido manual

1. **Celebración.** Abre Inicio con la voz activa y toca una cápsula. Comprueba que salta el confeti, suena el sonido y después se oye la frase. Toca otra cápsula enseguida: el sonido anterior se corta. Repite con la voz silenciada, con movimiento reducido y en modo avión, donde no debe haber celebración.
2. **Copiar enlace.** Abre `http://<ip-del-servidor>:<puerto>/admin/usuarios`, da de alta a una persona y pulsa «Copiar enlace». Pega el enlace en otra aplicación.
3. **Enlace junto al botón.** Pulsa «Generar enlace» en una ficha: el enlace sale debajo del botón y la vista baja hasta él. Repite sin JavaScript.
4. **Tour.** En `/?tour=si` con la voz activa, mueve la boca el Capsulito de la tarjeta y el de arriba se queda quieto.
5. **Orden.** Con dos cuentas que toman cápsulas distintas, cada una ve primero la suya.
6. **Recuento.** Registra un recuento con un faltante. Entra con otra cuenta y comprueba el aviso en Inicio y en el panel. Pulsa «Entendido», recarga y comprueba que ya no sale en Inicio.
7. **Acceso con enlace.** Abre un enlace de invitación y escribe la contraseña: Capsulito se tapa los ojos.
8. **Bienvenida.** Recorre la bienvenida desde Ayuda: tiene 9 escenas y la quinta es «el dinero».
9. **Reposo.** Deja Inicio abierto 30 s y comprueba el parpadeo y los gestos a los 6, 12, 16 y 21 s. Con movimiento reducido, Capsulito queda quieto.

## Revisión manual obligatoria (constitución XI)

- TalkBack en Android: anuncio del enlace generado, aviso de recuento y «Entendido», escena nueva y celebración. El confeti no se anuncia; el mensaje de confirmación sí.
- VoiceOver en iOS: pendiente por falta de dispositivo, como en F11.
