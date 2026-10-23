CREATE TABLE `tipo_capsula` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`nombre_normalizado` text NOT NULL,
	`marca` text NOT NULL,
	`intensidad` integer,
	`color` text NOT NULL,
	`foto_ruta` text,
	`estado` text NOT NULL,
	`creado_en` text NOT NULL,
	`actualizado_en` text NOT NULL,
	CONSTRAINT "tipo_capsula_estado_valido" CHECK("tipo_capsula"."estado" IN ('activo', 'retirado')),
	CONSTRAINT "tipo_capsula_intensidad_valida" CHECK("tipo_capsula"."intensidad" IS NULL OR "tipo_capsula"."intensidad" BETWEEN 1 AND 13),
	CONSTRAINT "tipo_capsula_nombre_valido" CHECK(length("tipo_capsula"."nombre") BETWEEN 1 AND 60)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tipo_capsula_nombre_activo` ON `tipo_capsula` (`nombre_normalizado`) WHERE "tipo_capsula"."estado" = 'activo';--> statement-breakpoint
CREATE TABLE `entrada_stock_bajo` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo_capsula_id` text NOT NULL,
	`registrada_en` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `entrada_stock_bajo_tipo` ON `entrada_stock_bajo` (`tipo_capsula_id`);--> statement-breakpoint
CREATE TABLE `existencia` (
	`tipo_capsula_id` text PRIMARY KEY NOT NULL,
	`umbral_minimo` integer NOT NULL,
	`stock` integer NOT NULL,
	`coste_medio` integer,
	`en_stock_bajo` integer NOT NULL,
	CONSTRAINT "existencia_umbral_valido" CHECK("existencia"."umbral_minimo" >= 0),
	CONSTRAINT "existencia_coste_medio_valido" CHECK("existencia"."coste_medio" IS NULL OR "existencia"."coste_medio" >= 0)
);
