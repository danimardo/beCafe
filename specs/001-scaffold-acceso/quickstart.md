# Quickstart: validar F1

Guía para comprobar de principio a fin que F1 funciona. No contiene implementación: remite a `contracts/` y a `data-model.md`. Los comandos son los de `docs/pruebas.md` §18 y funcionan igual en Windows y en Linux.

## Requisitos

- Node 24 y npm 11 (`.nvmrc`).
- Navegadores de Playwright instalados (`npx playwright install`). Es una instalación local: la persona la confirma.
- En Windows, opcional: una persona administradora ejecuta `scripts/dev-windows-defender-exclusions.ps1` (`docs/pruebas.md` §17.5).

## 1. Preparación del proyecto

```text
npm ci
npm run verify
```

**Se espera:**
- formato, lint, tipos, arquitectura, pruebas con cobertura, componentes y build en serie;
- cero advertencias y al menos una prueba en cada proyecto.

**Comprobaciones a mano:**
- `git status` no muestra `.env`, `*.db`, `.local/` ni `src/tokens.css`;
- `design-system/` ya no existe;
- `docs/diseno/README.md` contiene las reglas obligatorias y el commit para recuperar las pantallas de referencia.

## 2. Primer arranque (CA-139)

1. Copia `.env.example` a `.env` y define `ADMIN_INICIAL_EMAIL` y `ADMIN_INICIAL_NOMBRE` (`contracts/entorno-y-eventos.md`).
2. Ejecuta `npm run build` y luego `node build` (o `npm run dev`).
3. **Se espera:**
   - la consola muestra `auth.admin_inicial_creado` y el enlace de invitación;
   - `.local/datos/logs/` contiene el evento, pero no el enlace.
4. Reinicia. **Se espera:** no se crea ningún usuario nuevo ni aparece otro enlace.
5. Borra `.local/datos/becafe.db`, quita `ADMIN_INICIAL_NOMBRE` y arranca. **Se espera:** la aplicación no arranca y registra `app.entorno_invalido` con el nombre de la variable.

## 3. Acceso y privacidad (CA-132, CA-133, CA-160)

1. Abre el enlace del paso 2 y define una contraseña de 14 caracteres. **Se espera:** se rechaza.
2. Define una de 15 caracteres. **Se espera:** entras y ves `/aceptar-privacidad`, sin navegación.
3. Pulsa «He leído el texto». **Se espera:** llegas a `/`.
4. Vuelve a abrir el mismo enlace. **Se espera:** «Enlace no válido o caducado».
5. Cierra la sesión e intenta entrar 5 veces con una contraseña incorrecta, y una sexta con la correcta. **Se espera:** el mismo mensaje en los seis intentos, sin indicar si la cuenta existe.

## 4. Administración de usuarios (CA-130, CA-131, CA-134, CA-136, CA-138, CA-139c)

1. En `/admin/usuarios`, da de alta a Pedro como miembro. **Se espera:** aparece un enlace de 24 h para copiar.
2. Intenta quitarte el rol de administrador. **Se espera:** `ULTIMO_ADMIN`.
3. Repite los pasos 1 y 2 con JavaScript desactivado. **Se espera:** el mismo resultado (proyecto `sin-js`).
4. La reautenticación (más de 15 minutos) y la reactivación se comprueban en integración, con reloj fijo (`docs/pruebas.md` §14.1).

## 5. Apariencia (CA-180, CA-181, EV-061)

1. En `/perfil`, escribe en el campo de contraseña y cambia a «Claro». **Se espera:** el texto y el foco se conservan. Al recargar, sigue en claro.
2. Activa «Reducir transparencia». **Se espera:** ninguna superficie tiene `backdrop-filter`.
3. La suite automática: `npm run test:e2e:quick -- e2e/a11y`.

## 6. Cabeceras e indexación (RNF-016, RNF-006)

```text
curl -i http://localhost:3000/robots.txt
curl -i http://localhost:3000/login
```

**Se espera:**
- `Disallow: /` en `/robots.txt`;
- `X-Robots-Tag: noindex, nofollow` en las dos respuestas;
- la cabecera CSP;
- `Referrer-Policy: strict-origin`.

La suite `api` lo comprueba también en una ruta con sesión y comprueba que un POST desde otro origen recibe 403.

## 7. Puerta de F1

```text
scripts/benchmark.sh        # Linux
scripts/benchmark.ps1       # Windows
```

**Se espera:** la verificación completa y las E2E pasan en serie en los cinco proyectos (`docs/pruebas.md` §20.2).

**Antes de cerrar F1:**
- revisión manual con VoiceOver y TalkBack, anotada en `tasks.md`;
- informe del número de archivos de TypeScript.
