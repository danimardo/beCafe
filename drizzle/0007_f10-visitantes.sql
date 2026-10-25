CREATE TABLE `preferencia_cuenta` (
	`usuario_id` text NOT NULL,
	`clave` text NOT NULL,
	`valor_en` text NOT NULL,
	PRIMARY KEY(`usuario_id`, `clave`),
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "preferencia_cuenta_clave_valida" CHECK("preferencia_cuenta"."clave" IN ('tour_inicio_visto', 'instalacion_descartada', 'oferta_avisos_vista'))
);
--> statement-breakpoint
CREATE TABLE `enlace_visitante` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`creado_por` text NOT NULL,
	`creado_en` text NOT NULL,
	`expira_en` text NOT NULL,
	`revocado_en` text,
	`revocado_por` text,
	FOREIGN KEY (`creado_por`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`revocado_por`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enlace_visitante_token_hash_unique` ON `enlace_visitante` (`token_hash`);--> statement-breakpoint
CREATE INDEX `enlace_visitante_creador` ON `enlace_visitante` (`creado_por`);--> statement-breakpoint
CREATE TABLE `visita` (
	`id` text PRIMARY KEY NOT NULL,
	`enlace_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`nombre` text,
	`nombre_eliminado_en` text,
	`creada_en` text NOT NULL,
	FOREIGN KEY (`enlace_id`) REFERENCES `enlace_visitante`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "visita_nombre_valido" CHECK("visita"."nombre" IS NULL OR (length("visita"."nombre") BETWEEN 1 AND 60 AND "visita"."nombre" = trim("visita"."nombre")))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `visita_token_hash_unique` ON `visita` (`token_hash`);--> statement-breakpoint
CREATE INDEX `visita_enlace` ON `visita` (`enlace_id`);--> statement-breakpoint
CREATE TABLE `cafe_visitante` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`visita_id` text NOT NULL,
	`tipo_capsula_id` text NOT NULL,
	`hora_gesto` text NOT NULL,
	`hora_registro` text NOT NULL,
	`estado` text NOT NULL,
	`revisado_por` text,
	`revisado_en` text,
	`coste_medio_aplicado` integer,
	`anulado_por` text,
	`anulado_en` text,
	`motivo_anulacion` text,
	FOREIGN KEY (`revisado_por`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`anulado_por`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "cafe_visitante_estado_valido" CHECK("cafe_visitante"."estado" IN ('pendiente', 'aprobado', 'rechazado', 'anulado')),
	CONSTRAINT "cafe_visitante_revision" CHECK(("cafe_visitante"."estado" = 'pendiente') = ("cafe_visitante"."revisado_por" IS NULL AND "cafe_visitante"."revisado_en" IS NULL)),
	CONSTRAINT "cafe_visitante_anulacion" CHECK(("cafe_visitante"."estado" = 'anulado') = ("cafe_visitante"."anulado_por" IS NOT NULL AND "cafe_visitante"."anulado_en" IS NOT NULL AND "cafe_visitante"."motivo_anulacion" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cafe_visitante_cliente_id_unique` ON `cafe_visitante` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `cafe_visitante_estado` ON `cafe_visitante` (`estado`,`hora_registro`);--> statement-breakpoint
CREATE INDEX `cafe_visitante_visita` ON `cafe_visitante` (`visita_id`);--> statement-breakpoint
ALTER TABLE `usuario` ADD `foto_ruta` text;