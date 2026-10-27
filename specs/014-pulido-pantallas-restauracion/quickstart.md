# Quickstart: validar F14

## Automático

```sh
npx vitest run src/lib/server/copias src/lib/shared/capsulas/orden-visita.test.ts src/lib/shared/mascota/reposo.test.ts
npm run check
node scripts/build-verificacion.mjs
npm run test:e2e:quick -- e2e/flujos/restauracion-f14.spec.ts e2e/flujos/columnas-f14.spec.ts e2e/flujos/inicio-orden-f14.spec.ts e2e/flujos/corto-f13.spec.ts
npm run verify
```

## Manual: restauración real (la hace la persona usuaria)

1. Activa las cinco variables `S3_*` de `.env` con un bucket **de pruebas** y una clave que pueda listar, leer y escribir.
2. `npm run build && node build`. Registra un café.
3. En `/admin/copias`, la lista muestra las copias. Pulsa «Restaurar» en una anterior al café.
4. Revisa el efecto, escribe tu contraseña y confirma. El proceso termina; vuelve a lanzar `node build`.
5. Comprueba:
   - El café ya no está.
   - En el bucket hay una copia nueva bajo `becafe/resguardos/`.
   - `/admin/copias` muestra la restauración.
6. Restaura la copia de resguardo y comprueba que el café vuelve.

## Manual: Capsulito y sonido

- Deja Inicio abierto 30 s: mira a los lados (4 s), pie (9,5 s), bostezo con la mano (15 s), toques en el reloj (20,5 s) y bostezo estirándose (26 s).
- Pulsa «He rellenado el agua» con la voz activa: suena agua.
