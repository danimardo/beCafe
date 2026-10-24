CREATE TABLE `aguador_mes` (
	`mes` text NOT NULL,
	`usuario_id` text NOT NULL,
	`rellenos` integer NOT NULL,
	`determinado_en` text NOT NULL,
	PRIMARY KEY(`mes`, `usuario_id`),
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "aguador_mes_rellenos_positivos" CHECK("aguador_mes"."rellenos" > 0)
);
--> statement-breakpoint
CREATE TABLE `relleno_agua` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`registrado_en` text NOT NULL,
	`estado` text NOT NULL,
	`anulado_por` text,
	`anulado_en` text,
	`motivo_anulacion` text,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`anulado_por`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "relleno_agua_anulacion_coherente" CHECK(("relleno_agua"."estado" = 'vigente' AND "relleno_agua"."anulado_por" IS NULL AND "relleno_agua"."anulado_en" IS NULL AND "relleno_agua"."motivo_anulacion" IS NULL)
				OR ("relleno_agua"."estado" = 'anulado' AND "relleno_agua"."anulado_por" IS NOT NULL AND "relleno_agua"."anulado_en" IS NOT NULL AND "relleno_agua"."motivo_anulacion" IS NOT NULL)),
	CONSTRAINT "relleno_agua_motivo_longitud" CHECK("relleno_agua"."motivo_anulacion" IS NULL OR length("relleno_agua"."motivo_anulacion") BETWEEN 1 AND 200)
);
--> statement-breakpoint
CREATE INDEX `relleno_agua_estado_registrado` ON `relleno_agua` (`estado`,`registrado_en`);--> statement-breakpoint
CREATE INDEX `relleno_agua_usuario_registrado` ON `relleno_agua` (`usuario_id`,`registrado_en`);--> statement-breakpoint
CREATE UNIQUE INDEX `relleno_agua_cliente` ON `relleno_agua` (`cliente_id`);