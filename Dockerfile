# Imagen de beCafé (plan F8 D9, RT-003, RT-010). Varias etapas: la final no lleva herramientas de compilación.
FROM node:24-bookworm-slim AS base
WORKDIR /app

# Herramientas para compilar `better-sqlite3` si no hay binario precompilado. No llegan a la imagen final.
FROM base AS herramientas
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Etapa de construcción: compila la aplicación en `build/`.
FROM herramientas AS construccion
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# SvelteKit valida `src/env.ts` también al construir. `DIRECTORIO_DATOS` y `TZ` son solo para la compilación.
# `ORIGIN` NO es solo de compilación: `vite.config.ts` lo graba en `kit.paths.origin` y de ahí sale la comprobación CSRF
# de los formularios en ejecución. Pasa la dirección pública real como argumento de compilación (Coolify lo hace con
# las variables de la aplicación); el valor por defecto solo sirve para construir sin dirección, por ejemplo en la CI.
ARG ORIGIN=https://construccion.invalid
ENV ORIGIN=$ORIGIN \
	DIRECTORIO_DATOS=/tmp/construccion \
	TZ=Europe/Madrid
ARG GIT_COMMIT=desconocido
ENV GIT_COMMIT=$GIT_COMMIT
RUN npm run build
# Comandos de servidor (`recuperar-admin.js`, RF-139b). La imagen final no lleva `vite`: se compilan aquí.
RUN npm run build:comandos

# Etapa de dependencias de producción: instalación limpia, sin las de desarrollo.
FROM herramientas AS dependencias
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Imagen final: misma base (misma libc), sin compiladores, usuario sin privilegios y volumen `/data`.
FROM base AS final
ENV NODE_ENV=production \
	TZ=Europe/Madrid \
	DIRECTORIO_DATOS=/data \
	HOST=0.0.0.0 \
	PORT=3000
COPY --from=dependencias --chown=node:node /app/node_modules ./node_modules
COPY --from=construccion --chown=node:node /app/build ./build
COPY --from=construccion --chown=node:node /app/build-scripts ./build-scripts
COPY --from=construccion /app/package.json ./package.json
COPY --from=construccion /app/drizzle ./drizzle
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
	CMD node -e "fetch('http://127.0.0.1:3000/api/salud').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "build/index.js"]
