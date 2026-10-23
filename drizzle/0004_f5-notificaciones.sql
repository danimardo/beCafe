CREATE TABLE `entrega_push` (
	`id` text PRIMARY KEY NOT NULL,
	`notificacion_id` text NOT NULL,
	`suscripcion_id` text NOT NULL,
	`estado` text NOT NULL,
	`intentos` integer DEFAULT 0 NOT NULL,
	`proximo_intento` text NOT NULL,
	`ultimo_codigo` integer,
	FOREIGN KEY (`notificacion_id`) REFERENCES `notificacion`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`suscripcion_id`) REFERENCES `suscripcion_push`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "entrega_push_intentos_validos" CHECK("entrega_push"."intentos" >= 0)
);
--> statement-breakpoint
CREATE INDEX `entrega_push_estado_proximo` ON `entrega_push` (`estado`,`proximo_intento`);--> statement-breakpoint
CREATE UNIQUE INDEX `entrega_push_unica` ON `entrega_push` (`notificacion_id`,`suscripcion_id`);--> statement-breakpoint
CREATE TABLE `notificacion` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`tipo` text NOT NULL,
	`datos` text NOT NULL,
	`origen_id` text,
	`creada_en` text NOT NULL,
	`vista_en` text,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `notificacion_usuario_creada` ON `notificacion` (`usuario_id`,`creada_en`);--> statement-breakpoint
CREATE INDEX `notificacion_usuario_tipo_creada` ON `notificacion` (`usuario_id`,`tipo`,`creada_en`);--> statement-breakpoint
CREATE TABLE `preferencia_notificacion` (
	`usuario_id` text NOT NULL,
	`tipo` text NOT NULL,
	`activada` integer NOT NULL,
	PRIMARY KEY(`usuario_id`, `tipo`),
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `suscripcion_push` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`clave_p256dh` text NOT NULL,
	`clave_auth` text NOT NULL,
	`creada_en` text NOT NULL,
	`actualizada_en` text NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `suscripcion_push_endpoint_unique` ON `suscripcion_push` (`endpoint`);--> statement-breakpoint
CREATE TABLE `ejecucion_tarea` (
	`tarea` text NOT NULL,
	`periodo` text NOT NULL,
	`ejecutada_en` text NOT NULL,
	PRIMARY KEY(`tarea`, `periodo`)
);
