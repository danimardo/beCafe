# Quickstart: validar F10

## Preparación

```bash
npm ci
DIRECTORIO_DATOS=./datos npm run db:migrate
npm run dev
```

Para E2E, reconstruir la build antes de las pruebas:

```bash
ORIGIN=http://127.0.0.1:4300 DIRECTORIO_DATOS=<tmp> npm run build && npm run build:comandos
```

## Escenarios

1. **Visitante** (CA-189 a CA-194): como miembro, abre `/visitantes`, crea un enlace y ábrelo en otra ventana privada. Escribe un nombre, registra un café: aparece «Pendiente de aprobación» y el stock no cambia. Como administrador, aprueba en `/admin/visitantes`: el stock baja 1 y ningún saldo cambia. Intenta abrir `/saldos` con la cookie de visitante: vuelves a `/visita`.
2. **Compra rápida** (CA-197, CA-198): en `/compras`, sube dos tipos con «+», escribe sus importes y comprueba el total. Con una hucha baja, «Registrar» abre el diálogo con saldo, importe y resultado. Repite con JavaScript desactivado: aparece el paso intermedio.
3. **Aportaciones** (CA-199, CA-200): como administrador, en `/saldos`, registra una aportación «Para» otra persona; su total aportado sube y el detalle muestra quién la registró.
4. **Estadísticas** (CA-201, CA-202): como miembro, `/estadisticas` muestra cafés por persona, por tipo, por mes con visitantes aparte y la evolución de la hucha; «Ver datos» abre las tablas.
5. **Ayuda** (CA-203 a CA-205): pulsa «?» en cualquier pantalla; sin JavaScript lleva a `/ayuda#<pantalla>`. En una cuenta nueva, tras la bienvenida, aparece el tour de Inicio una sola vez.
6. **Primer contacto** (CA-195, CA-206, CA-207): en un perfil de navegador limpio, `/login` muestra la bienvenida con «Empezar». Tras entrar, Inicio ofrece instalar la aplicación y Capsulito ofrece activar avisos una vez.
7. **Fotos** (CA-208, CA-209): sube una foto en `/perfil`; aparece en Saldos y Estadísticas. Sin foto, las iniciales usan siempre el mismo color.

## Comprobaciones

| Momento | Comando |
| --- | --- |
| Por lote | `npm run test:changed`, `npm run lint:changed`, `npm run check`, `npm run test:e2e:quick -- <spec>` |
| Tras la migración y `hooks.server.ts` | `npm run verify` |
| Cierre de F10 | `scripts/benchmark.sh` |
